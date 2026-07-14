from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmailVerificationToken, PasswordResetToken

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name", "role", "tenant", "is_active", "is_verified")
    search_fields = ("email", "first_name", "last_name")
    list_filter = ("role", "is_active", "is_verified", "tenant")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone_number", "profile_photo")}),
        ("Role & Tenant", {"fields": ("role", "tenant")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "is_verified")}),
        ("Security & Preferences", {"fields": ("preferred_language", "timezone", "is_2fa_enabled")}),
    )

@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "created_at", "expires_at", "is_used")
    search_fields = ("user__email",)
    list_filter = ("is_used",)

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "created_at", "expires_at", "is_used")
    search_fields = ("user__email", "token")
    list_filter = ("is_used",)
