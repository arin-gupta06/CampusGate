import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.database import SessionLocal, init_db
from backend.models.camera import Camera, CameraTopology
from backend.models.authorized import AuthorizedVehicle

def seed():
    init_db()
    db = SessionLocal()
    try:
        # 1. Cameras
        cameras = [
            Camera(
                id="CAM-GATE-01",
                name="Main North Entry Gate",
                stream_url="rtsp://192.168.1.101/live",
                physical_role="ENTRY",
                location_description="Main Campus North Gate - Lane 1 Inbound",
                is_active=True
            ),
            Camera(
                id="CAM-DOWNSTREAM-01",
                name="Academic Junction Checkpoint",
                stream_url="rtsp://192.168.1.102/live",
                physical_role="DOWNSTREAM",
                location_description="Junction connecting Gate 1 to Academic Block 1",
                is_active=True
            ),
            Camera(
                id="CAM-DOWNSTREAM-02",
                name="Library Roundabout Checkpoint",
                stream_url="rtsp://192.168.1.103/live",
                physical_role="DOWNSTREAM",
                location_description="Roundabout outside Central Library",
                is_active=True
            ),
            Camera(
                id="CAM-EXIT-01",
                name="South Exit Gate",
                stream_url="rtsp://192.168.1.104/live",
                physical_role="EXIT",
                location_description="Main Campus South Gate - Outbound",
                is_active=True
            ),
        ]

        for cam in cameras:
            if not db.query(Camera).filter(Camera.id == cam.id).first():
                db.add(cam)
        db.commit()

        # 2. Camera Topology
        topologies = [
            CameraTopology(
                source_camera_id="CAM-GATE-01",
                destination_camera_id="CAM-DOWNSTREAM-01",
                expected_travel_time_min=4.0,
                expected_travel_time_max=30.0,
                route_metadata="Straight corridor from North Gate to Academic Block"
            ),
            CameraTopology(
                source_camera_id="CAM-GATE-01",
                destination_camera_id="CAM-DOWNSTREAM-02",
                expected_travel_time_min=8.0,
                expected_travel_time_max=50.0,
                route_metadata="Left fork corridor toward Library Roundabout"
            )
        ]

        for topo in topologies:
            exists = db.query(CameraTopology).filter(
                CameraTopology.source_camera_id == topo.source_camera_id,
                CameraTopology.destination_camera_id == topo.destination_camera_id
            ).first()
            if not exists:
                db.add(topo)
        db.commit()

        # 3. Authorized Vehicles Registry
        authorized = [
            AuthorizedVehicle(
                registration_number="MP07CA1234",
                owner_name="Dr. R. K. Sharma",
                owner_role="FACULTY",
                department="Computer Science & Engineering",
                vehicle_type="CAR"
            ),
            AuthorizedVehicle(
                registration_number="DL01AB9876",
                owner_name="Campus Medical Center",
                owner_role="STAFF",
                department="Health & Emergency Services",
                vehicle_type="AMBULANCE"
            ),
            AuthorizedVehicle(
                registration_number="HR26DQ5551",
                owner_name="Prof. Anita Verma",
                owner_role="FACULTY",
                department="Electronics & Communication",
                vehicle_type="CAR"
            ),
            AuthorizedVehicle(
                registration_number="22BH1024AA",
                owner_name="Administrative Office",
                owner_role="STAFF",
                department="Registrar Office",
                vehicle_type="CAR"
            )
        ]

        for auth in authorized:
            if not db.query(AuthorizedVehicle).filter(AuthorizedVehicle.registration_number == auth.registration_number).first():
                db.add(auth)
        db.commit()

        print("[+] Seed data populated successfully in PostgreSQL database!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
