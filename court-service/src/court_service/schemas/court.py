import uuid
from enum import Enum

from pydantic import BaseModel


class Surface(str, Enum):
    CLAY = "clay"
    GRASS = "grass"
    HARD = "hard"


class CourtBase(BaseModel):
    name: str
    surface: Surface
    is_indoor: bool = False
    hourly_rate: float


class CourtCreate(CourtBase):
    pass


class CourtUpdate(BaseModel):
    name: str | None = None
    surface: Surface | None = None
    is_indoor: bool | None = None
    hourly_rate: float | None = None
    is_active: bool | None = None


class CourtResponse(CourtBase):
    id: uuid.UUID
    is_active: bool

    model_config = {"from_attributes": True}
