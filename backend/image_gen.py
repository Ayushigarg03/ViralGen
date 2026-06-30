import os
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import openai
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Initialize client if API key is provided
client = None
if OPENAI_API_KEY and OPENAI_API_KEY.lower() != "your_key":
    client = OpenAI(api_key=OPENAI_API_KEY)

# Directory to save generated assets
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "generated")

# Theme Palette Styling Configurations
THEMES = {
    "indigo": {
        "bg_start": (30, 20, 50, 255),      # Dark purple
        "bg_end": (79, 70, 229, 255),        # Indigo
        "circles": [
            ((-100, -100, 500, 500), (255, 0, 128, 40)),
            ((600, 300, 1200, 900), (0, 220, 255, 30)),
            ((200, 600, 900, 1300), (255, 230, 0, 20))
        ],
        "badge_color": (124, 58, 237, 200),  # Purple
        "banner_bg": (15, 15, 25, 210),       # Slate black
    },
    "sunset": {
        "bg_start": (20, 10, 15, 255),       # Charcoal
        "bg_end": (234, 88, 12, 255),        # Deep Orange
        "circles": [
            ((-100, -100, 500, 500), (255, 200, 50, 35)),
            ((600, 300, 1200, 900), (220, 38, 38, 30)),
            ((200, 600, 900, 1300), (251, 191, 36, 20))
        ],
        "badge_color": (220, 38, 38, 200),   # Red
        "banner_bg": (20, 12, 12, 215),       # Warm black
    },
    "forest": {
        "bg_start": (10, 20, 20, 255),       # Dark slate green
        "bg_end": (13, 148, 136, 255),       # Teal
        "circles": [
            ((-100, -100, 500, 500), (52, 211, 153, 30)),
            ((600, 300, 1200, 900), (6, 182, 212, 25)),
            ((200, 600, 900, 1300), (163, 230, 53, 15))
        ],
        "badge_color": (13, 148, 136, 200),  # Teal
        "banner_bg": (12, 20, 20, 215),       # Green-black
    },
    "cyberpunk": {
        "bg_start": (20, 8, 32, 255),        # Deep Cyberpunk Violet
        "bg_end": (219, 39, 119, 255),       # Pink
        "circles": [
            ((-100, -100, 500, 500), (6, 182, 212, 45)), # Cyan glow
            ((600, 300, 1200, 900), (219, 39, 119, 35)), # Pink glow
            ((200, 600, 900, 1300), (253, 224, 71, 20)) # Yellow glow
        ],
        "badge_color": (219, 39, 119, 200),  # Hot Pink
        "banner_bg": (16, 8, 24, 220),        # Tech black
    }
}

def ensure_static_dir():
    os.makedirs(STATIC_DIR, exist_ok=True)

def generate_local_placeholder(brief: str, platform: str, persona: str, text_copy: str, filename: str, theme: str = "indigo") -> str:
    """
    Generates a beautiful premium gradient-based placeholder image using Pillow.
    Used when OpenAI DALL-E API is not available or fails.
    """
    ensure_static_dir()
    
    t_name = theme.lower() if theme else "indigo"
    t_config = THEMES.get(t_name, THEMES["indigo"])
    
    # Create base image with selected theme start color
    width, height = 1024, 1024
    image = Image.new("RGBA", (width, height), t_config["bg_start"])
    draw = ImageDraw.Draw(image)
    
    # Draw linear gradient background
    start_r, start_g, start_b, _ = t_config["bg_start"]
    end_r, end_g, end_b, _ = t_config["bg_end"]
    for y in range(height):
        r = int(start_r + (end_r - start_r) * (y / height))
        g = int(start_g + (end_g - start_g) * (y / height))
        b = int(start_b + (end_b - start_b) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        
    # Draw themed abstract glowing circles
    for coords, fill_color in t_config["circles"]:
        draw.ellipse(coords, fill=fill_color)
    
    # Load Font
    font = None
    title_font = None
    font_paths = [
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, 28)
                title_font = ImageFont.truetype(fp, 48)
                break
            except:
                pass
                
    if font is None:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
        
    # Draw Branding Header (Top-left)
    draw.rectangle([(40, 40), (320, 90)], fill=(0, 0, 0, 150), outline=(255, 255, 255, 100), width=2)
    draw.text((60, 48), "ViralGen AI", fill=(255, 255, 255, 255), font=font)
    
    # Draw Platform tag (Top-right)
    draw.rectangle([(width - 280, 40), (width - 40, 90)], fill=t_config["badge_color"], outline=(255, 255, 255, 100), width=1)
    draw.text((width - 240, 48), f"{platform.upper()}", fill=(255, 255, 255, 255), font=font)
    
    # Draw central headline (brief name)
    display_title = brief if len(brief) < 30 else brief[:27] + "..."
    draw.text((100, 300), display_title.upper(), fill=(255, 255, 255, 255), font=title_font)
    draw.line([(100, 370), (400, 370)], fill=(255, 255, 255, 200), width=4)
    
    # Draw Description text
    draw.text((100, 400), f"Theme: {t_name.upper()} | Persona: {persona.upper()}", fill=(240, 240, 240, 220), font=font)
    
    # Draw Ad Copy Card (Bottom Banner)
    banner_height = 300
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle(
        [(40, height - banner_height - 40), (width - 40, height - 40)],
        fill=t_config["banner_bg"],
        outline=(255, 255, 255, 50),
        width=2
    )
    image = Image.alpha_composite(image, overlay)
    draw = ImageDraw.Draw(image)
    
    # Wrap text and draw it inside the banner
    max_chars_per_line = 55
    words = text_copy.split()
    lines = []
    current_line = []
    for word in words:
        if len(" ".join(current_line + [word])) <= max_chars_per_line:
            current_line.append(word)
        else:
            lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
        
    y_offset = height - banner_height - 10
    for line in lines[:7]:
        draw.text((70, y_offset), line, fill=(245, 245, 245, 255), font=font)
        y_offset += 36
        
    # Save the composite image
    filepath = os.path.join(STATIC_DIR, filename)
    image.convert("RGB").save(filepath, "JPEG", quality=90)
    
    return f"/static/generated/{filename}"

def composite_image(dalle_url: str, text_copy: str, platform: str, filename: str, theme: str = "indigo") -> str:
    """
    Downloads DALL-E image, overlays a branding banner and text, and saves it locally.
    """
    ensure_static_dir()
    
    t_name = theme.lower() if theme else "indigo"
    t_config = THEMES.get(t_name, THEMES["indigo"])
    
    try:
        response = requests.get(dalle_url, timeout=15)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content)).convert("RGBA")
        
        width, height = img.size
        draw = ImageDraw.Draw(img)
        
        # Load Font
        font = None
        font_paths = [
            "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\segoeui.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
        ]
        for fp in font_paths:
            if os.path.exists(fp):
                try:
                    font = ImageFont.truetype(fp, 26)
                    break
                except:
                    pass
        if font is None:
            font = ImageFont.load_default()
            
        # Draw sleek translucent banner overlay at the bottom
        banner_height = 250
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle(
            [(0, height - banner_height), (width, height)],
            fill=t_config["banner_bg"]
        )
        img = Image.alpha_composite(img, overlay)
        draw = ImageDraw.Draw(img)
        
        # Overlay a watermark in top right
        draw.rectangle([(width - 200, 20), (width - 20, 60)], fill=(0, 0, 0, 120), outline=(255, 255, 255, 80))
        draw.text((width - 175, 28), "ViralGen AI", fill=(255, 255, 255, 220), font=font)
        
        # Add platform badge in top left using theme badge color
        draw.rectangle([(20, 20), (180, 60)], fill=t_config["badge_color"])
        draw.text((45, 28), f"{platform.upper()}", fill=(255, 255, 255, 255), font=font)
        
        # Draw wrapped copy text in the bottom banner
        max_chars_per_line = 60
        words = text_copy.split()
        lines = []
        current_line = []
        for word in words:
            if len(" ".join(current_line + [word])) <= max_chars_per_line:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
        if current_line:
            lines.append(" ".join(current_line))
            
        y_offset = height - banner_height + 25
        for line in lines[:5]:
            draw.text((40, y_offset), line, fill=(255, 255, 255, 255), font=font)
            y_offset += 38
            
        filepath = os.path.join(STATIC_DIR, filename)
        img.convert("RGB").save(filepath, "JPEG", quality=90)
        return f"/static/generated/{filename}"
    except Exception as e:
        print(f"Error in compositing image: {e}")
        return generate_local_placeholder("Error Compositing", platform, "Default", text_copy, filename, theme=theme)

def generate_dalle_image(refined_prompt: str, text_copy: str, platform: str, job_id: str, theme: str = "indigo") -> str:
    """
    Calls DALL-E 3 API to generate an image and overlays details using Pillow.
    If fails or key is missing, falls back to local Pillow generation.
    """
    filename = f"{job_id}.jpg"
    
    if not client:
        # Generate elegant local visual asset
        return generate_local_placeholder(refined_prompt[:35], platform, "Mock Mode", text_copy, filename, theme=theme)
        
    try:
        # Inject theme color description in the prompt for DALL-E
        enhanced_prompt = f"In {theme} aesthetic color scheme. {refined_prompt}"
        response = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            n=1,
            size="1024x1024",
            quality="standard",
            response_format="url"
        )
        image_url = response.data[0].url
        local_url = composite_image(image_url, text_copy, platform, filename, theme=theme)
        return local_url
    except Exception as e:
        print(f"DALL-E generation failed: {e}. Falling back to local generation.")
        return generate_local_placeholder(refined_prompt[:35], platform, "Fallback", text_copy, filename, theme=theme)
