import time
from datetime import datetime, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.cache import ResilientCache
from backend.core.database import Base
from backend.models.camera import Camera
from backend.models.entry import VehicleEntryEvent, HandoffEvent
from backend.reconciliation.sweeper import HandoffSweeper
from backend.reconciliation.engine import ReconciliationEngine


def test_resilient_cache_operations():
    cache = ResilientCache(redis_url=None)  # Uses in-memory fallback

    # 1. Set and get
    sample_data = {"total_entries": 100, "authorized_count": 80}
    cache.set_json("test_key", sample_data, ttl_seconds=2)
    assert cache.get_json("test_key") == sample_data

    # 2. Deletion
    cache.delete("test_key")
    assert cache.get_json("test_key") is None

    # 3. Expiry
    cache.set_json("expire_key", {"msg": "hello"}, ttl_seconds=1)
    time.sleep(1.1)
    assert cache.get_json("expire_key") is None


def test_handoff_sweeper_transitions(monkeypatch, tmp_path):
    # Setup temporary SQLite database for test isolation
    test_db_url = f"sqlite:///{tmp_path}/test_sweeper.db"
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Patch SessionLocal in sweeper to use our test DB
    import backend.reconciliation.sweeper as sweeper_mod
    monkeypatch.setattr(sweeper_mod, "SessionLocal", TestingSession)

    db = TestingSession()
    try:
        # Create a camera
        cam = Camera(id="CAM-GATE-TEST", name="Test Gate", physical_role="ENTRY")
        db.add(cam)
        db.commit()

        # Create an entry with an expired handoff
        past_time = datetime.utcnow() - timedelta(minutes=5)
        entry = VehicleEntryEvent(
            id="test-entry-uuid",
            first_observed_at=past_time,
            identity_status="HANDOFF_PENDING",
            authorization_state="REVIEW_REQUIRED",
            primary_camera_id="CAM-GATE-TEST"
        )
        db.add(entry)
        db.commit()

        handoff = HandoffEvent(
            id="test-handoff-uuid",
            entry_event_id=entry.id,
            source_camera_id="CAM-GATE-TEST",
            source_observation_id="test-obs-1",
            candidate_camera_ids="CAM-DOWNSTREAM-1",
            window_start=past_time,
            window_end=past_time + timedelta(seconds=30),  # expired 4+ minutes ago!
            status="PENDING"
        )
        db.add(handoff)
        db.commit()

        # Execute sweep
        sweeper = HandoffSweeper(interval_seconds=60)
        expired_count = sweeper.sweep_once()
        assert expired_count == 1

        # Verify DB changes
        db.refresh(handoff)
        db.refresh(entry)
        assert handoff.status == "EXPIRED"
        assert entry.identity_status == "UNRESOLVED"
        assert entry.resolution_method == "UNRESOLVED"
    finally:
        db.close()

