import uuid
from django.db import models
from apps.logistics.models import Job

class LocationLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="location_logs")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    speed_kph = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    heading = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tracking_location_log"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Trip {self.trip_id} at {self.timestamp}"
