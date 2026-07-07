"""
chrono_state.mixins — ChronoModel Abstract Base
=================================================
Inherit from ChronoModel to make any Django model time-travel aware.

Example:
    class Truck(ChronoModel):
        plate_number = models.CharField(max_length=20)

    # Time-travel query:
    Truck.objects.at("2025-06-01").filter(tenant=tenant)
"""
import json
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .manager import ChronoManager


class ChronoModel(models.Model):
    """
    Abstract base model that enables time-travel queries.
    All child models are automatically audited via signals.
    """

    # ─── Override default manager with ChronoManager ─────────────────────────
    objects = ChronoManager()

    # ─── Timestamps (all ChronoModels must track these) ──────────────────────
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def to_audit_dict(self) -> dict:
        """
        Serialize this model instance to a dictionary suitable for storage
        in the AuditLog.state_snapshot field.

        Override in subclasses to customize serialization.
        """
        data = {}
        for field in self._meta.get_fields():
            if hasattr(field, "attname"):
                value = getattr(self, field.attname, None)
                # Convert non-serializable types
                if hasattr(value, "isoformat"):
                    value = value.isoformat()
                elif hasattr(value, "hex"):  # UUID
                    value = str(value)
                data[field.attname] = value
        return data

    @classmethod
    def get_content_type(cls):
        return ContentType.objects.get_for_model(cls)

    def get_object_repr(self) -> str:
        """Human-readable representation for audit logs."""
        return str(self)


class TenantScopedChronoModel(ChronoModel):
    """
    ChronoModel variant that also carries a tenant foreign key.
    Use this for all models that belong to a specific tenant.
    """
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_set",
        db_index=True,
    )

    class Meta:
        abstract = True

    def to_audit_dict(self) -> dict:
        data = super().to_audit_dict()
        return data
