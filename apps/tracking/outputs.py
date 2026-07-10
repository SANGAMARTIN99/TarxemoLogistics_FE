import strawberry
import strawberry_django
from strawberry import auto
from typing import List, Optional
from .models import LocationLog

@strawberry_django.type(LocationLog)
class LocationLogType:
    id: auto
    latitude: auto
    longitude: auto
    speed_kph: auto
    heading: auto
    timestamp: auto

@strawberry.type
class ShipmentTrackingDriverType:
    id: str
    first_name: str
    last_name: str
    phone: str
    rating: float
    vehicle_plate: str

@strawberry.type
class ShipmentTrackingMilestoneType:
    id: str
    location: str
    lat: float
    lng: float
    estimated_time: str
    actual_time: Optional[str]
    status: str # "PASSED", "CURRENT", "PENDING"
    description: str

@strawberry.type
class ShipmentTrackingLocationLogType:
    lat: float
    lng: float
    speed_kph: float
    timestamp: str

@strawberry.type
class ShipmentTrackingType:
    id: str
    tracking_number: str
    status: str
    pickup: str
    delivery: str
    estimated_delivery: str
    current_lat: float
    current_lng: float
    current_location: str
    driver: Optional[ShipmentTrackingDriverType]
    milestones: List[ShipmentTrackingMilestoneType]
    location_logs: List[ShipmentTrackingLocationLogType]
