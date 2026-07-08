import strawberry
from typing import List
from strawberry.types import Info
from .models import LocationLog
from .outputs import LocationLogType

@strawberry.type
class TrackingQuery:
    @strawberry.field
    def trip_location_logs(self, info: Info, trip_id: str) -> List[LocationLogType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        return list(LocationLog.objects.filter(trip_id=trip_id).order_by("timestamp"))
