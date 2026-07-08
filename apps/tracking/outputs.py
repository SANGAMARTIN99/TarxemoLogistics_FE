import strawberry
import strawberry_django
from strawberry import auto
from .models import LocationLog

@strawberry_django.type(LocationLog)
class LocationLogType:
    id: auto
    latitude: auto
    longitude: auto
    speed_kph: auto
    heading: auto
    timestamp: auto
