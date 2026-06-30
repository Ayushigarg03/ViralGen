import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    campaigns = relationship("Campaign", back_populates="user", cascade="all, delete-orphan")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    batch_job_id = Column(Integer, ForeignKey("batch_jobs.id", ondelete="SET NULL"), nullable=True)
    original_campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    competitor_url = Column(String, nullable=True)
    approval_status = Column(String, default="APPROVED")  # PENDING_APPROVAL, APPROVED, REJECTED
    brief = Column(Text, nullable=False)
    platform = Column(String, nullable=False)  # Instagram, LinkedIn, Twitter
    persona = Column(String, nullable=False)   # Professional, Witty, Urgent
    theme = Column(String, default="indigo", nullable=False)
    text_copy = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="campaigns")
    jobs = relationship("Job", back_populates="campaign", cascade="all, delete-orphan")
    variants = relationship("AdVariant", back_populates="campaign", cascade="all, delete-orphan")
    batch_job = relationship("BatchJob", back_populates="campaigns")

class BatchJob(Base):
    __tablename__ = "batch_jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    campaigns = relationship("Campaign", back_populates="batch_job")

class AdVariant(Base):
    __tablename__ = "ad_variants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    text_copy = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    predicted_ctr = Column(Float, default=1.5)
    readability_score = Column(Float, default=60.0)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    campaign = relationship("Campaign", back_populates="variants")

class CampaignVersion(Base):
    __tablename__ = "campaign_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    text_copy = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)  # Celery task ID
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="PENDING")  # PENDING, PROCESSING, SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    campaign = relationship("Campaign", back_populates="jobs")
