"""
chrono_state.signals — Auto-Audit Signal Handlers
===================================================
Connects Django post_save and post_delete signals to all ChronoModel
subclasses to automatically record every change to the AuditLog.
"""
import threading
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.utils import timezone

# Thread-local storage for request context (actor, IP, request_id)
_chrono_context = threading.local()


def set_chrono_context(actor=None, actor_ip=None, request_id=None, tenant_id=None):
    """Set the current request context for audit logging."""
    _chrono_context.actor = actor
    _chrono_context.actor_ip = actor_ip
    _chrono_context.request_id = request_id
    _chrono_context.tenant_id = tenant_id


def get_chrono_context():
    return {
        "actor": getattr(_chrono_context, "actor", None),
        "actor_ip": getattr(_chrono_context, "actor_ip", None),
        "request_id": getattr(_chrono_context, "request_id", None),
        "tenant_id": getattr(_chrono_context, "tenant_id", None),
    }


def _is_chrono_model(model_class) -> bool:
    """Check if a model is a ChronoModel subclass (not abstract)."""
    from chrono_state.mixins import ChronoModel
    return (
        issubclass(model_class, ChronoModel)
        and not model_class._meta.abstract
        and model_class.__name__ != "ChronoModel"
    )


def _is_excluded(model_class) -> bool:
    """Check if model is in the CHRONO_STATE.EXCLUDED_MODELS list."""
    chrono_config = getattr(settings, "CHRONO_STATE", {})
    excluded = chrono_config.get("EXCLUDED_MODELS", [])
    label = f"{model_class._meta.app_label}.{model_class.__name__}"
    return label in excluded


def _record_audit(instance, operation: str, diff: dict = None):
    """Create an AuditLog entry for the given instance and operation."""
    from chrono_state.models import AuditLog

    if not getattr(settings, "CHRONO_STATE", {}).get("ENABLED", True):
        return

    model_class = instance.__class__
    if not _is_chrono_model(model_class) or _is_excluded(model_class):
        return

    ctx = get_chrono_context()

    # Determine tenant_id: check instance attribute or context
    tenant_id = (
        ctx.get("tenant_id")
        or getattr(instance, "tenant_id", None)
        or (str(instance.tenant.id) if hasattr(instance, "tenant") and instance.tenant_id else None)
    )

    try:
        AuditLog.objects.create(
            content_type=ContentType.objects.get_for_model(model_class),
            object_id=str(instance.pk),
            object_repr=instance.get_object_repr() if hasattr(instance, "get_object_repr") else str(instance),
            tenant_id=tenant_id,
            operation=operation,
            state_snapshot=instance.to_audit_dict() if hasattr(instance, "to_audit_dict") else {},
            diff=diff or {},
            actor=ctx.get("actor"),
            actor_ip=ctx.get("actor_ip"),
            request_id=ctx.get("request_id"),
            timestamp=timezone.now(),
        )
    except Exception as e:
        # Never let audit logging crash the main request
        import logging
        logging.getLogger("chrono_state").error(f"Failed to record audit log: {e}")


# ─── Connect signals generically (post_init would be too early) ───────────────

def handle_post_save(sender, instance, created, **kwargs):
    operation = "CREATE" if created else "UPDATE"
    _record_audit(instance, operation)


def handle_post_delete(sender, instance, **kwargs):
    _record_audit(instance, "DELETE")


def connect_chrono_signals():
    """
    Called by ChronoStateConfig.ready() to connect signals
    to all registered ChronoModel subclasses.
    """
    from chrono_state.mixins import ChronoModel
    from django.apps import apps

    for model in apps.get_models():
        if _is_chrono_model(model) and not _is_excluded(model):
            post_save.connect(handle_post_save, sender=model, weak=False)
            post_delete.connect(handle_post_delete, sender=model, weak=False)


# Connect when signals module is imported (via apps.py ready())
connect_chrono_signals()
