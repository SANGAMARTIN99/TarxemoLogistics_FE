"""
apps.tracking.views — GPS Ping REST Endpoint
============================================
High-frequency GPS updates from driver devices use a REST endpoint (not GraphQL)
for performance. Each ping is stored and also broadcast via WebSocket.
"""
import json
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class GPSPingView(APIView):
    """
    POST /api/tracking/ping/
    Body: { "trip_id": "uuid", "lat": float, "lng": float, "speed": float, "heading": float }

    Receives GPS ping from driver mobile app, broadcasts to WebSocket group.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != "DRIVER":
            return Response({"error": "Only drivers can send GPS pings."}, status=403)

        data = request.data
        trip_id = data.get("trip_id")
        lat = data.get("lat")
        lng = data.get("lng")

        if not all([trip_id, lat, lng]):
            return Response({"error": "trip_id, lat, and lng are required."}, status=400)

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            return Response({"error": "lat and lng must be valid numbers."}, status=400)

        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            return Response({"error": "Invalid GPS coordinates."}, status=400)

        # Broadcast location to WebSocket subscribers
        channel_layer = get_channel_layer()
        timestamp = timezone.now().isoformat()

        try:
            async_to_sync(channel_layer.group_send)(
                f"trip_tracking_{trip_id}",
                {
                    "type": "location_update",
                    "lat": lat,
                    "lng": lng,
                    "speed": data.get("speed"),
                    "heading": data.get("heading"),
                    "timestamp": timestamp,
                    "trip_id": trip_id,
                },
            )
            # Also broadcast to fleet dashboard
            if user.tenant_id:
                async_to_sync(channel_layer.group_send)(
                    f"fleet_tracking_{user.tenant_id}",
                    {
                        "type": "fleet_location_update",
                        "trip_id": trip_id,
                        "driver_id": str(user.id),
                        "driver_name": user.get_full_name(),
                        "lat": lat,
                        "lng": lng,
                        "speed": data.get("speed"),
                        "heading": data.get("heading"),
                        "timestamp": timestamp,
                    },
                )
        except Exception as e:
            # Don't fail the response if broadcast fails — just log it
            import logging
            logging.getLogger("tracking").error(f"WebSocket broadcast error: {e}")

        return Response({"status": "ok", "timestamp": timestamp})
