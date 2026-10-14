from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True, index=True)  # e.g., 'CAM-GATE-01'
    name = Column(String(100), nullable=False)
    stream_url = Column(String(255), nullable=True)
    physical_role = Column(String(30), default="ENTRY")     # ENTRY, EXIT, DOWNSTREAM, INTERSECTION
    location_description = Column(String(255), nullable=True)
    reference_image_path = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    observations = relationship("VehicleObservation", back_populates="camera", cascade="all, delete-orphan")

class CameraTopology(Base):
    __tablename__ = "camera_topology"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False, index=True)
    destination_camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False, index=True)
    expected_travel_time_min = Column(Float, nullable=False, default=2.0)   # seconds
    expected_travel_time_max = Column(Float, nullable=False, default=45.0)  # seconds
    route_metadata = Column(Text, nullable=True)                           # e.g., "Lane 1 direct to Academic Block"
    created_at = Column(DateTime, default=datetime.utcnow)
