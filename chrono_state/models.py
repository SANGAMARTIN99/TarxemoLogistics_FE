"""
chrono_state.models — Audit Log & Snapshot Models
===================================================
The AuditLog table stores every change to every ChronoModel as a diff.
The Snapshot table stores periodic named snapshots for fast time-travel.
"""
import json
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class AuditLog(models.Model):
    """
    Immutable record of every state change to a ChronoModel instance.
    Each row represents one atomic change event (CREATE / UPDATE / DELETE).
    """

    class Operation(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        RESTORE = "RESTORE", "Restore"

    # ─── Identity ────────────────────────────────────────────────────────────
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ─── What changed ────────────────────────────────────────────────────────
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="chrono_audit_logs",
        db_index=True,
    )
    object_id = models.CharField(max_length=255, db_index=True)
    object_repr = models.CharField(max_length=500, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    # ─── Tenant scoping ───────────────────────────────────────────────────────
    tenant_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    # ─── Operation details ────────────────────────────────────────────────────
    operation = models.CharField(max_length=10, choices=Operation.choices, db_index=True)

    # Full state snapshot at time of change (for fast reconstruction)
    state_snapshot = models.JSONField(default=dict)

    # What specifically changed (field → [old_value, new_value])
    diff = models.JSONField(default=dict)

    # ─── Who & when ──────────────────────────────────────────────────────────
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="chrono_audit_logs",
    )
    actor_ip = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    # ─── Context ─────────────────────────────────────────────────────────────
    request_id = models.UUIDField(null=True, blank=True)  # Correlate with HTTP request
    session_key = models.CharField(max_length=100, blank=True)
    extra_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "chrono_audit_log"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["content_type", "object_id", "timestamp"]),
            models.Index(fields=["tenant_id", "timestamp"]),
            models.Index(fields=["actor", "timestamp"]),
        ]
        # Audit logs are NEVER modified after creation
        default_permissions = ("add", "view")

    def __str__(self):
        return f"[{self.operation}] {self.object_repr} @ {self.timestamp.isoformat()}"

    @classmethod
    def get_state_at(cls, content_type, object_id, timestamp, tenant_id=None):
        """
        Reconstruct the state of an object at a given timestamp.
        Returns the state_snapshot from the most recent audit log entry
        at or before the given timestamp.
        """
        qs = cls.objects.filter(
            content_type=content_type,
            object_id=str(object_id),
            timestamp__lte=timestamp,
        )
        if tenant_id:
            qs = qs.filter(tenant_id=str(tenant_id))

        entry = qs.order_by("-timestamp").first()
        if entry is None:
            return None

        # Object was deleted — return None
        if entry.operation == cls.Operation.DELETE:
            return None

        return entry.state_snapshot


class ChronoSnapshot(models.Model):
    """
    Named point-in-time snapshot of the entire system (or a tenant subsystem).
    Used for fast navigation to commonly referenced time points.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    snapshot_at = models.DateTimeField(db_index=True)
    tenant_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_system = models.BooleanField(
        default=False,
        help_text="True for auto-generated daily snapshots",
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "chrono_snapshot"
        ordering = ["-snapshot_at"]

    def __str__(self):
        return f"Snapshot: {self.label} @ {self.snapshot_at.isoformat()}"


class ChronoSession(models.Model):
    """
    Tracks active time-travel sessions for users.
    When a user is in a time-travel session, all their reads are served
    from the past state while writes are blocked.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chrono_sessions",
    )
    tenant_id = models.CharField(max_length=255, null=True, blank=True)
    as_of = models.DateTimeField(help_text="The point in time being viewed")
    label = models.CharField(max_length=255, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "chrono_session"
        ordering = ["-started_at"]

    def __str__(self):
        status = "ACTIVE" if self.is_active else "ENDED"
        return f"[{status}] {self.user} traveling to {self.as_of.isoformat()}"

    def end_session(self):
        self.is_active = False
        self.ended_at = timezone.now()
        self.save(update_fields=["is_active", "ended_at"])
