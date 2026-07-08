import strawberry
from strawberry.types import Info
from .models import LocationLog
from .inputs import LocationLogInput
from .outputs import LocationLogType

@strawberry.type
class TrackingMutation:
    @strawberry.mutation
    def log_location(self, info: Info, input: LocationLogInput) -> LocationLogType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        log = LocationLog.objects.create(
            trip_id=input.trip_id,
            latitude=input.latitude,
            longitude=input.longitude,
            speed_kph=input.speed_kph,
            heading=input.heading
        )

        # Trigger real-time WebSocket broadcast
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"trip_tracking_{log.trip_id}",
                {
                    "type": "location_update",
                    "lat": float(log.latitude),
                    "lng": float(log.longitude),
                    "speed": float(log.speed_kph) if log.speed_kph else 0.0,
                    "heading": float(log.heading) if log.heading else 0.0,
                    "timestamp": log.timestamp.isoformat(),
                    "trip_id": str(log.trip_id),
                }
            )

        return log
