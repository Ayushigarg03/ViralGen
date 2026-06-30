from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    name: Optional[str] = None
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Campaign schemas
class CampaignCreate(BaseModel):
    brief: str = Field(..., min_length=5, description="Brand/Campaign brief")
    platform: str = Field(..., description="Target platform (Instagram, LinkedIn, Twitter)")
    persona: str = Field(..., description="Brand persona (Professional, Witty, Urgent)")
    theme: str = Field("indigo", description="Theme design (indigo, sunset, forest, cyberpunk)")
    template: Optional[str] = "square"  # square, story, banner
    scarcity_fomo: Optional[bool] = False
    ugc_style: Optional[bool] = False
    competitor_url: Optional[str] = None
    original_campaign_id: Optional[int] = None

class CampaignResponse(BaseModel):
    id: int
    user_id: int
    brief: str
    platform: str
    persona: str
    theme: str
    text_copy: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RecompositeRequest(BaseModel):
    text_copy: str = Field(..., min_length=5, description="Updated ad text copy to overlay")

# Job schemas
class JobResponse(BaseModel):
    id: str
    campaign_id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class JobStatusDetails(BaseModel):
    job_id: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    campaign: Optional[CampaignResponse] = None

# Analytics schemas
class PlatformPerformance(BaseModel):
    platform: str
    total_campaigns: int
    success_rate: float

class PersonaDistribution(BaseModel):
    persona: str
    count: int

class DailyTrend(BaseModel):
    date: str
    total_generated: int
    successful: int
    failed: int

class KeywordFrequency(BaseModel):
    keyword: str
    count: int

class AnalyticsSummary(BaseModel):
    total_campaigns: int
    today_count: int
    success_rate: float
    avg_gen_time_seconds: float
    failed_count: int
    successful_count: int
    platform_performance: List[PlatformPerformance]
    persona_distribution: List[PersonaDistribution]
    daily_trends: List[DailyTrend]
    top_keywords: List[KeywordFrequency] = []

# Variant and Rollback schemas
class AdVariantResponse(BaseModel):
    id: int
    campaign_id: int
    text_copy: str
    image_url: Optional[str] = None
    predicted_ctr: float
    readability_score: float
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CampaignVersionResponse(BaseModel):
    id: int
    campaign_id: int
    text_copy: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BatchJobResponse(BaseModel):
    id: int
    user_id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Competitor Tools and Voice pipeline schemas
class CompetitorAnalyzeRequest(BaseModel):
    url: str

class CompetitorAnalyzeResponse(BaseModel):
    brief: str
    suggested_platform: str
    suggested_persona: str
    suggested_theme: str
    ad_style_analysis: str

class VoiceToAdResponse(BaseModel):
    transcription: str
    extracted_brief: str
    suggested_platform: str
    suggested_persona: str
