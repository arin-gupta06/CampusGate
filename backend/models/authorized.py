from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from backend.core.database import Base

class AuthorizedVehicle(Base):
    __tablename__ = "authorized_vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    registration_number = Column(String(30), unique=True, nullable=False, index=True)
    owner_name = Column(String(100), nullable=False)
    owner_role = Column(String(50), default="FACULTY")  # FACULTY, STAFF, STUDENT, VIP, VISITOR
    department = Column(String(100), nullable=True)
    vehicle_type = Column(String(30), default="CAR")     # CAR, MOTORCYCLE, BUS, TRUCK
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
