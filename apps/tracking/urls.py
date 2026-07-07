"""apps.tracking — REST URL patterns (GPS ping endpoint)"""
from django.urls import path
from . import views

urlpatterns = [
    path("ping/", views.GPSPingView.as_view(), name="gps-ping"),
]
