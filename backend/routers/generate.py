import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import redis

from ..database import get_db
from ..models import Campaign, Job, User, BatchJob
from ..schemas import CampaignCreate, JobStatusDetails, CampaignResponse, RecompositeRequest, BatchJobResponse
from ..tasks import generate_ad_campaign_task
from .auth import get_current_user

router = APIRouter(prefix="/api", tags=["generation"])

# Connect to Redis for Rate Limiting (we'll implement this as a dependency)
REDIS_URL = "redis://redis:6379/0"
try:
    redis_client = redis.Redis.from_url(REDIS_URL)
except Exception:
    redis_client = None

def check_rate_limit(request: Request):
    """
    Rate limiter: 10 requests per minute per IP address.
    """
    if not redis_client:
        return  # Bypass rate limiting if Redis is not available
        
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"
    
    try:
        current = redis_client.get(key)
        if current is not None and int(current) >= 10:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Maximum 10 requests per minute allowed."
            )
            
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, 60)
        pipe.execute()
    except redis.exceptions.RedisError as e:
        # Log error but don't crash in case of Redis failure
        print(f"Redis rate limit error: {e}")

@router.post("/generate-content", response_model=JobStatusDetails, dependencies=[Depends(check_rate_limit)])
def generate_content(
    campaign_in: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initiates ad content generation asynchronously. Creates campaign & job records
    and dispatches tasks to Celery workers.
    """
    # 1. Create the campaign entry
    db_campaign = Campaign(
        user_id=current_user.id,
        brief=campaign_in.brief,
        platform=campaign_in.platform,
        persona=campaign_in.persona,
        theme=campaign_in.theme,
        competitor_url=campaign_in.competitor_url,
        original_campaign_id=campaign_in.original_campaign_id,
        approval_status="PENDING_APPROVAL",
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)

    # 2. Create a unique job ID
    job_id = str(uuid.uuid4())
    db_job = Job(
        id=job_id,
        campaign_id=db_campaign.id,
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # 3. Trigger Celery Task with local background thread fallback if Redis is offline
    task_kwargs = {
        "job_id": job_id,
        "campaign_id": db_campaign.id,
        "brief": db_campaign.brief,
        "platform": db_campaign.platform,
        "persona": db_campaign.persona,
        "theme": db_campaign.theme,
        "template": campaign_in.template or "square",
        "scarcity_fomo": campaign_in.scarcity_fomo or False,
        "ugc_style": campaign_in.ugc_style or False,
        "competitor_url": campaign_in.competitor_url
    }
    
    try:
        generate_ad_campaign_task.apply_async(
            kwargs=task_kwargs,
            task_id=job_id
        )
    except Exception as e:
        print(f"Celery dispatch failed (Redis offline): {e}. Running task synchronously via background thread.")
        import threading
        thread = threading.Thread(
            target=generate_ad_campaign_task,
            kwargs=task_kwargs
        )
        thread.start()

    # 4. Return details
    return JobStatusDetails(
        job_id=db_job.id,
        status=db_job.status,
        created_at=db_job.created_at,
        completed_at=db_job.completed_at,
        campaign=CampaignResponse.model_validate(db_campaign)
    )

@router.get("/job-status/{job_id}", response_model=JobStatusDetails)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the current status of the campaign generation job.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    campaign = db.query(Campaign).filter(
        Campaign.id == job.campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Job/Campaign not found or access denied")
    
    return JobStatusDetails(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
        completed_at=job.completed_at,
        campaign=CampaignResponse.model_validate(campaign)
    )

@router.post("/recomposite/{campaign_id}", response_model=CampaignResponse)
def recomposite_campaign(
    campaign_id: int,
    req: RecompositeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Re-composites the ad banner with custom/edited ad copy without calling DALL-E again.
    """
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found or access denied")
        
    # Generate unique filename for the updated asset
    new_job_id = f"edit_{uuid.uuid4().hex[:8]}"
    filename = f"{new_job_id}.jpg"
    
    from ..image_gen import generate_local_placeholder
    
    try:
        # Re-render the image locally with the updated text and original styling configurations
        local_url = generate_local_placeholder(
            brief=campaign.brief,
            platform=campaign.platform,
            persona=campaign.persona,
            text_copy=req.text_copy,
            filename=filename,
            theme=campaign.theme
        )
        
        # Update db records
        campaign.text_copy = req.text_copy
        campaign.image_url = local_url
        db.commit()
        db.refresh(campaign)
        
        # Sync update to Google Sheets if configured
        from ..tasks import sync_campaign_to_google_sheet
        sync_campaign_to_google_sheet(campaign)
        
        return campaign
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to recomposite visual: {str(e)}")

import csv
import io
from fastapi import UploadFile, File

@router.post("/generate/bulk-upload")
def bulk_upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")
        
    content = file.file.read().decode("utf-8")
    csv_reader = csv.DictReader(io.StringIO(content))
    
    batch = BatchJob(
        user_id=current_user.id,
        status="PROCESSING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    
    campaigns_created = []
    
    for row in csv_reader:
        brief = row.get("brief", "").strip()
        platform = row.get("platform", "Instagram").strip()
        persona = row.get("persona", "Witty").strip()
        theme = row.get("theme", "indigo").strip()
        template = row.get("template", "square").strip()
        scarcity_fomo = row.get("scarcity_fomo", "false").lower() == "true"
        ugc_style = row.get("ugc_style", "false").lower() == "true"
        
        if not brief:
            continue
            
        campaign = Campaign(
            user_id=current_user.id,
            batch_job_id=batch.id,
            brief=brief,
            platform=platform,
            persona=persona,
            theme=theme,
            approval_status="APPROVED", # Auto-approved for bulk uploads
            status="PENDING",
            created_at=datetime.datetime.utcnow()
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            campaign_id=campaign.id,
            status="PENDING",
            created_at=datetime.datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        task_kwargs = {
            "job_id": job_id,
            "campaign_id": campaign.id,
            "brief": brief,
            "platform": platform,
            "persona": persona,
            "theme": theme,
            "template": template,
            "scarcity_fomo": scarcity_fomo,
            "ugc_style": ugc_style
        }
        
        try:
            generate_ad_campaign_task.apply_async(kwargs=task_kwargs, task_id=job_id)
        except Exception:
            import threading
            thread = threading.Thread(target=generate_ad_campaign_task, kwargs=task_kwargs)
            thread.start()
            
        campaigns_created.append(campaign)
        
    if not campaigns_created:
        batch.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=400, detail="CSV file had no valid campaign rows.")
        
    return {
        "batch_id": batch.id,
        "status": batch.status,
        "campaign_count": len(campaigns_created)
    }

@router.get("/generate/batches")
def get_user_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import desc
    batches = db.query(BatchJob).filter(BatchJob.user_id == current_user.id).order_by(desc(BatchJob.created_at)).all()
    
    res = []
    for b in batches:
        campaigns = db.query(Campaign).filter(Campaign.batch_job_id == b.id).all()
        total = len(campaigns)
        success = len([c for c in campaigns if c.status == "SUCCESS"])
        failed = len([c for c in campaigns if c.status == "FAILED"])
        processing = len([c for c in campaigns if c.status == "PROCESSING"])
        pending = len([c for c in campaigns if c.status == "PENDING"])
        
        if total > 0 and success == total:
            b.status = "SUCCESS"
        elif total > 0 and (failed + success) == total and failed > 0:
            b.status = "PARTIAL"
        elif total > 0 and failed == total:
            b.status = "FAILED"
        else:
            b.status = "PROCESSING"
        db.commit()
        
        res.append({
            "id": b.id,
            "status": b.status,
            "created_at": b.created_at,
            "total": total,
            "success": success,
            "failed": failed,
            "processing": processing,
            "pending": pending
        })
    return res

@router.get("/generate/batch/{batch_id}")
def get_batch_detail(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batch = db.query(BatchJob).filter(BatchJob.id == batch_id, BatchJob.user_id == current_user.id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch job not found")
        
    campaigns = db.query(Campaign).filter(Campaign.batch_job_id == batch_id).all()
    return {
        "batch_id": batch.id,
        "status": batch.status,
        "created_at": batch.created_at,
        "campaigns": [
            {
                "id": c.id,
                "brief": c.brief,
                "platform": c.platform,
                "persona": c.persona,
                "status": c.status,
                "text_copy": c.text_copy,
                "image_url": c.image_url
            } for c in campaigns
        ]
    }
