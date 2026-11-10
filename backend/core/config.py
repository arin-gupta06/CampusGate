import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BASE_DIR / ".env")

class Settings:
    BASE_DIR: Path = _BASE_DIR
    
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

    # Official Google OAuth & Superadmin Whitelist
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "campusgate_super_secret_jwt_key_2026_ai")
    
    # Project Contributors permanently elevated to Superadmin
    SUPERADMIN_EMAILS: list = [
        email.strip().lower() for email in os.getenv(
            "SUPERADMIN_EMAILS",
            "24cd10ar15@mitsgwl.ac.in,vivekchaurasiya943@gmail.com,sarveshsingh8462@gmail.com,arin.gupta@mits.ac.in,admin@campusgate.edu"
        ).split(",") if email.strip()
    ]

settings = Settings()
