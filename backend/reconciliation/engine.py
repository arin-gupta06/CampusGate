from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.models.entry import VehicleEntryEvent, HandoffEvent
from backend.models.camera import CameraTopology
from backend.models.observation import VehicleObservation, PlateReading
from backend.models.authorized import AuthorizedVehicle

class ReconciliationEngine:
    """
    Evidence-based cross-camera reconciliation engine adhering to Blueprint §6.
    Resolves handoff events using topology, travel-time constraints, and plate evidence.
    """

    def __init__(self, db: Session):
        self.db = db

    def create_pending_handoff(
        self,
        entry_event: VehicleEntryEvent,
        source_camera_id: str,
        source_observation_id: str
    ) -> Optional[HandoffEvent]:
        """
        Creates a pending handoff event for an unreadable vehicle entry.
        Discovers valid downstream candidate cameras from the topology.
        """
        topologies = self.db.query(CameraTopology).filter(
            CameraTopology.source_camera_id == source_camera_id
        ).all()

        if not topologies:
            # No configured downstream cameras; mark for review
            entry_event.identity_status = "REVIEW_REQUIRED"
            entry_event.resolution_method = "UNRESOLVED_NO_TOPOLOGY"
            self.db.commit()
            return None

        candidate_ids = [t.destination_camera_id for t in topologies]
        min_travel = min(t.expected_travel_time_min for t in topologies)
        max_travel = max(t.expected_travel_time_max for t in topologies)

        entry_time = entry_event.entry_confirmed_at or entry_event.first_observed_at
        window_start = entry_time + timedelta(seconds=min_travel)
        window_end = entry_time + timedelta(seconds=max_travel)

        handoff = HandoffEvent(
            entry_event_id=entry_event.id,
            source_camera_id=source_camera_id,
            source_observation_id=source_observation_id,
            candidate_camera_ids=",".join(candidate_ids),
            window_start=window_start,
            window_end=window_end,
            status="PENDING"
        )
        entry_event.identity_status = "HANDOFF_PENDING"
        
        self.db.add(handoff)
        self.db.commit()
        self.db.refresh(handoff)
        return handoff

    def evaluate_downstream_observation(
        self,
        observation: VehicleObservation,
        plate_reading: Optional[PlateReading]
    ) -> Dict[str, Any]:
        """
        Evaluates whether a new downstream observation matches any pending handoff events.
        """
        now = observation.captured_at or datetime.utcnow()

        # Find pending handoffs where this camera is in the candidate list
        pending_handoffs = self.db.query(HandoffEvent).filter(
            HandoffEvent.status == "PENDING",
            HandoffEvent.window_start <= now,
            HandoffEvent.window_end >= now
        ).all()

        candidates = [
            h for h in pending_handoffs 
            if observation.camera_id in h.candidate_camera_ids.split(",")
        ]

        if not candidates:
            return {"matched": False, "reason": "No active travel-window match"}

        if len(candidates) > 1 and not plate_reading:
            # Ambiguity: Multiple pending entries within overlapping travel time window!
            for h in candidates:
                h.status = "AMBIGUOUS"
                h.entry_event.identity_status = "REVIEW_REQUIRED"
                h.resolution_reason = "Multiple candidate vehicles within overlapping travel window."
            self.db.commit()
            return {"matched": False, "status": "AMBIGUOUS", "candidates_count": len(candidates)}

        # Single candidate or confirmed plate match
        target_handoff = candidates[0]
        entry = target_handoff.entry_event

        if plate_reading and plate_reading.normalized_text:
            entry.registration_number = plate_reading.normalized_text
            entry.identity_status = "ASSOCIATED"
            entry.resolution_method = "CROSS_CAMERA_HANDOFF"
            target_handoff.status = "MATCHED"
            target_handoff.matched_camera_id = observation.camera_id
            target_handoff.matched_observation_id = observation.id
            target_handoff.resolution_reason = f"Matched plate {plate_reading.normalized_text} at downstream camera {observation.camera_id}"
            
            # Check authorization registry
            auth_record = self.db.query(AuthorizedVehicle).filter(
                AuthorizedVehicle.registration_number == plate_reading.normalized_text,
                AuthorizedVehicle.is_active == True
            ).first()

            if auth_record:
                entry.authorization_state = "AUTHORIZED"
            else:
                entry.authorization_state = "NOT_MATCHED"

            self.db.commit()
            return {
                "matched": True,
                "entry_id": entry.id,
                "matched_camera_id": observation.camera_id,
                "plate": plate_reading.normalized_text,
                "authorization": entry.authorization_state
            }

        return {"matched": False, "reason": "Waiting for readable plate"}

    def expire_stale_handoffs(self) -> int:
        """
        Marks expired handoffs as UNRESOLVED without guessing (Blueprint §6.4).
        """
        now = datetime.utcnow()
        expired = self.db.query(HandoffEvent).filter(
            HandoffEvent.status == "PENDING",
            HandoffEvent.window_end < now
        ).all()

        for h in expired:
            h.status = "EXPIRED"
            h.resolution_reason = "Travel window expired without matching downstream observation."
            if h.entry_event.identity_status == "HANDOFF_PENDING":
                h.entry_event.identity_status = "UNRESOLVED"
                h.entry_event.resolution_method = "UNRESOLVED"

        self.db.commit()
        return len(expired)
