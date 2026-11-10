import uuid
import random
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.core.config import settings
from backend.core.database import get_db
from backend.core.cache import cache
from backend.core.ws_manager import ws_manager
from backend.models.camera import Camera
from backend.models.observation import VehicleObservation, PlateReading
from backend.models.entry import VehicleEntryEvent
from backend.models.authorized import AuthorizedVehicle
from backend.reconciliation.engine import ReconciliationEngine
from backend.vision.ocr_reader import IndianPlateNormalizer
from backend.ingestion.crop_manager import crop_manager

router = APIRouter(prefix="/api/vision", tags=["Vision Ingestion Pipeline"])

class ObservationIngestPayload(BaseModel):
    camera_id: str
    track_session_id: Optional[str] = None
    local_track_id: int
    vehicle_conf: float = 0.85
    plate_conf: Optional[float] = None
    direction: Optional[str] = "INBOUND"
    crossing_status: str = "CROSSED"  # APPROACHING, CROSSED
    raw_plate_text: Optional[str] = None
    crop_quality_score: float = 0.80

class SimulationPayload(BaseModel):
    plate_number: Optional[str] = None
    camera_id: Optional[str] = "gate-cam-1"
    status: Optional[str] = None
    reason: Optional[str] = None

@router.post("/ingest_observation")
async def ingest_observation(payload: ObservationIngestPayload, db: Session = Depends(get_db)):
    """
    Ingests vehicle and plate observations from camera vision runners.
    Automatically handles entry line events, authorization lookup, and cross-camera handoffs.
    """
    camera = db.query(Camera).filter(Camera.id == payload.camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{payload.camera_id}' not found in registry")

    session_id = payload.track_session_id or f"sess_{payload.camera_id}_{payload.local_track_id}_{uuid.uuid4().hex[:6]}"
    now = datetime.utcnow()

    # 1. Store observation
    obs = VehicleObservation(
        camera_id=payload.camera_id,
        track_session_id=session_id,
        local_track_id=payload.local_track_id,
        captured_at=now,
        vehicle_conf=payload.vehicle_conf,
        plate_conf=payload.plate_conf,
        direction=payload.direction,
        crossing_status=payload.crossing_status
    )
    db.add(obs)
    db.flush()

    # 2. Store plate reading if present
    plate_reading = None
    if payload.raw_plate_text:
        normalized, is_valid, ptype = IndianPlateNormalizer.validate_and_normalize(payload.raw_plate_text)
        plate_reading = PlateReading(
            observation_id=obs.id,
            raw_text=payload.raw_plate_text,
            normalized_text=normalized,
            confidence=payload.plate_conf or 0.85,
            crop_quality_score=payload.crop_quality_score,
            is_valid_format=is_valid,
            model_version="v1.0"
        )
        db.add(plate_reading)
        db.flush()

    # 3. Handle Downstream Reconciliation if this is a downstream camera
    if camera.physical_role == "DOWNSTREAM":
        reconcile_engine = ReconciliationEngine(db)
        match_result = reconcile_engine.evaluate_downstream_observation(obs, plate_reading)
        db.commit()
        return {
            "status": "downstream_processed",
            "observation_id": obs.id,
            "reconciliation": match_result
        }

    # 4. Handle Entry Camera Crossing
    if camera.physical_role == "ENTRY" and payload.crossing_status == "CROSSED":
        clean_plate = plate_reading.normalized_text if (plate_reading and plate_reading.is_valid_format) else None
        
        identity_status = "IDENTIFIED" if clean_plate else "HANDOFF_PENDING"
        authorization_state = "REVIEW_REQUIRED"

        if clean_plate:
            auth = db.query(AuthorizedVehicle).filter(
                AuthorizedVehicle.registration_number == clean_plate,
                AuthorizedVehicle.is_active == True
            ).first()
            authorization_state = "AUTHORIZED" if auth else "NOT_MATCHED"

        entry_event = VehicleEntryEvent(
            registration_number=clean_plate,
            first_observed_at=now,
            entry_confirmed_at=now,
            identity_status=identity_status,
            authorization_state=authorization_state,
            resolution_method="DIRECT_ENTRY_OCR" if clean_plate else None,
            primary_camera_id=camera.id,
            primary_observation_id=obs.id
        )
        db.add(entry_event)
        db.commit()
        db.refresh(entry_event)

        # Invalidate summary cache
        cache.delete("cache:audit_summary")

        # Broadcast live event to all connected WebSocket clients
        ws_event = {
            "id": entry_event.id,
            "plate_number": clean_plate or "UNKNOWN",
            "confidence": payload.plate_conf or 0.94,
            "entry_status": authorization_state,
            "review_reason": "Automated OCR Clearance" if authorization_state == "AUTHORIZED" else "Plate Not Registered",
            "first_seen_at": now.isoformat(),
            "camera_name": camera.name,
            "camera_id": camera.id
        }
        await ws_manager.broadcast(ws_event)

        # If unreadable plate at entry, trigger handoff creation
        if not clean_plate:
            reconcile_engine = ReconciliationEngine(db)
            handoff = reconcile_engine.create_pending_handoff(entry_event, camera.id, obs.id)
            return {
                "status": "entry_crossed_handoff_pending",
                "entry_id": entry_event.id,
                "handoff_created": handoff is not None,
                "observation_id": obs.id
            }

        return {
            "status": "entry_crossed_identified",
            "entry_id": entry_event.id,
            "plate": clean_plate,
            "authorization": authorization_state
        }

    db.commit()
    return {"status": "observation_recorded", "observation_id": obs.id}


@router.post("/simulate")
async def simulate_ingress(payload: Optional[SimulationPayload] = None, db: Session = Depends(get_db)):
    """
    Triggers a live vehicle arrival event simulation.
    Persists the entry event in the database and broadcasts to all WebSocket clients.
    """
    DEMO_POOL = [
        {"plate": "MP07AB1234", "role": "STUDENT", "owner": "Rajesh Gupta", "person": "Arin Gupta (Student)", "desc": "Annual Pass Verified"},
        {"plate": "MP07CD5678", "role": "FACULTY", "owner": "Priya Sharma", "person": "Priya Sharma (Faculty)", "desc": "Faculty Clearance Granted"},
        {"plate": "MP07EF9012", "role": "FACULTY", "owner": "Dr. Amit Verma", "person": "Dr. Amit Verma (HOD)", "desc": "Faculty Gate Clearance"},
        {"plate": "MP07XY9999", "role": "UNKNOWN", "owner": "Unregistered Visitor", "person": "Guest Driver", "desc": "Unlisted Vehicle Alert"},
        {"plate": "MP07GH3456", "role": "STUDENT", "owner": "Rohan Singh", "person": "Rohan Singh (Student)", "desc": "Permit Inspection Required"}
    ]

    selected = random.choice(DEMO_POOL)
    target_plate = (payload and payload.plate_number) or selected["plate"]
    clean_plate = IndianPlateNormalizer.clean_text(target_plate)

    cam_id = (payload and payload.camera_id) or "gate-cam-1"
    camera = db.query(Camera).filter(Camera.id == cam_id).first()
    if not camera:
        # Auto-provision camera if not already in DB
        camera = Camera(
            id=cam_id,
            name="Gate 1 - Main Ingress",
            physical_role="ENTRY",
            is_active=True
        )
        db.add(camera)
        db.flush()

    # Check authorized vehicle
    auth = db.query(AuthorizedVehicle).filter(
        AuthorizedVehicle.registration_number == clean_plate,
        AuthorizedVehicle.is_active == True
    ).first()

    auth_state = "AUTHORIZED" if auth else ("NOT_MATCHED" if clean_plate.endswith("9999") else "AUTHORIZED")
    if payload and payload.status:
        auth_state = payload.status

    now = datetime.utcnow()
    entry = VehicleEntryEvent(
        registration_number=clean_plate,
        first_observed_at=now,
        entry_confirmed_at=now,
        identity_status="IDENTIFIED" if auth_state == "AUTHORIZED" else "REVIEW_REQUIRED",
        authorization_state=auth_state,
        resolution_method="DIRECT_ENTRY_OCR",
        primary_camera_id=camera.id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Invalidate cached summary so counts refresh immediately
    cache.delete("cache:audit_summary")

    event_data = {
        "id": entry.id,
        "plate_number": clean_plate,
        "confidence": 0.98,
        "entry_status": auth_state,
        "review_reason": (payload and payload.reason) or (auth.notes if auth else selected["desc"]),
        "first_seen_at": now.isoformat(),
        "camera_name": camera.name,
        "camera_id": camera.id,
        "owner_name": auth.owner_name if auth else selected["owner"],
        "associated_person": auth.owner_name if auth else selected["person"]
    }

    try:
        await ws_manager.broadcast(event_data)
    except Exception as e:
        print(f"WS Broadcast error: {e}")

    return {
        "status": "simulation_triggered",
        "entry": event_data
    }


@router.get("/crops/{crop_ref:path}")
def get_plate_crop(crop_ref: str):
    """
    Serves cropped plate images directly from Redis / Memory cache,
    or falls back to static disk files if archived for audit.
    """
    data = crop_manager.get_crop_bytes(crop_ref)
    if data:
        return Response(content=data, media_type="image/jpeg")

    clean_ref = crop_ref.replace("\\", "/")
    if clean_ref.startswith("static/"):
        disk_path = settings.BASE_DIR / "backend" / clean_ref
        if disk_path.exists() and disk_path.is_file():
            with open(disk_path, "rb") as f:
                return Response(content=f.read(), media_type="image/jpeg")

    raise HTTPException(status_code=404, detail="Crop image expired or not found")
