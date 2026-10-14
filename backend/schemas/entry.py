from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class EntryEventResponse(BaseModel):
    id: str
    registration_number: Optional[str] = None
    first_observed_at: datetime
    entry_confirmed_at: Optional[datetime] = None
    identity_status: str
    authorization_state: str
    resolution_method: Optional[str] = None
    primary_camera_id: str
    review_status: str
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReviewResolvePayload(BaseModel):
    registration_number: Optional[str] = None
    review_decision: str  # APPROVED, REJECTED, UNRESOLVED
    notes: Optional[str] = None

class AuditSummaryResponse(BaseModel):
    total_entries: int
    authorized_count: int
    unauthorized_count: int
    review_required_count: int
    unresolved_count: int
    handoff_pending_count: int
