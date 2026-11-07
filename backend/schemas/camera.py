from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CameraBase(BaseModel):
    id: str
    name: str
    stream_url: Optional[str] = None
    physical_role: str = "ENTRY"
    location_description: Optional[str] = None
    is_active: bool = True

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    stream_url: Optional[str] = None
    physical_role: Optional[str] = None
    location_description: Optional[str] = None
    is_active: Optional[bool] = None

class CameraResponse(CameraBase):
    created_at: datetime

    class Config:
        from_attributes = True

class TopologyCreate(BaseModel):
    source_camera_id: str
    destination_camera_id: str
    expected_travel_time_min: float = 2.0
    expected_travel_time_max: float = 45.0
    route_metadata: Optional[str] = None

class TopologyUpdate(BaseModel):
    expected_travel_time_min: Optional[float] = None
    expected_travel_time_max: Optional[float] = None
    route_metadata: Optional[str] = None

class TopologyResponse(TopologyCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
