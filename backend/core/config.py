import os
from pathlib import Path

class Settings:
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Database
    raw_db_url = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://campusgate:campusgate_secret@localhost:5433/campusgate_db"
    )
    if raw_db_url.startswith("postgresql://"):
        raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
    DATABASE_URL: str = raw_db_url
    FALLBACK_SQLITE_URL: str = os.getenv("FALLBACK_SQLITE_URL", "sqlite:///./campusgate.db")
    
    # Vision
    WEIGHTS_PATH: Path = BASE_DIR / os.getenv("VISION_WEIGHTS_PATH", "backend/vision/weights/best.pt")
    DETECTION_CONF_THRESHOLD: float = float(os.getenv("DETECTION_CONF_THRESHOLD", "0.35"))
    PLATE_QUALITY_MIN_SCORE: float = float(os.getenv("PLATE_QUALITY_MIN_SCORE", "0.40"))
    
    # Redis & Crop Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CROP_RETENTION_HOURS: int = int(os.getenv("CROP_RETENTION_HOURS", "24"))
    
    # App
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")

settings = Settings()
