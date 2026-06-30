import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Reconfigure stdout/stderr to use UTF-8 to prevent encoding/charmap crashes on Windows consoles
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

from .database import engine, Base, SessionLocal
from .models import User
from .routers import generate, history, analytics, auth, variants, tools

# Ensure the static directories exist
STATIC_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
GENERATED_DIR = os.path.join(STATIC_ROOT, "generated")
os.makedirs(GENERATED_DIR, exist_ok=True)

# Initialize FastAPI App
app = FastAPI(
    title="ViralGen AI API",
    description="Multi-Modal AI Ad Content Generator Backend",
    version="1.0.0"
)

# Set up CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files (to serve generated images)
app.mount("/static", StaticFiles(directory=STATIC_ROOT), name="static")

# Register Routers
app.include_router(auth.router)
app.include_router(generate.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(variants.router)
app.include_router(tools.router)

@app.on_event("startup")
def on_startup():
    """
    Runs database migrations / creation and seeds default data on startup.
    """
    print("Database tables initializing...")
    Base.metadata.create_all(bind=engine)
    
    # Run dynamic schema migration to add columns if they don't exist
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE campaigns ADD COLUMN theme VARCHAR DEFAULT 'indigo'"))
        db.commit()
    except Exception:
        db.rollback()
        
    try:
        db.execute(text("ALTER TABLE campaigns ADD COLUMN batch_job_id INTEGER"))
        db.commit()
    except Exception:
        db.rollback()

    try:
        db.execute(text("ALTER TABLE campaigns ADD COLUMN original_campaign_id INTEGER"))
        db.commit()
    except Exception:
        db.rollback()

    try:
        db.execute(text("ALTER TABLE campaigns ADD COLUMN competitor_url VARCHAR"))
        db.commit()
    except Exception:
        db.rollback()

    try:
        db.execute(text("ALTER TABLE campaigns ADD COLUMN approval_status VARCHAR DEFAULT 'APPROVED'"))
        db.commit()
    except Exception:
        db.rollback()
        
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR"))
        db.commit()
        print("Schema migration: Successfully completed all columns migrations.")
    except Exception:
        db.rollback()
    finally:
        db.close()
        
    # Seed default user
    db = SessionLocal()
    try:
        from .routers.auth import hash_password
        default_user = db.query(User).filter(User.email == "manager@viralgen.ai").first()
        if not default_user:
            print("Seeding default user...")
            user = User(
                name="Default Ad Manager",
                email="manager@viralgen.ai",
                hashed_password=hash_password("password123")
            )
            db.add(user)
            db.commit()
            print("Default user seeded successfully.")
        elif not default_user.hashed_password:
            print("Updating default user password...")
            default_user.hashed_password = hash_password("password123")
            db.commit()
            print("Default user password updated successfully.")
    except Exception as e:
        print(f"Error during startup seeding: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "app": "ViralGen AI API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "generate": "/api/generate-content",
            "history": "/api/history",
            "analytics": "/api/analytics/summary",
            "excel_export": "/api/export-excel"
        }
    }
