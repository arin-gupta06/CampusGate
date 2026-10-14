from backend.models.camera import Camera, CameraTopology
from backend.models.observation import VehicleObservation, PlateReading
from backend.models.entry import VehicleEntryEvent, HandoffEvent
from backend.models.authorized import AuthorizedVehicle

__all__ = [
    "Camera",
    "CameraTopology",
    "VehicleObservation",
    "PlateReading",
    "VehicleEntryEvent",
    "HandoffEvent",
    "AuthorizedVehicle"
]
