import strawberry
from typing import Optional

@strawberry.input
class LocationLogInput:
    trip_id: str
    latitude: float
    longitude: float
    speed_kph: Optional[float] = None
    heading: Optional[float] = None
