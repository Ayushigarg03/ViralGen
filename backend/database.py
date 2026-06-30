import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@postgres:5432/viralgen")

# Auto-detect if we are running outside Docker on a local developer environment
use_sqlite = False
if "postgres" in DATABASE_URL and not os.path.exists("/.dockerenv"):
    use_sqlite = True

if use_sqlite or DATABASE_URL.startswith("sqlite"):
    DATABASE_URL = "sqlite:///./viralgen.db"
    connect_args = {"check_same_thread": False}
    print("--> LOCAL MODE: Falling back to SQLite database at: ./viralgen.db")
else:
    connect_args = {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
