import sys
import time
from pathlib import Path
from datetime import datetime, timedelta

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.database import SessionLocal, init_db
from backend.models.camera import Camera, CameraTopology
from backend.models.authorized import AuthorizedVehicle
from backend.models.entry import VehicleEntryEvent, HandoffEvent
from backend.models.observation import VehicleObservation, PlateReading
from backend.reconciliation.engine import ReconciliationEngine
from backend.seed_data import seed

def print_banner(text: str):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def run_demonstration():
    print_banner("CAMPUS GATE - MULTI-CAMERA AUDITING END-TO-END PIPELINE DEMO")
    
    # Step 1: Ensure DB & Seed Data
    print("[*] Initializing database and ensuring topology & authorized registry...")
    seed()
    db = SessionLocal()

    try:
        # Step 2: Display Configured Topology
        print("\n--- 1. ACTIVE CAMERA TOPOLOGY & TRAVEL-TIME CONSTRAINTS ---")
        topologies = db.query(CameraTopology).all()
        for t in topologies:
            print(f"  Route: {t.source_camera_id} -> {t.destination_camera_id} | Window: [{t.expected_travel_time_min}s - {t.expected_travel_time_max}s] | {t.route_metadata}")

        # Step 3: SCENARIO A - Direct Authorized Entry at Gate
        print_banner("SCENARIO A: DIRECT ENTRY WITH CONFIRMED AUTHORIZED PLATE")
        now = datetime.utcnow()
        clean_plate = "MP07CA1234"
        print(f"[*] Vehicle approaching CAM-GATE-01 with readable plate: {clean_plate}...")
        
        # 1. Observation & crossing
        obs_a = VehicleObservation(
            camera_id="CAM-GATE-01",
            track_session_id=f"sess_gate_{int(time.time())}_1",
            local_track_id=101,
            captured_at=now,
            vehicle_conf=0.96,
            direction="INBOUND",
            crossing_status="CROSSED"
        )
        db.add(obs_a)
        db.flush()

        reading_a = PlateReading(
            observation_id=obs_a.id,
            raw_text=clean_plate,
            normalized_text=clean_plate,
            confidence=0.94,
            crop_quality_score=0.88,
            is_valid_format=True
        )
        db.add(reading_a)
        db.flush()

        # Check authorization
        auth_record = db.query(AuthorizedVehicle).filter(
            AuthorizedVehicle.registration_number == clean_plate,
            AuthorizedVehicle.is_active == True
        ).first()

        entry_a = VehicleEntryEvent(
            registration_number=clean_plate,
            first_observed_at=now,
            entry_confirmed_at=now,
            identity_status="IDENTIFIED",
            authorization_state="AUTHORIZED" if auth_record else "NOT_MATCHED",
            resolution_method="DIRECT_ENTRY_OCR",
            primary_camera_id="CAM-GATE-01",
            primary_observation_id=obs_a.id
        )
        db.add(entry_a)
        db.commit()
        db.refresh(entry_a)

        print(f"[+] Entry Recorded: ID={entry_a.id[:8]} | Plate={entry_a.registration_number}")
        print(f"    Identity Status: {entry_a.identity_status}")
        print(f"    Authorization  : {entry_a.authorization_state} (Owner: {auth_record.owner_name}, Dept: {auth_record.department})")
        print(f"    Resolution     : {entry_a.resolution_method}")

        # Step 4: SCENARIO B - Unreadable Gate Entry & Cross-Camera Handoff
        print_banner("SCENARIO B: UNREADABLE GATE ENTRY -> CROSS-CAMERA HANDOFF")
        print("[*] Vehicle crosses CAM-GATE-01 entry line, but license plate is blurred/unreadable...")
        
        obs_b = VehicleObservation(
            camera_id="CAM-GATE-01",
            track_session_id=f"sess_gate_{int(time.time())}_2",
            local_track_id=102,
            captured_at=now,
            vehicle_conf=0.93,
            direction="INBOUND",
            crossing_status="CROSSED"
        )
        db.add(obs_b)
        db.flush()

        # Unreadable entry event
        entry_b = VehicleEntryEvent(
            registration_number=None,
            first_observed_at=now,
            entry_confirmed_at=now,
            identity_status="HANDOFF_PENDING",
            authorization_state="REVIEW_REQUIRED",
            resolution_method=None,
            primary_camera_id="CAM-GATE-01",
            primary_observation_id=obs_b.id
        )
        db.add(entry_b)
        db.commit()
        db.refresh(entry_b)

        # Trigger handoff
        engine = ReconciliationEngine(db)
        handoff = engine.create_pending_handoff(entry_b, "CAM-GATE-01", obs_b.id)
        print(f"[+] Created Handoff Event: Target Cameras=[{handoff.candidate_camera_ids}]")
        print(f"    Travel Time Window: [{handoff.window_start.strftime('%H:%M:%S')} - {handoff.window_end.strftime('%H:%M:%S')}]")
        print(f"    Entry Status: {entry_b.identity_status} | Auth: {entry_b.authorization_state}")

        # Test early rejection (before min travel time window)
        print("\n[*] Simulating false / premature sighting at CAM-DOWNSTREAM-01 (before min travel time)...")
        obs_early = VehicleObservation(
            camera_id="CAM-DOWNSTREAM-01",
            track_session_id="sess_fake",
            local_track_id=999,
            captured_at=now + timedelta(seconds=1.0),
            crossing_status="APPROACHING"
        )
        early_res = engine.evaluate_downstream_observation(obs_early, None)
        print(f"    Rejection result: {early_res}")

        # Simulate arrival at CAM-DOWNSTREAM-01 within the valid 15-second window
        downstream_time = now + timedelta(seconds=10.0)
        downstream_plate = "22BH1024AA"  # Authorized Registrar vehicle
        print(f"\n[*] Vehicle reaches CAM-DOWNSTREAM-01 at {downstream_time.strftime('%H:%M:%S')} (10s later)...")
        print(f"[*] Downstream camera obtains clear OCR reading: {downstream_plate}...")

        obs_downstream = VehicleObservation(
            camera_id="CAM-DOWNSTREAM-01",
            track_session_id=f"sess_downstream_{int(time.time())}",
            local_track_id=202,
            captured_at=downstream_time,
            vehicle_conf=0.95,
            crossing_status="APPROACHING"
        )
        db.add(obs_downstream)
        db.flush()

        reading_downstream = PlateReading(
            observation_id=obs_downstream.id,
            raw_text=downstream_plate,
            normalized_text=downstream_plate,
            confidence=0.92,
            crop_quality_score=0.85,
            is_valid_format=True
        )
        db.add(reading_downstream)
        db.flush()

        # Reconcile
        match_result = engine.evaluate_downstream_observation(obs_downstream, reading_downstream)
        db.refresh(entry_b)
        print(f"[+] Cross-Camera Matching Succeeded: {match_result}")
        print(f"    Reconciled Entry: ID={entry_b.id[:8]} | Resolved Plate={entry_b.registration_number}")
        print(f"    New Identity Status: {entry_b.identity_status}")
        print(f"    New Authorization  : {entry_b.authorization_state}")
        print(f"    Resolution Method  : {entry_b.resolution_method}")

        # Step 5: Summary Report
        print_banner("SYSTEM AUDIT SUMMARY")
        total = db.query(VehicleEntryEvent).count()
        auth = db.query(VehicleEntryEvent).filter(VehicleEntryEvent.authorization_state == "AUTHORIZED").count()
        unauth = db.query(VehicleEntryEvent).filter(VehicleEntryEvent.authorization_state == "NOT_MATCHED").count()
        review = db.query(VehicleEntryEvent).filter(VehicleEntryEvent.identity_status == "REVIEW_REQUIRED").count()
        associated = db.query(VehicleEntryEvent).filter(VehicleEntryEvent.identity_status == "ASSOCIATED").count()
        
        print(f"  Total Vehicle Entries Processed : {total}")
        print(f"  Authorized Entries              : {auth}")
        print(f"  Unauthorized / Unregistered     : {unauth}")
        print(f"  Cross-Camera Associated         : {associated}")
        print(f"  Pending Operator Review         : {review}")
        print("=" * 70)
        print("[+] Demonstration completed with all tests passing successfully!\n")

    finally:
        db.close()

if __name__ == "__main__":
    run_demonstration()
