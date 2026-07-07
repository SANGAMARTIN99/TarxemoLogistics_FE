"""
chrono_state.manager — ChronoManager
=====================================
Custom Django manager that adds .at(timestamp) to any ChronoModel queryset.

Usage:
    Truck.objects.at("2025-06-01 12:00:00").filter(status="active")
    Truck.objects.at(datetime(2025, 6, 1, 12, 0)).all()
"""
from datetime import datetime
from typing import Optional, Union
from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType


class ChronoQuerySet(models.QuerySet):
    """
    QuerySet with time-travel capability.
    When .at(timestamp) is called, subsequent queries reconstruct
    past state from the audit log.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._as_of: Optional[datetime] = None
        self._tenant_id: Optional[str] = None

    def at(self, timestamp: Union[str, datetime]) -> "ChronoQuerySet":
        """
        Set the time-travel target timestamp.

        Args:
            timestamp: ISO string or datetime object for the target time.

        Returns:
            A cloned queryset that will serve past state.
        """
        clone = self._clone()
        if isinstance(timestamp, str):
            from dateutil.parser import parse as parse_date
            ts = parse_date(timestamp)
            if timezone.is_naive(ts):
                ts = timezone.make_aware(ts)
        elif isinstance(timestamp, datetime):
            ts = timestamp
            if timezone.is_naive(ts):
                ts = timezone.make_aware(ts)
        else:
            raise ValueError(f"Invalid timestamp type: {type(timestamp)}")
        clone._as_of = ts
        return clone

    def for_tenant(self, tenant_id: str) -> "ChronoQuerySet":
        clone = self._clone()
        clone._tenant_id = str(tenant_id)
        return clone

    def _clone(self):
        clone = super()._clone()
        clone._as_of = self._as_of
        clone._tenant_id = self._tenant_id
        return clone

    def _fetch_all(self):
        """
        Override _fetch_all to inject time-travel reconstruction
        when _as_of is set.
        """
        if self._as_of is None:
            # Normal queryset — no time travel
            super()._fetch_all()
            return

        # Time-travel mode: reconstruct objects from audit log
        self._result_cache = list(self._reconstruct_at(self._as_of))

    def _reconstruct_at(self, as_of: datetime):
        """
        Reconstruct a list of model instances as they existed at `as_of`.

        Strategy:
        1. Find all object IDs that had at least one audit entry ≤ as_of
        2. For each, get the latest audit entry ≤ as_of
        3. If that entry's operation is not DELETE, reconstruct the object
        """
        from .models import AuditLog

        model = self.model
        ct = ContentType.objects.get_for_model(model)

        # Apply any existing queryset filters to get candidate IDs
        # We start from current queryset IDs unless we have none
        candidate_qs = AuditLog.objects.filter(
            content_type=ct,
            timestamp__lte=as_of,
        )

        if self._tenant_id:
            candidate_qs = candidate_qs.filter(tenant_id=self._tenant_id)

        # Get distinct object IDs that existed at or before as_of
        object_ids = candidate_qs.values_list("object_id", flat=True).distinct()

        results = []
        for object_id in object_ids:
            state = AuditLog.get_state_at(
                content_type=ct,
                object_id=object_id,
                timestamp=as_of,
                tenant_id=self._tenant_id,
            )
            if state is not None:
                # Reconstruct model instance from state dict
                try:
                    instance = self._dict_to_instance(state)
                    if instance is not None:
                        # Mark instance as time-travel reconstructed (read-only)
                        instance._chrono_as_of = as_of
                        instance._chrono_reconstructed = True
                        results.append(instance)
                except Exception:
                    pass  # Skip corrupt entries

        return results

    def _dict_to_instance(self, state: dict):
        """Convert a state dict back to a model instance (not saved)."""
        model = self.model
        instance = model.__new__(model)
        models.Model.__init__(instance)

        for field in model._meta.get_fields():
            if hasattr(field, "attname") and field.attname in state:
                value = state[field.attname]
                # Re-hydrate datetime fields
                if value is not None and hasattr(field, "get_internal_type"):
                    if field.get_internal_type() in ("DateTimeField", "DateField"):
                        if isinstance(value, str):
                            from dateutil.parser import parse as parse_date
                            value = parse_date(value)
                setattr(instance, field.attname, value)

        return instance


class ChronoManager(models.Manager):
    """Custom manager that provides .at() time-travel on ChronoModel subclasses."""

    def get_queryset(self) -> ChronoQuerySet:
        return ChronoQuerySet(self.model, using=self._db)

    def at(self, timestamp: Union[str, datetime]) -> ChronoQuerySet:
        """Shortcut: ChronoModel.objects.at('2025-06-01')"""
        return self.get_queryset().at(timestamp)

    def for_tenant(self, tenant_id: str) -> ChronoQuerySet:
        return self.get_queryset().for_tenant(tenant_id)
