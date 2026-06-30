import os
import requests
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Campaign, AdVariant, CampaignVersion, User
from ..schemas import AdVariantResponse, CampaignResponse, CampaignVersionResponse
from .auth import get_current_user
from ..utils.nlp_tools import calculate_readability_score, convert_to_ugc_style, optimize_pricing_copy

router = APIRouter(prefix="/api/variants", tags=["variants"])

@router.get("/{campaign_id}", response_model=List[AdVariantResponse])
def get_campaign_variants(
    campaign_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    variants = db.query(AdVariant).filter(AdVariant.campaign_id == campaign_id).all()
    
    # Auto-generate variants if none exist (A/B Variant Generator logic)
    if not variants:
        base_text = campaign.text_copy or f"Discover the new {campaign.brief} tailored for you."
        
        # 1. Original copy
        v1 = AdVariant(
            campaign_id=campaign_id,
            text_copy=base_text,
            image_url=campaign.image_url,
            predicted_ctr=1.8,
            readability_score=calculate_readability_score(base_text),
            is_primary=True
        )
        # 2. UGC conversational mimic style
        ugc_text = convert_to_ugc_style(base_text)
        v2 = AdVariant(
            campaign_id=campaign_id,
            text_copy=ugc_text,
            image_url=campaign.image_url,
            predicted_ctr=2.4,
            readability_score=calculate_readability_score(ugc_text),
            is_primary=False
        )
        # 3. Price optimized variant
        pricing_text = optimize_pricing_copy(base_text)
        v3 = AdVariant(
            campaign_id=campaign_id,
            text_copy=pricing_text,
            image_url=campaign.image_url,
            predicted_ctr=2.1,
            readability_score=calculate_readability_score(pricing_text),
            is_primary=False
        )
        # 4. Scarcity & FOMO variant
        fomo_text = f"🚨 Limited Time Only! {base_text} Ends tonight 11:59 PM. Click to claim 33% off!"
        v4 = AdVariant(
            campaign_id=campaign_id,
            text_copy=fomo_text,
            image_url=campaign.image_url,
            predicted_ctr=2.9,
            readability_score=calculate_readability_score(fomo_text),
            is_primary=False
        )
        
        db.add_all([v1, v2, v3, v4])
        db.commit()
        variants = [v1, v2, v3, v4]
        
    return variants

@router.post("/approve/{variant_id}", response_model=CampaignResponse)
def approve_variant(
    variant_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    variant = db.query(AdVariant).filter(AdVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
        
    campaign = db.query(Campaign).filter(Campaign.id == variant.campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign access denied")

    # Save version history before updating (Version History & Rollbacks)
    version = CampaignVersion(
        campaign_id=campaign.id,
        text_copy=campaign.text_copy,
        image_url=campaign.image_url
    )
    db.add(version)

    # Set all other variants of this campaign to false
    db.query(AdVariant).filter(AdVariant.campaign_id == campaign.id).update({"is_primary": False})
    
    # Approve and make this variant primary
    variant.is_primary = True
    campaign.text_copy = variant.text_copy
    campaign.image_url = variant.image_url
    campaign.approval_status = "APPROVED"
    
    db.commit()
    db.refresh(campaign)

    # Simulate Slack Webhook approval trigger (Human-in-Loop)
    webhook_url = os.getenv("SLACK_WEBHOOK_URL", "")
    if webhook_url:
        try:
            payload = {"text": f"✅ [ViralGen AI] Campaign '{campaign.brief[:25]}' approved by {current_user.email}!"}
            requests.post(webhook_url, json=payload, timeout=5)
        except Exception as e:
            print(f"Failed triggering Slack webhook: {e}")
            
    return campaign

@router.get("/history/{campaign_id}", response_model=List[CampaignVersionResponse])
def get_campaign_versions(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    versions = db.query(CampaignVersion).filter(CampaignVersion.campaign_id == campaign_id).order_by(CampaignVersion.created_at.desc()).all()
    return versions

@router.post("/rollback/{version_id}", response_model=CampaignResponse)
def rollback_campaign_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    version = db.query(CampaignVersion).filter(CampaignVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
        
    campaign = db.query(Campaign).filter(Campaign.id == version.campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign access denied")
        
    # Apply rollback
    campaign.text_copy = version.text_copy
    campaign.image_url = version.image_url
    
    # Save a rollback version history record
    new_version = CampaignVersion(
        campaign_id=campaign.id,
        text_copy=campaign.text_copy,
        image_url=campaign.image_url
    )
    db.add(new_version)
    db.commit()
    db.refresh(campaign)
    
    return campaign
