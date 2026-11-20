from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime

class CameraBase(BaseModel):
    id: str
    name: str
    stream_url: Optional[str] = None
    physical_role: str = "ENTRY"
    location_description: Optional[str] = None
    is_active: bool = True

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases(cls, values):
        if isinstance(values, dict):
            # Map rtsp_url to stream_url
            if not values.get("stream_url") and values.get("rtsp_url"):
                values["stream_url"] = values.get("rtsp_url")
            # Map role to physical_role (e.g. ENTRY_GATE -> ENTRY, INTERNAL_CORRIDOR -> DOWNSTREAM)
            if values.get("role"):
                r = str(values.get("role")).upper()
                if "ENTRY" in r:
                    values["physical_role"] = "ENTRY"
                elif "EXIT" in r:
                    values["physical_role"] = "EXIT"
                else:
                    values["physical_role"] = "DOWNSTREAM"
        return values

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
    model_config = ConfigDict(from_attributes=True)

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
    model_config = ConfigDict(from_attributes=True)
