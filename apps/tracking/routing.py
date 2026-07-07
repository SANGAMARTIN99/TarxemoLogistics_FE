"""apps.tracking.routing — WebSocket URL patterns"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/tracking/trip/(?P<trip_id>[^/]+)/$", consumers.TripTrackingConsumer.as_asgi()),
    re_path(r"ws/tracking/fleet/$", consumers.FleetTrackingConsumer.as_asgi()),
]
