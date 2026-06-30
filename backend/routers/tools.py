import random
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..schemas import CompetitorAnalyzeRequest, CompetitorAnalyzeResponse, VoiceToAdResponse
from ..models import User
from .auth import get_current_user

router = APIRouter(prefix="/api/tools", tags=["tools"])

@router.post("/competitor-analyze", response_model=CompetitorAnalyzeResponse)
def analyze_competitor_url(
    req: CompetitorAnalyzeRequest, 
    current_user: User = Depends(get_current_user)
):
    url = req.url.lower()
    
    # Smart URL pattern recognition for testing
    if "nike" in url or "adidas" in url or "shoe" in url:
        brief = "Premium athletic running shoes with responsive cushioning for sport training"
        platform = "Instagram"
        persona = "Urgent"
        theme = "sunset"
        analysis = "Clean focus on product motion, bold branding, high-contrast action images, and emphasis on performance results."
    elif "starbucks" in url or "coffee" in url or "cafe" in url:
        brief = "Direct-trade organic robusta coffee beans with rich chocolate notes"
        platform = "Instagram"
        persona = "Witty"
        theme = "forest"
        analysis = "Cozy lifestyle photography, focus on warm organic color palettes, and community-driven social engagement copy."
    elif "notion" in url or "workspace" in url or "task" in url or "app" in url:
        brief = "Minimalist productivity tool for task management and project organization"
        platform = "LinkedIn"
        persona = "Professional"
        theme = "indigo"
        analysis = "Sleek screenshot graphics, dark/light contrast UI features, focus on value proposition and user efficiency stats."
    else:
        brief = f"Eco-friendly organic lifestyle product inspired by {url.split('//')[-1].split('/')[0]}"
        platform = "Instagram"
        persona = "Professional"
        theme = "indigo"
        analysis = "Generic professional ad template: product-focused layout, high contrast banner overlays, and direct value CTAs."
        
    return CompetitorAnalyzeResponse(
        brief=brief,
        suggested_platform=platform,
        suggested_persona=persona,
        suggested_theme=theme,
        ad_style_analysis=analysis
    )

@router.post("/reverse-brief", response_model=CompetitorAnalyzeResponse)
def reverse_engineer_brief(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    # Analyze uploaded competitor ad image and reverse engineer the brief
    filename = file.filename.lower()
    
    # Simulate analyzing image colors/details based on file names
    if "shoe" in filename or "sport" in filename:
        brief = "High-performance mesh athletic shoes designed for running comfort"
        platform = "Instagram"
        persona = "Urgent"
        theme = "sunset"
        analysis = "Detected vibrant orange color tones. Target Audience: Gen Z athletes. Tone: High energy and FOMO."
    elif "coffee" in filename or "cup" in filename:
        brief = "Gourmet espresso blend coffee with chocolatey undertones"
        platform = "Instagram"
        persona = "Witty"
        theme = "forest"
        analysis = "Detected warm brown/green colors. Target Audience: Urban professionals. Tone: Cozy and community-focused."
    else:
        brief = "Minimalist consumer lifestyle product with modern packaging design"
        platform = "LinkedIn"
        persona = "Professional"
        theme = "indigo"
        analysis = "Detected clean monochrome tones. Target Audience: B2B buyers. Tone: Corporate and reliable."

    return CompetitorAnalyzeResponse(
        brief=brief,
        suggested_platform=platform,
        suggested_persona=persona,
        suggested_theme=theme,
        ad_style_analysis=analysis
    )

@router.post("/voice-to-ad", response_model=VoiceToAdResponse)
def voice_to_ad_transcribe(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Simulate Voice note transcription to generate ad briefs
    transcriptions = [
        "Hey! We are launching our new lavender organic soap bar. It is made of essential oils and is super relaxing for baths. Keep it witty and put it on Instagram.",
        "Yo, I need a campaign for red sports shoes. Focus on modern city runners. Keep it urgent for limited discount. Put it on Instagram with the sunset orange theme.",
        "We need a LinkedIn ad for our productivity SaaS tool. Focus on minimalist task lists, B2B buyers, professional tone."
    ]
    
    # Pick a transcription based on filename or randomly
    fname = file.filename.lower()
    if "soap" in fname or "lavender" in fname:
        selected = transcriptions[0]
        brief = "Premium lavender organic soap bar with essential oils for relaxing baths"
        platform = "Instagram"
        persona = "Witty"
    elif "shoe" in fname or "run" in fname:
        selected = transcriptions[1]
        brief = "Sleek red sports shoes for modern city runners"
        platform = "Instagram"
        persona = "Urgent"
    else:
        selected = random.choice(transcriptions)
        if "lavender" in selected:
            brief = "Premium lavender organic soap bar with essential oils for relaxing baths"
            platform = "Instagram"
            persona = "Witty"
        elif "shoes" in selected:
            brief = "Sleek red sports shoes for modern city runners"
            platform = "Instagram"
            persona = "Urgent"
        else:
            brief = "Minimalist productivity SaaS tool focusing on tasks and team coordination"
            platform = "LinkedIn"
            persona = "Professional"
            
    return VoiceToAdResponse(
        transcription=selected,
        extracted_brief=brief,
        suggested_platform=platform,
        suggested_persona=persona
    )

@router.get("/contextual-schedule")
def get_contextual_schedules(current_user: User = Depends(get_current_user)):
    # Simulates pulling live weather API data and suggesting ad scheduling rules
    weathers = ["Rainy", "Sunny", "Cold/Cloudy"]
    selected_weather = random.choice(weathers)
    
    if selected_weather == "Rainy":
        rule = "Rainy Day: Serve comfort product ads. Boost bidding on indoor/relaxation campaigns."
        theme = "indigo"
    elif selected_weather == "Sunny":
        rule = "Sunny Day: Serve outdoor and fitness product ads. Boost bidding on sports/beverages campaigns."
        theme = "sunset"
    else:
        rule = "Overcast/Cloudy: Serve tech and productivity ads. Boost B2B campaigns."
        theme = "forest"
        
    return {
        "current_weather": selected_weather,
        "scheduling_rule": rule,
        "suggested_visual_theme": theme
    }
