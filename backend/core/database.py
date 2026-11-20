import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.core.config import settings

logger = logging.getLogger("campusgate.db")

Base = declarative_base()

def get_engine():
    try:
        connect_args = (
            {"connect_timeout": 1}
            if "postgresql" in settings.DATABASE_URL
            else {}
        )

        engine = create_engine(
            settings.DATABASE_URL,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20
        )

        with engine.connect():
            pass

        # Never expose database credentials in application logs.
        logger.info("Successfully connected to PostgreSQL.")

        return engine

    except Exception:
        if settings.ENVIRONMENT.lower() == "production":
            logger.exception(
                "PostgreSQL connection failed. "
                "SQLite fallback is disabled in production."
            )
            raise

        logger.warning(
            "PostgreSQL unavailable. Using SQLite for development."
        )

        return create_engine(
            settings.FALLBACK_SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
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
