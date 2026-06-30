import os
import requests
import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Optional, List

from ..database import get_db
from ..models import Campaign, User
from ..schemas import CampaignResponse
from ..excel_export import generate_campaign_excel
from .auth import get_current_user

router = APIRouter(prefix="/api", tags=["history"])

@router.get("/history")
def get_history(
    platform: Optional[str] = Query(None, description="Filter by platform"),
    persona: Optional[str] = Query(None, description="Filter by brand persona"),
    search: Optional[str] = Query(None, description="Search by keyword in brief"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, description="Number of items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches campaign history with pagination, search, and filters.
    """
    query = db.query(Campaign).filter(Campaign.user_id == current_user.id)
    
    # Apply filters
    if platform and platform.lower() != "all":
        query = query.filter(Campaign.platform.ilike(platform))
    if persona and persona.lower() != "all":
        query = query.filter(Campaign.persona.ilike(persona))
    if search:
        query = query.filter(Campaign.brief.ilike(f"%{search}%"))
        
    if start_date:
        try:
            parsed_start = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Campaign.created_at >= parsed_start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
            
    if end_date:
        try:
            parsed_end = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1)
            query = query.filter(Campaign.created_at < parsed_end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")
            
    # Calculate totals
    total_campaigns = query.count()
    
    # Order and apply pagination
    campaigns = query.order_by(Campaign.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    # Calculate pages
    total_pages = (total_campaigns + limit - 1) // limit if total_campaigns > 0 else 1
    
    return {
        "campaigns": [CampaignResponse.model_validate(c) for c in campaigns],
        "total": total_campaigns,
        "page": page,
        "pages": total_pages,
        "limit": limit
    }

@router.get("/export-excel")
def export_excel(current_user: User = Depends(get_current_user)):
    """
    Streams the openpyxl-generated workbook containing campaign logs and analytics.
    """
    try:
        excel_buffer = generate_campaign_excel(current_user.id)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"viralgen_campaigns_{timestamp}.xlsx"
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel report: {str(e)}")

@router.post("/sync-google-sheets")
def sync_google_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Performs a full batch sync of all historical campaigns in the database to the Google Sheet.
    """
    campaigns = db.query(Campaign).filter(Campaign.user_id == current_user.id).order_by(Campaign.id.asc()).all()
    
    # Map to payload
    data_list = []
    for c in campaigns:
        data_list.append({
            "id": c.id,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "",
            "platform": c.platform,
            "persona": c.persona,
            "brief": c.brief,
            "text_copy": c.text_copy or "",
            "image_url": f"http://localhost:8000{c.image_url}" if c.image_url and c.image_url.startswith('/') else (c.image_url or ""),
            "status": c.status
        })

    google_sheet_url = os.getenv("GOOGLE_SHEET_WEBHOOK_URL", "")
    if not google_sheet_url:
        # Fallback to simulated local sync to show how the payload looks
        import json
        mock_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "mock_google_sheets.json")
        os.makedirs(os.path.dirname(mock_file_path), exist_ok=True)
        
        with open(mock_file_path, "w", encoding="utf-8") as f:
            json.dump({"action": "sync_all", "data": data_list}, f, indent=4)
            
        return {
            "status": "success",
            "message": f"[SIMULATION] Synced {len(data_list)} campaigns to local mock_google_sheets.json. (To sync to a live Google Sheet, configure GOOGLE_SHEET_WEBHOOK_URL in run_local.bat)",
            "count": len(data_list)
        }
        
    payload = {
        "action": "sync_all",
        "data": data_list
    }
    
    try:
        response = requests.post(google_sheet_url, json=payload, timeout=12)
        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Google Sheets App Script Webhook returned status code {response.status_code}."
            )
        return {
            "status": "success",
            "message": f"Successfully synchronized {len(data_list)} campaigns to Google Sheets.",
            "count": len(data_list)
        }
    except requests.exceptions.RequestException as err:
        raise HTTPException(
            status_code=503,
            detail=f"Network error trying to connect to Google Sheets Webhook: {str(err)}"
        )
