import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import func, text, case
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..models import Campaign, Job, User
from ..schemas import AnalyticsSummary, PlatformPerformance, PersonaDistribution, DailyTrend
from .auth import get_current_user

router = APIRouter(prefix="/api", tags=["analytics"])

@router.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a unified analytics summary payload compiling all five pre-built SQL query outputs.
    """
    # 1. Basic Stats
    total_campaigns = db.query(Campaign).filter(Campaign.user_id == current_user.id).count()
    
    # Today's campaigns
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(Campaign).filter(Campaign.user_id == current_user.id, Campaign.created_at >= today_start).count()
    
    # Success vs Failed counts
    successful_count = db.query(Campaign).filter(Campaign.user_id == current_user.id, Campaign.status == "SUCCESS").count()
    failed_count = db.query(Campaign).filter(Campaign.user_id == current_user.id, Campaign.status == "FAILED").count()
    
    success_rate = (successful_count / total_campaigns * 100) if total_campaigns > 0 else 0.0

    # 2. SQL 1: Top performing platforms
    # Query: SELECT platform, COUNT(*), SUM(SUCCESS) ... GROUP BY platform
    platform_query = db.query(
        Campaign.platform,
        func.count(Campaign.id).label("total"),
        func.sum(case((Campaign.status == 'SUCCESS', 1), else_=0)).label("successes")
    ).filter(Campaign.user_id == current_user.id).group_by(Campaign.platform).all()
    
    platform_performance = []
    for row in platform_query:
        plat, tot, succ = row
        rate = (succ / tot * 100) if tot > 0 else 0.0
        platform_performance.append(
            PlatformPerformance(platform=plat, total_campaigns=tot, success_rate=round(rate, 2))
        )
    # Sort by total campaigns descending
    platform_performance.sort(key=lambda x: x.total_campaigns, reverse=True)

    # 3. SQL 2: Brand persona usage distribution
    persona_query = db.query(
        Campaign.persona,
        func.count(Campaign.id).label("count")
    ).filter(Campaign.user_id == current_user.id).group_by(Campaign.persona).all()
    
    persona_distribution = [
        PersonaDistribution(persona=row[0], count=row[1]) for row in persona_query
    ]

    # 4. SQL 3: Daily campaign generation trend (last 30 days)
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    
    # Using SQL-like grouping by date
    daily_query = db.query(
        func.date(Campaign.created_at).label("date_val"),
        func.count(Campaign.id).label("total"),
        func.sum(case((Campaign.status == 'SUCCESS', 1), else_=0)).label("success"),
        func.sum(case((Campaign.status == 'FAILED', 1), else_=0)).label("failed")
    ).filter(Campaign.user_id == current_user.id, Campaign.created_at >= thirty_days_ago)\
     .group_by("date_val")\
     .order_by("date_val")\
     .all()
      
    daily_trends = []
    for row in daily_query:
        date_str = str(row[0]) if row[0] else ""
        daily_trends.append(
            DailyTrend(
                date=date_str,
                total_generated=row[1],
                successful=row[2] or 0,
                failed=row[3] or 0
            )
        )

    # 5. SQL 4: Average generation time per job
    # Fetch job durations for current user's campaigns
    jobs = db.query(Job.created_at, Job.completed_at).join(Campaign).filter(
        Campaign.user_id == current_user.id,
        Job.status == "SUCCESS",
        Job.completed_at.isnot(None)
    ).all()
    
    avg_gen_time = 0.0
    if jobs:
        total_duration = sum((j.completed_at - j.created_at).total_seconds() for j in jobs)
        avg_gen_time = total_duration / len(jobs)

    # 6. NLP Brief Keyword Analysis
    campaigns_all = db.query(Campaign).filter(Campaign.user_id == current_user.id).all()
    STOP_WORDS = {
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
        'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
        'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
        'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
        'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
        'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
        'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
        'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
        'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
        'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
        'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
        'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
        'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
        'yourselves', 'for', 'with', 'brief', 'sleek', 'modern', 'highlight', 'using', 'ad', 'ads', 'campaign', 'brand',
        'new', 'best', 'great'
    }
    
    import re
    from collections import Counter
    words = []
    for c in campaigns_all:
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', c.brief.lower())
        tokenized = cleaned.split()
        for w in tokenized:
            if w not in STOP_WORDS and len(w) > 2:
                words.append(w)
                
    counter = Counter(words)
    top_items = counter.most_common(10)
    top_keywords = [{"keyword": k, "count": v} for k, v in top_items]

    return AnalyticsSummary(
        total_campaigns=total_campaigns,
        today_count=today_count,
        success_rate=round(success_rate, 2),
        avg_gen_time_seconds=round(avg_gen_time, 2),
        failed_count=failed_count,
        successful_count=successful_count,
        platform_performance=platform_performance,
        persona_distribution=persona_distribution,
        daily_trends=daily_trends,
        top_keywords=top_keywords
    )

@router.get("/analytics/top-campaigns", response_model=List[Dict[str, Any]])
def get_top_campaigns(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns top recent campaigns with basic display info for dashboard tables.
    """
    campaigns = db.query(Campaign).filter(Campaign.user_id == current_user.id).order_by(Campaign.created_at.desc()).limit(limit).all()
    results = []
    for c in campaigns:
        # Calculate generation time if job exists
        job = db.query(Job).filter(Job.campaign_id == c.id).first()
        gen_time = 0.0
        if job and job.completed_at and job.created_at:
            gen_time = (job.completed_at - job.created_at).total_seconds()
            
        results.append({
            "id": c.id,
            "brief": c.brief,
            "platform": c.platform,
            "persona": c.persona,
            "text_copy": c.text_copy,
            "image_url": c.image_url,
            "status": c.status,
            "created_at": c.created_at,
            "generation_time_sec": round(gen_time, 2)
        })
    return results
