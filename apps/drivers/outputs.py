import strawberry
import strawberry_django
from typing import List, Optional
from strawberry import auto
from .models import DriverProfile

@strawberry_django.type(DriverProfile)
class DriverProfileType:
    id: auto
    license_number: auto
    license_class: auto
    experience_years: auto
    status: auto
    rating: auto
    created_at: auto
    updated_at: auto

@strawberry.type
class DriverEarningsType:
    this_month: float
    last_month: float
    currency: str

@strawberry.type
class DriverTripType:
    id: str
    title: str
    pickup: str
    delivery: str
    date: str
    status: str

@strawberry.type
class DriverDashboardType:
    available_jobs: int
    completed_trips: int
    rating: float
    earnings: DriverEarningsType
    upcoming_trips: List[DriverTripType]
    past_trips: List[DriverTripType]
