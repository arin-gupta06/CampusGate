from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.core.database import get_db
from backend.models.entry import VehicleEntryEvent, HandoffEvent
from backend.models.authorized import AuthorizedVehicle
from backend.schemas.entry import EntryEventResponse, ReviewResolvePayload, AuditSummaryResponse
from backend.reconciliation.engine import ReconciliationEngine
from backend.vision.ocr_reader import IndianPlateNormalizer
from backend.core.cache import cache

router = APIRouter(prefix="/api/entries", tags=["Vehicle Entries & Audit"])

@router.get("", response_model=List[EntryEventResponse])
def list_entries(
    status: Optional[str] = None,
    auth_state: Optional[str] = None,
    camera_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(VehicleEntryEvent)
    if status:
        query = query.filter(VehicleEntryEvent.identity_status == status)
    if auth_state:
        query = query.filter(VehicleEntryEvent.authorization_state == auth_state)
    if camera_id:
        query = query.filter(VehicleEntryEvent.primary_camera_id == camera_id)
    return query.order_by(VehicleEntryEvent.first_observed_at.desc()).offset(skip).limit(limit).all()

@router.get("/summary", response_model=AuditSummaryResponse)
def get_audit_summary(db: Session = Depends(get_db)):
    # 1. Check resilient Redis / In-Memory cache (sub-millisecond, bypasses DB)
    cached_summary = cache.get_json("cache:audit_summary")
    if cached_summary:
        return AuditSummaryResponse(**cached_summary)

    # 2. Cache miss: Execute single aggregated SQL query
    row = db.query(
        func.count().label("total"),
        func.count().filter(VehicleEntryEvent.authorization_state == "AUTHORIZED").label("auth_cnt"),
        func.count().filter(VehicleEntryEvent.authorization_state == "NOT_MATCHED").label("unauth_cnt"),
        func.count().filter(VehicleEntryEvent.identity_status == "REVIEW_REQUIRED").label("rev_cnt"),
        func.count().filter(VehicleEntryEvent.identity_status == "UNRESOLVED").label("unres_cnt"),
        func.count().filter(VehicleEntryEvent.identity_status == "HANDOFF_PENDING").label("handoff_cnt"),
    ).first()

    summary_data = {
        "total_entries": row.total or 0,
        "authorized_count": row.auth_cnt or 0,
        "unauthorized_count": row.unauth_cnt or 0,
        "review_required_count": row.rev_cnt or 0,
        "unresolved_count": row.unres_cnt or 0,
        "handoff_pending_count": row.handoff_cnt or 0,
    }

    # 3. Store in cache with 15-second TTL
    cache.set_json("cache:audit_summary", summary_data, ttl_seconds=15)
    return AuditSummaryResponse(**summary_data)

@router.get("/reviews", response_model=List[EntryEventResponse])
def get_pending_reviews(db: Session = Depends(get_db)):
    """Returns all entry events marked REVIEW_REQUIRED for operator verification."""
    return db.query(VehicleEntryEvent).filter(
        VehicleEntryEvent.identity_status == "REVIEW_REQUIRED"
    ).order_by(VehicleEntryEvent.first_observed_at.desc()).all()

@router.post("/reviews/{entry_id}/resolve", response_model=EntryEventResponse)
def resolve_review_case(
    entry_id: str,
    payload: ReviewResolvePayload,
    db: Session = Depends(get_db)
):
    entry = db.query(VehicleEntryEvent).filter(VehicleEntryEvent.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry event not found")

    if payload.registration_number:
        clean_plate = IndianPlateNormalizer.clean_text(payload.registration_number)
        entry.registration_number = clean_plate
        
        # Check authorization
        auth = db.query(AuthorizedVehicle).filter(
            AuthorizedVehicle.registration_number == clean_plate,
            AuthorizedVehicle.is_active == True
        ).first()
        entry.authorization_state = "AUTHORIZED" if auth else "NOT_MATCHED"

    entry.review_status = payload.review_decision
    entry.review_notes = payload.notes
    entry.resolution_method = "MANUAL_REVIEW"
    if payload.review_decision == "APPROVED":
        entry.identity_status = "IDENTIFIED"
    elif payload.review_decision == "REJECTED":
        entry.identity_status = "UNRESOLVED"

    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    cache.delete("cache:audit_summary")
    return entry

@router.post("/handoffs/expire")
def trigger_handoff_expiry(db: Session = Depends(get_db)):
    engine = ReconciliationEngine(db)
    expired_count = engine.expire_stale_handoffs()
    if expired_count > 0:
        cache.delete("cache:audit_summary")
    return {"status": "ok", "expired_handoffs_count": expired_count}
