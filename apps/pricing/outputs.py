import strawberry
import strawberry_django
from strawberry import auto
from typing import Optional
from .models import Quote, PricingMatrix

@strawberry_django.type(Quote)
class QuoteType:
    id: auto
    pickup_location: auto
    delivery_location: auto
    pickup_lat: auto
    pickup_lng: auto
    delivery_lat: auto
    delivery_lng: auto
    weight_tons: auto
    container_type: auto
    cargo_details: auto
    estimated_price: auto
    status: auto
    created_at: auto

@strawberry_django.type(PricingMatrix)
class PricingMatrixType:
    id: auto
    source_location: auto
    destination_location: auto
    container_type: auto
    base_rate: auto
    per_km_rate: auto
    per_ton_rate: auto

@strawberry.type
class RequestQuoteResponse:
    success: bool
    message: str
    quote: Optional[QuoteType] = None
