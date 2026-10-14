import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.core.database import Base

class VehicleObservation(Base):
    __tablename__ = "vehicle_observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False, index=True)
    track_session_id = Column(String(64), nullable=False, index=True)
    local_track_id = Column(Integer, nullable=False)
    captured_at = Column(DateTime, default=datetime.utcnow, index=True)
    vehicle_crop_path = Column(String(255), nullable=True)
    plate_crop_path = Column(String(255), nullable=True)
    vehicle_conf = Column(Float, nullable=False, default=0.0)
    plate_conf = Column(Float, nullable=True)
    direction = Column(String(30), nullable=True)          # e.g., "INBOUND", "OUTBOUND"
    crossing_status = Column(String(30), default="APPROACHING")  # APPROACHING, CROSSED, REVERSED
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    camera = relationship("Camera", back_populates="observations")
    readings = relationship("PlateReading", back_populates="observation", cascade="all, delete-orphan")

class PlateReading(Base):
    __tablename__ = "plate_readings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    observation_id = Column(String(36), ForeignKey("vehicle_observations.id"), nullable=False, index=True)
    raw_text = Column(String(50), nullable=False)
    normalized_text = Column(String(50), nullable=True, index=True)
    confidence = Column(Float, nullable=False, default=0.0)
    crop_quality_score = Column(Float, default=0.0)
    is_valid_format = Column(Boolean, default=False)
    model_version = Column(String(50), default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    observation = relationship("VehicleObservation", back_populates="readings")
