from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from backend.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(60), primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    role = Column(String(30), default="user", nullable=False)  # 'admin', 'guard', 'user'
    is_superadmin = Column(Boolean, default=False)
    department = Column(String(150), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    google_id = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

