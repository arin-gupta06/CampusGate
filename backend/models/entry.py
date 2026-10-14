import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.core.database import Base

class VehicleEntryEvent(Base):
    __tablename__ = "vehicle_entry_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_number = Column(String(30), nullable=True, index=True)
    first_observed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    entry_confirmed_at = Column(DateTime, nullable=True)
    
    # State flags conforming strictly to Blueprint Section 9
    identity_status = Column(String(30), default="OBSERVED", index=True)
    # OBSERVED, ENTRY_CROSSED, IDENTIFIED, HANDOFF_PENDING, MATCH_PENDING, ASSOCIATED, REVIEW_REQUIRED, UNRESOLVED
    
    authorization_state = Column(String(30), default="REVIEW_REQUIRED", index=True)
    # AUTHORIZED, NOT_MATCHED, REVIEW_REQUIRED
    
    resolution_method = Column(String(40), nullable=True)
    # DIRECT_ENTRY_OCR, CROSS_CAMERA_HANDOFF, MANUAL_REVIEW, UNRESOLVED

    primary_camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    primary_observation_id = Column(String(36), nullable=True)
    linked_observation_ids = Column(Text, nullable=True)   # JSON or comma-separated UUIDs
    
    review_status = Column(String(30), default="NONE")     # NONE, PENDING_REVIEW, APPROVED, REJECTED
    review_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    handoffs = relationship("HandoffEvent", back_populates="entry_event", cascade="all, delete-orphan")

class HandoffEvent(Base):
    __tablename__ = "handoff_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entry_event_id = Column(String(36), ForeignKey("vehicle_entry_events.id"), nullable=False, index=True)
    source_camera_id = Column(String(50), nullable=False)
    source_observation_id = Column(String(36), nullable=False)
    candidate_camera_ids = Column(String(255), nullable=False)  # Comma-separated list of downstream cameras
    
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    
    status = Column(String(30), default="PENDING")             # PENDING, MATCHED, EXPIRED, AMBIGUOUS
    matched_observation_id = Column(String(36), nullable=True)
    resolution_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    entry_event = relationship("VehicleEntryEvent", back_populates="handoffs")
