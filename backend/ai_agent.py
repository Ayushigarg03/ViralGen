import os
import openai
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Initialize client if API key is provided
client = None
if OPENAI_API_KEY and OPENAI_API_KEY.lower() != "your_key":
    client = OpenAI(api_key=OPENAI_API_KEY)

# Define prompts and templates
BRAND_PERSONAS = {
    "professional": "formal, corporate, authoritative and professional tone. Focus on value propositions, return on investment, and industry standards. Keep it polished and sophisticated.",
    "witty": "humorous, casual, conversational, and highly engaging tone. Use clever wordplay, friendly banter, and a relatable voice. Make it feel fresh and fun.",
    "urgent": "FOMO-based (Fear of Missing Out), action-driven, and highly persuasive copy. Emphasize limited time, scarcity, immediate action, and compelling calls-to-action (CTAs)."
}

PLATFORM_TEMPLATES = {
    "instagram": "Format: Visually engaging, emoji-rich paragraph, followed by a clear, clickable Call-To-Action (CTA), and 5-8 relevant hashtags. Focus on aesthetic appeal.",
    "linkedin": "Format: Professional, structured, story-driven layout. Use paragraphs separated by blank lines, include bullet points for key takeaways, end with a thoughtful business question/CTA, and 2-3 professional hashtags.",
    "twitter": "Format: Under 280 characters, punchy, attention-grabbing, direct statement, single call-to-action, and 1-2 trending hashtags."
}

def refine_prompt(brief: str) -> str:
    """
    Prompt Refinement Agent: Rewrites the user brief into a detailed, cinematic DALL-E 3 prompt.
    """
    if not client:
        # High quality mockup fallback
        return f"Premium professional commercial photography of {brief}, cinematic lighting, shallow depth of field, 8k resolution, elegant studio setting, vibrant corporate color palette, clean modern composition"

    system_prompt = (
        "You are an expert prompt engineer for DALL-E 3. "
        "Your task is to take a simple brand brief and expand it into a detailed, photorealistic, cinematic image prompt for commercial photography.\n"
        "Ensure the prompt describes: \n"
        "- The main subject in crisp detail\n"
        "- The setting, lighting (e.g. studio lighting, cinematic, soft glow)\n"
        "- The overall mood and commercial photography style (e.g., product shot, high-end commercial)\n"
        "- Color palette appropriate for advertising\n"
        "Output ONLY the refined prompt text. Do not write any introduction, quote marks, or explanation."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Brief: {brief}"}
            ],
            temperature=0.7,
            max_tokens=150
        )
        refined = response.choices[0].message.content.strip()
        return refined
    except Exception as e:
        print(f"Error in prompt refinement: {e}")
        return f"Premium professional commercial photography of {brief}, cinematic lighting, studio background, 8k resolution"

def generate_ad_copy(brief: str, platform: str, persona: str) -> str:
    """
    Generates tailored ad copy using GPT-4 according to the persona and platform templates.
    """
    platform_key = platform.lower()
    persona_key = persona.lower()

    persona_desc = BRAND_PERSONAS.get(persona_key, BRAND_PERSONAS["professional"])
    platform_desc = PLATFORM_TEMPLATES.get(platform_key, PLATFORM_TEMPLATES["instagram"])

    if not client:
        # High quality mock content generation
        import random
        emojis = ["🚀", "💡", "🎯", "🔥", "🌟", "✨", "📈", "💎"]
        chosen_emojis = "".join(random.sample(emojis, 3))
        
        if platform_key == "twitter":
            copy = f"{chosen_emojis} Transform your brand with ViralGen AI! Generating high-quality ad copy & visuals instantly. Brief: '{brief}'. Persona: {persona.upper()}.\n\nTry it now: viralgen.ai/start #AI #Marketing"
            if len(copy) > 280:
                copy = copy[:270] + "... #AI"
            return copy
        elif platform_key == "linkedin":
            return (
                f"How are you scaling your marketing workflows in 2026? 📈\n\n"
                f"We recently explored '{brief}' as a campaign idea, and the results are outstanding. "
                f"In marketing, alignment and speed are everything. That's why having a structured, "
                f"{persona} voice is critical to standing out in a crowded market.\n\n"
                f"Here are 3 key takeaways from this campaign:\n"
                f"• Precision targeting starts with a refined brand brief.\n"
                f"• Multi-modal generation creates visual-text synergy.\n"
                f"• Speed is our competitive advantage.\n\n"
                f"Are you ready to automate your visual generation? Let's discuss in the comments below! 👇\n\n"
                f"#BusinessGrowth #MarketingInnovation #GenAI"
            )
        else: # instagram
            return (
                f"Ready to level up your feed? {chosen_emojis}\n\n"
                f"Say hello to the future of content creation. We took '{brief}' and turned it into an absolute masterpiece. "
                f"Designed to be {persona}, this post connects with your audience on a whole new level. 💖\n\n"
                f"👉 Tap the link in our bio to start generating yours today! \n\n"
                f"#ViralGenAI #{persona.capitalize()}Marketing #InstaDaily #AdDesign #AdGenerator"
            )

    system_prompt = (
        "You are a professional ad copywriter. Generate high-converting ad copy based on the user's brief, "
        "the selected social platform, and the brand persona.\n\n"
        f"Brand Persona constraints: {persona_desc}\n"
        f"Platform format requirements: {platform_desc}\n\n"
        "Strict rule: Follow the platform constraints carefully. If the platform is Twitter, keep the entire copy strictly under 280 characters."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate ad copy for: '{brief}'"}
            ],
            temperature=0.8,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error in ad copy generation: {e}")
        # Fallback to local format
        return f"Mock Copy for {platform} ({persona}): {brief}. (API Error: {e})"
