import uuid
from django.db import models
from django.conf import settings

class DriverStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"

class DriverProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="driver_profile")
    license_number = models.CharField(max_length=50, unique=True)
    license_class = models.CharField(max_length=30)
    experience_years = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=DriverStatus.choices, default=DriverStatus.ACTIVE)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "drivers_driver_profile"

    def __str__(self):
        return f"{self.user.email} ({self.license_class})"
