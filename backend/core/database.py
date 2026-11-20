import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.core.config import settings

logger = logging.getLogger("campusgate.db")

Base = declarative_base()

def get_engine():
    try:
        # Try primary PostgreSQL connection
        connect_args = {"connect_timeout": 1} if "postgresql" in settings.DATABASE_URL else {}
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20
        )
        with engine.connect() as conn:
            pass
        logger.info(f"Connected to PostgreSQL database at {settings.DATABASE_URL}")
        return engine
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL: {e}. Falling back to SQLite.")
        fallback_engine = create_engine(
            settings.FALLBACK_SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
        return fallback_engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend.models import camera, observation, entry, authorized, user
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas verified / initialized.")
