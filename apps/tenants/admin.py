from django.contrib import admin
from .models import Tenant, TenantTheme, TenantDomain, TenantMembership

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "email", "plan", "status", "created_at")
    search_fields = ("name", "slug", "email")
    list_filter = ("plan", "status")

@admin.register(TenantTheme)
class TenantThemeAdmin(admin.ModelAdmin):
    list_display = ("tenant", "primary_color", "secondary_color", "default_dark_mode")
    search_fields = ("tenant__name",)

@admin.register(TenantDomain)
class TenantDomainAdmin(admin.ModelAdmin):
    list_display = ("domain", "tenant", "is_primary", "status")
    search_fields = ("domain", "tenant__name")
    list_filter = ("status", "is_primary")

@admin.register(TenantMembership)
class TenantMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "tenant", "role", "created_at")
    search_fields = ("user__email", "tenant__name")
    list_filter = ("role",)
