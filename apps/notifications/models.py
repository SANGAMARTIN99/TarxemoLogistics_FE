import uuid
from django.db import models
from django.conf import settings
from apps.tenants.models import Tenant

class NotificationCategory(models.TextChoices):
    INFO = "INFO", "Information"
    TRIP_UPDATE = "TRIP_UPDATE", "Trip Update"
    ALERT = "ALERT", "Alert"
    SYSTEM = "SYSTEM", "System"

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    title = models.CharField(max_length=150)
    body = models.TextField()
    category = models.CharField(max_length=20, choices=NotificationCategory.choices, default=NotificationCategory.INFO)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} for {self.recipient.email}"
