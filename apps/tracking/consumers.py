"""
apps.tracking.consumers — WebSocket Consumers
Handles real-time GPS location updates for trip and fleet tracking.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class TripTrackingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for tracking a single trip's live location.
    Group name: trip_tracking_{trip_id}
    """

    async def connect(self):
        self.trip_id = self.scope["url_route"]["kwargs"]["trip_id"]
        self.group_name = f"trip_tracking_{self.trip_id}"

        # Join the trip-specific tracking group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send initial connection confirmation
        await self.send(json.dumps({
            "type": "connected",
            "trip_id": self.trip_id,
            "message": "Connected to live trip tracking.",
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Receive GPS update from driver app."""
        try:
            data = json.loads(text_data)
            # Broadcast location to all subscribers of this trip
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "location_update",
                    "lat": data.get("lat"),
                    "lng": data.get("lng"),
                    "speed": data.get("speed"),
                    "heading": data.get("heading"),
                    "timestamp": data.get("timestamp"),
                    "trip_id": self.trip_id,
                },
            )
        except json.JSONDecodeError:
            pass

    async def location_update(self, event):
        """Push location update to WebSocket client."""
        await self.send(json.dumps({
            "type": "location_update",
            "lat": event["lat"],
            "lng": event["lng"],
            "speed": event.get("speed"),
            "heading": event.get("heading"),
            "timestamp": event.get("timestamp"),
            "trip_id": event["trip_id"],
        }))


class FleetTrackingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for fleet-wide tracking (all active trucks).
    Used by the operations dashboard.
    Group name: fleet_tracking_{tenant_id}
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.tenant_id = str(user.tenant_id) if user.tenant_id else "global"
        self.group_name = f"fleet_tracking_{self.tenant_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(json.dumps({
            "type": "connected",
            "message": "Connected to fleet tracking dashboard.",
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass  # Fleet tracking is read-only for dashboard users

    async def fleet_location_update(self, event):
        """Push fleet location update to dashboard."""
        await self.send(json.dumps(event))
