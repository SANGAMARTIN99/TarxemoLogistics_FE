"""
chrono_state.schema — GraphQL Schema for Time-Travel API
=========================================================
Exposes:
  - Query: auditLogs, chronoSnapshots, chronoSessions
  - Mutation: startChronoSession, endChronoSession, createSnapshot
  - Mixin: ChronoGraphQLMixin (inject asOf arg into any resolver)
"""
import strawberry
from strawberry import auto
from typing import Optional, List
from datetime import datetime
import strawberry_django
from django.utils import timezone

from .models import AuditLog, ChronoSnapshot, ChronoSession


# ─── Types ────────────────────────────────────────────────────────────────────

@strawberry_django.type(AuditLog)
class AuditLogType:
    id: auto
    object_repr: auto
    tenant_id: auto
    operation: auto
    diff: strawberry.scalars.JSON
    state_snapshot: strawberry.scalars.JSON
    timestamp: auto
    actor_ip: auto

    @strawberry_django.field
    def actor_email(self) -> Optional[str]:
        return self.actor.email if self.actor else None


@strawberry_django.type(ChronoSnapshot)
class ChronoSnapshotType:
    id: auto
    label: auto
    description: auto
    snapshot_at: auto
    tenant_id: auto
    is_system: auto
    created_at: auto
    metadata: strawberry.scalars.JSON

    @strawberry_django.field
    def created_by_email(self) -> Optional[str]:
        return self.created_by.email if self.created_by else None


@strawberry_django.type(ChronoSession)
class ChronoSessionType:
    id: auto
    as_of: auto
    label: auto
    started_at: auto
    ended_at: auto
    is_active: auto
    tenant_id: auto


# ─── Inputs ───────────────────────────────────────────────────────────────────

@strawberry.input
class StartChronoSessionInput:
    as_of: datetime
    label: Optional[str] = ""
    tenant_id: Optional[str] = None


@strawberry.input
class CreateSnapshotInput:
    label: str
    description: Optional[str] = ""
    snapshot_at: Optional[datetime] = None  # Defaults to now
    tenant_id: Optional[str] = None


# ─── Queries ──────────────────────────────────────────────────────────────────

@strawberry.type
class ChronoQuery:

    @strawberry.field
    def audit_logs(
        self,
        info,
        model_name: Optional[str] = None,
        object_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        limit: int = 50,
    ) -> List[AuditLogType]:
        """Retrieve audit log entries with optional filters."""
        from django.contrib.contenttypes.models import ContentType
        qs = AuditLog.objects.all()

        if model_name:
            app_label, model = model_name.lower().split(".") if "." in model_name else (None, model_name.lower())
            try:
                ct = ContentType.objects.get(model=model, **({"app_label": app_label} if app_label else {}))
                qs = qs.filter(content_type=ct)
            except ContentType.DoesNotExist:
                return []

        if object_id:
            qs = qs.filter(object_id=object_id)
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        if from_date:
            qs = qs.filter(timestamp__gte=from_date)
        if to_date:
            qs = qs.filter(timestamp__lte=to_date)

        return list(qs[:limit])

    @strawberry.field
    def chrono_snapshots(
        self,
        info,
        tenant_id: Optional[str] = None,
    ) -> List[ChronoSnapshotType]:
        qs = ChronoSnapshot.objects.all()
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        return list(qs)

    @strawberry.field
    def active_chrono_session(self, info) -> Optional[ChronoSessionType]:
        """Returns the caller's current active time-travel session, if any."""
        user = info.context.request.user
        if not user.is_authenticated:
            return None
        return ChronoSession.objects.filter(user=user, is_active=True).first()


# ─── Mutations ────────────────────────────────────────────────────────────────

@strawberry.type
class ChronoMutation:

    @strawberry.mutation
    def start_chrono_session(self, info, input: StartChronoSessionInput) -> ChronoSessionType:
        """Start a time-travel session for the authenticated user."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required to start a time-travel session.")

        # End any existing active sessions
        ChronoSession.objects.filter(user=user, is_active=True).update(
            is_active=False, ended_at=timezone.now()
        )

        session = ChronoSession.objects.create(
            user=user,
            as_of=input.as_of,
            label=input.label or f"Session @ {input.as_of.isoformat()}",
            tenant_id=input.tenant_id,
        )
        return session

    @strawberry.mutation
    def end_chrono_session(self, info) -> bool:
        """End the caller's active time-travel session."""
        user = info.context.request.user
        if not user.is_authenticated:
            return False
        sessions = ChronoSession.objects.filter(user=user, is_active=True)
        for s in sessions:
            s.end_session()
        return True

    @strawberry.mutation
    def create_snapshot(self, info, input: CreateSnapshotInput) -> ChronoSnapshotType:
        """Create a named snapshot for a tenant at a specific time."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        snapshot = ChronoSnapshot.objects.create(
            label=input.label,
            description=input.description or "",
            snapshot_at=input.snapshot_at or timezone.now(),
            tenant_id=input.tenant_id,
            created_by=user,
        )
        return snapshot


# ─── Schema ───────────────────────────────────────────────────────────────────

chrono_schema = strawberry.Schema(query=ChronoQuery, mutation=ChronoMutation)
