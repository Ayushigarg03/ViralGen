import os
import math
from PIL import Image, ImageDraw, ImageFont

def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def apply_brand_kit(img: Image.Image, logo_text: str = "VIRALGEN AI", theme_badge_color=(124, 58, 237, 200)) -> Image.Image:
    """
    Overlays brand watermarks, logos, and styled elements on the generated visual.
    """
    # Create copy of image to draw on
    canvas = img.copy().convert("RGBA")
    draw = ImageDraw.Draw(canvas)
    width, height = canvas.size
    
    # Load Font
    font = None
    font_paths = [
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, 22)
                break
            except:
                pass
    if font is None:
        font = ImageFont.load_default()

    # Draw Brand Logo Badge in Top Right
    draw.rectangle([(width - 240, 20), (width - 20, 70)], fill=theme_badge_color, outline=(255, 255, 255, 80), width=1)
    
    # Draw small circle representing logo icon
    draw.ellipse([(width - 230, 32), (width - 208, 54)], fill=(255, 255, 255, 255))
    draw.text((width - 195, 30), logo_text.upper(), fill=(255, 255, 255, 255), font=font)
    
    return canvas.convert("RGB")

def resize_asset(img: Image.Image, format_type: str) -> Image.Image:
    """
    Crops and resizes image maintaining aspect ratio:
    - square: 1024x1024
    - story: 1080x1920
    - linkedin: 1200x628
    """
    if format_type == "story":
        target_w, target_h = 1080, 1920
    elif format_type == "linkedin":
        target_w, target_h = 1200, 628
    else: # square
        target_w, target_h = 1024, 1024

    width, height = img.size
    
    # Aspect ratios
    aspect_img = width / height
    aspect_target = target_w / target_h
    
    if aspect_img > aspect_target:
        # Wider: Scale height first, crop width
        new_h = target_h
        new_w = int(width * (target_h / height))
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - target_w) // 2
        cropped = resized.crop((left, 0, left + target_w, target_h))
    else:
        # Taller: Scale width first, crop height
        new_w = target_w
        new_h = int(height * (target_w / width))
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        top = (new_h - target_h) // 2
        cropped = resized.crop((0, top, target_w, top + target_h))
        
    return cropped

def generate_motion_gif(input_image_path: str, output_gif_path: str):
    """
    Compiles a 5-second Ken Burns style zooming animated GIF from a static image.
    """
    ensure_dir(output_gif_path)
    img = Image.open(input_image_path).convert("RGBA")
    
    # Scale image to 512x512 to keep GIF size optimized and load fast
    img = img.resize((512, 512), Image.Resampling.LANCZOS)
    w, h = img.size
    
    frames = []
    num_frames = 15 # 15 frames for loop
    
    for i in range(num_frames):
        # Zoom factor (1.0 to 1.15)
        zoom = 1.0 + (i / num_frames) * 0.12
        new_w, new_h = int(w * zoom), int(h * zoom)
        
        zoomed = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        left = (new_w - w) // 2
        top = (new_h - h) // 2
        
        frame = zoomed.crop((left, top, left + w, top + h))
        frames.append(frame.convert("RGB"))
        
    # Save animated GIF
    frames[0].save(
        output_gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=150, # 150ms per frame (approx. 2.2s loop)
        loop=0
    )
