import uuid
from django.db import models
from django.conf import settings
from apps.tenants.models import Tenant

class QuoteStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"

class PricingMatrix(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="pricing_matrices")
    source_location = models.CharField(max_length=150)
    destination_location = models.CharField(max_length=150)
    container_type = models.CharField(max_length=50) # e.g. 20FT, 40FT
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    per_km_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    per_ton_rate = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pricing_matrix"
        unique_together = ("tenant", "source_location", "destination_location", "container_type")

    def __str__(self):
        return f"{self.source_location} -> {self.destination_location} ({self.container_type})"

class Quote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="quotes")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quotes")
    pickup_location = models.CharField(max_length=255)
    delivery_location = models.CharField(max_length=255)
    weight_tons = models.DecimalField(max_digits=5, decimal_places=2)
    container_type = models.CharField(max_length=50)
    cargo_details = models.TextField(null=True, blank=True)
    estimated_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=QuoteStatus.choices, default=QuoteStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pricing_quote"

    def __str__(self):
        return f"Quote {self.id} for {self.customer.email}"
