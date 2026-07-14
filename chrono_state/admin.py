from django.contrib import admin
from .models import AuditLog, ChronoSnapshot, ChronoSession

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("object_repr", "operation", "actor", "timestamp", "tenant_id")
    search_fields = ("object_repr", "object_id", "actor__email", "tenant_id")
    list_filter = ("operation", "timestamp")

@admin.register(ChronoSnapshot)
class ChronoSnapshotAdmin(admin.ModelAdmin):
    list_display = ("label", "snapshot_at", "tenant_id", "created_by", "created_at", "is_system")
    search_fields = ("label", "tenant_id")
    list_filter = ("is_system", "snapshot_at")

@admin.register(ChronoSession)
class ChronoSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "tenant_id", "as_of", "started_at", "ended_at", "is_active")
    search_fields = ("user__email", "tenant_id")
    list_filter = ("is_active",)
