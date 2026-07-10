import strawberry
from typing import Optional

@strawberry.input
class RequestQuoteInput:
    pickup_location: str
    delivery_location: str
    weight_tons: float
    container_type: str
    cargo_details: Optional[str] = ""
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
