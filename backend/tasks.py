import os
import sys
import datetime
import requests
from celery import Celery

# Reconfigure stdout/stderr to use UTF-8 to prevent charmap/encoding crashes on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from .database import SessionLocal
from .models import Campaign, Job
from .ai_agent import refine_prompt, generate_ad_copy
from .image_gen import generate_dalle_image

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

def sync_campaign_to_google_sheet(campaign):
    """
    Sends generated campaign details to a Google Apps Script Webhook.
    """
    google_sheet_url = os.getenv("GOOGLE_SHEET_WEBHOOK_URL", "")
    if not google_sheet_url:
        return
        
    try:
        payload = {
            "id": campaign.id,
            "created_at": campaign.created_at.strftime("%Y-%m-%d %H:%M:%S") if campaign.created_at else "",
            "platform": campaign.platform,
            "persona": campaign.persona,
            "brief": campaign.brief,
            "text_copy": campaign.text_copy or "",
            "image_url": f"http://localhost:8000{campaign.image_url}" if campaign.image_url and campaign.image_url.startswith('/') else (campaign.image_url or ""),
            "status": campaign.status
        }
        response = requests.post(google_sheet_url, json=payload, timeout=6)
        print(f"--> Google Sheet Webhook Response: {response.status_code}")
    except Exception as err:
        print(f"--> Failed to sync campaign {campaign.id} to Google Sheet Webhook: {err}")

@celery_app.task(name="tasks.generate_ad_campaign_task")
def generate_ad_campaign_task(
    job_id: str,
    campaign_id: int,
    brief: str,
    platform: str,
    persona: str,
    theme: str = "indigo",
    template: str = "square",
    scarcity_fomo: bool = False,
    ugc_style: bool = False,
    competitor_url: str = None
):
    """
    Background worker task to run the prompt refinement, copy generation,
    image generation, and database updates.
    """
    print(f"[{datetime.datetime.utcnow()}] Started campaign generation task for Job ID: {job_id}")
    
    db = SessionLocal()
    try:
        # 1. Update Job and Campaign status to PROCESSING
        job = db.query(Job).filter(Job.id == job_id).first()
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        
        if not job or not campaign:
            print(f"Error: Job {job_id} or Campaign {campaign_id} not found in DB.")
            return False

        job.status = "PROCESSING"
        campaign.status = "PROCESSING"
        db.commit()

        # 2. Step 1: Prompt Refinement Agent
        print(f"Refining brief: '{brief}'")
        refined_prompt = refine_prompt(brief)
        print(f"Refined prompt: '{refined_prompt}'")

        # 3. Step 2: Generate Ad Copy Text
        print(f"Generating ad copy for platform={platform}, persona={persona}")
        text_copy = generate_ad_copy(brief, platform, persona)
        
        # Apply UGC Style Mimic if selected
        if ugc_style:
            from .utils.nlp_tools import convert_to_ugc_style
            text_copy = convert_to_ugc_style(text_copy)
            
        # Apply Scarcity & FOMO injection if selected
        if scarcity_fomo:
            text_copy += " 🚨 ONLY 3 LEFT IN STOCK - Ends tonight 11:59 PM!"
            
        # Apply Price Psychology Optimization
        from .utils.nlp_tools import optimize_pricing_copy
        text_copy = optimize_pricing_copy(text_copy)

        # 4. Map auto theme (Emotion-Triggered Palette)
        if theme.lower() == "auto":
            lower_brief = brief.lower()
            if any(w in lower_brief for w in ["sale", "limited", "hurry", "deal", "discount", "urgent"]):
                theme = "sunset"
            elif any(w in lower_brief for w in ["organic", "nature", "green", "mint", "fresh", "clean"]):
                theme = "forest"
            elif any(w in lower_brief for w in ["tech", "cyber", "neon", "software", "app", "game"]):
                theme = "cyberpunk"
            else:
                theme = "indigo"

        # 5. Step 3: Generate and Composite Image
        print("Generating visual asset...")
        local_image_url = generate_dalle_image(refined_prompt, text_copy, platform, job_id, theme=theme)
        print(f"Visual asset stored at: {local_image_url}")

        # 6. Apply Brand Kit, Auto-Resizer templates, and Motion GIF
        image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), local_image_url.lstrip('/'))
        if os.path.exists(image_path):
            from PIL import Image
            from .utils.image_tools import apply_brand_kit, resize_asset, generate_motion_gif
            
            img_obj = Image.open(image_path)
            # Branded Kit Logo overlay
            img_branded = apply_brand_kit(img_obj)
            # Platform layout resizing
            img_resized = resize_asset(img_branded, template)
            img_resized.save(image_path, "JPEG", quality=90)
            
            # Zooming Ken Burns GIF generation
            gif_filename = f"{job_id}_motion.gif"
            gif_path = os.path.join(os.path.dirname(image_path), gif_filename)
            generate_motion_gif(image_path, gif_path)
            print(f"Motion GIF compiled successfully at: {gif_path}")

        # 7. Persist the generated details in DB
        campaign.text_copy = text_copy
        campaign.image_url = local_image_url
        campaign.status = "SUCCESS"
        
        job.status = "SUCCESS"
        job.completed_at = datetime.datetime.utcnow()
        
        db.commit()
        
        # Auto-create variants (for A/B testing)
        from .utils.nlp_tools import calculate_readability_score
        from .models import AdVariant
        v1 = AdVariant(
            campaign_id=campaign.id,
            text_copy=text_copy,
            image_url=local_image_url,
            predicted_ctr=2.1,
            readability_score=calculate_readability_score(text_copy),
            is_primary=True
        )
        db.add(v1)
        db.commit()

        print(f"Job {job_id} successfully completed. Triggering Sheet Sync...")
        
        # Real-time Sheet Sync
        sync_campaign_to_google_sheet(campaign)
        
        return True

    except Exception as e:
        db.rollback()
        print(f"Error executing job {job_id}: {e}")
        try:
            # Attempt to mark job as FAILED
            job = db.query(Job).filter(Job.id == job_id).first()
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if job:
                job.status = "FAILED"
                job.completed_at = datetime.datetime.utcnow()
            if campaign:
                campaign.status = "FAILED"
            db.commit()
            
            if campaign:
                sync_campaign_to_google_sheet(campaign)
        except Exception as inner_e:
            print(f"Failed to record failure status in DB: {inner_e}")
        return False
    finally:
        db.close()
