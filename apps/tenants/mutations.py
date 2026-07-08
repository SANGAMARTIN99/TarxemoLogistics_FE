"""
apps.tenants.mutations — Tenant GraphQL Mutations
=================================================
Handles tenant CRUD, theme configuration, and custom domain management.
"""
import re
import secrets
import strawberry
from typing import Optional
from strawberry.types import Info
from django.utils import timezone
from django.utils.text import slugify

from .models import Tenant, TenantTheme, TenantDomain, TenantStatus
from .inputs import (
    CreateTenantInput,
    UpdateTenantInput,
    UpdateTenantThemeInput,
    AddCustomDomainInput,
)
from .outputs import TenantType, TenantThemeType, TenantDomainType, DomainVerificationStatus


def _require_super_admin(info: Info):
    user = info.context.request.user
    if not user.is_authenticated or user.role != "SUPER_ADMIN":
        raise Exception("Permission denied. Super Admin access required.")
    return user


def _require_tenant_admin(info: Info):
    user = info.context.request.user
    if not user.is_authenticated or user.role not in ("SUPER_ADMIN", "TENANT_ADMIN"):
        raise Exception("Permission denied. Tenant Admin access required.")
    return user


def _validate_hex_color(color: str) -> bool:
    return bool(re.match(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", color))


@strawberry.type
class TenantMutation:

    @strawberry.mutation
    def create_tenant(self, info: Info, input: CreateTenantInput) -> TenantType:
        """SUPER_ADMIN only: create a new tenant on the platform."""
        _require_super_admin(info)

        slug = slugify(input.slug or input.name)
        if Tenant.objects.filter(slug=slug).exists():
            raise Exception(f"A tenant with slug '{slug}' already exists.")
        if Tenant.objects.filter(name=input.name).exists():
            raise Exception("A tenant with this name already exists.")

        from datetime import timedelta
        tenant = Tenant.objects.create(
            name=input.name.strip(),
            slug=slug,
            email=input.email.strip().lower(),
            phone=input.phone or "",
            address=input.address or "",
            country=input.country or "Tanzania",
            city=input.city or "",
            registration_number=input.registration_number or "",
            plan=input.plan or "TRIAL",
            status=TenantStatus.TRIAL,
            trial_ends_at=timezone.now() + timedelta(days=30),
        )

        # Auto-create default theme
        TenantTheme.objects.create(tenant=tenant)

        return tenant

    @strawberry.mutation
    def update_tenant(
        self, info: Info, tenant_id: str, input: UpdateTenantInput
    ) -> TenantType:
        """Update tenant details. SUPER_ADMIN can update any; TENANT_ADMIN only their own."""
        user = _require_tenant_admin(info)

        try:
            if user.role == "SUPER_ADMIN":
                tenant = Tenant.objects.get(id=tenant_id)
            else:
                if str(tenant_id) != str(user.tenant_id):
                    raise Exception("Permission denied.")
                tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            raise Exception("Tenant not found.")

        if input.name is not None:
            tenant.name = input.name.strip()
        if input.email is not None:
            tenant.email = input.email.strip().lower()
        if input.phone is not None:
            tenant.phone = input.phone.strip()
        if input.address is not None:
            tenant.address = input.address.strip()
        if input.city is not None:
            tenant.city = input.city.strip()
        if input.registration_number is not None:
            tenant.registration_number = input.registration_number.strip()
        if input.logo is not None:
            tenant.logo = input.logo

        tenant.save()
        return tenant

    @strawberry.mutation
    def set_tenant_status(
        self, info: Info, tenant_id: str, status: str
    ) -> TenantType:
        """SUPER_ADMIN only: activate, suspend, or expire a tenant."""
        _require_super_admin(info)

        valid_statuses = [s.value for s in TenantStatus]
        if status not in valid_statuses:
            raise Exception(f"Invalid status. Choose from: {', '.join(valid_statuses)}")

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            raise Exception("Tenant not found.")

        tenant.status = status
        tenant.save(update_fields=["status", "updated_at"])
        return tenant

    @strawberry.mutation
    def update_tenant_theme(
        self, info: Info, input: UpdateTenantThemeInput
    ) -> TenantThemeType:
        """
        TENANT_ADMIN or SUPER_ADMIN: update the white-label theme for the current tenant.
        """
        user = _require_tenant_admin(info)
        tenant = user.tenant if user.role != "SUPER_ADMIN" else getattr(info.context.request, "tenant", None)

        if not tenant:
            raise Exception("No tenant context found.")

        theme, _ = TenantTheme.objects.get_or_create(tenant=tenant)

        # Validate and apply color fields
        color_fields = [
            "primary_color", "primary_color_dark", "secondary_color",
            "accent_color", "background_color", "background_dark",
            "text_color", "text_color_dark",
        ]
        for field in color_fields:
            value = getattr(input, field, None)
            if value is not None:
                if not _validate_hex_color(value):
                    raise Exception(f"Invalid hex color for {field}: {value}")
                setattr(theme, field, value)

        # Apply non-color fields
        string_fields = [
            "font_family", "font_family_url", "heading_font_family",
            "border_radius", "button_border_radius", "custom_css",
        ]
        for field in string_fields:
            value = getattr(input, field, None)
            if value is not None:
                setattr(theme, field, value)

        if input.default_dark_mode is not None:
            theme.default_dark_mode = input.default_dark_mode
        if input.allow_dark_mode_toggle is not None:
            theme.allow_dark_mode_toggle = input.allow_dark_mode_toggle

        theme.save()
        return theme

    @strawberry.mutation
    def add_custom_domain(self, info: Info, input: AddCustomDomainInput) -> TenantDomainType:
        """
        TENANT_ADMIN: register a custom domain for their tenant.
        Returns the domain record with DNS TXT verification instructions.
        """
        user = _require_tenant_admin(info)

        try:
            if user.role == "SUPER_ADMIN":
                tenant = Tenant.objects.get(id=input.tenant_id)
            else:
                tenant = user.tenant
                if str(tenant.id) != input.tenant_id:
                    raise Exception("Permission denied.")
        except Tenant.DoesNotExist:
            raise Exception("Tenant not found.")

        domain = input.domain.strip().lower()

        # Basic domain format validation
        if not re.match(r"^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$", domain):
            raise Exception("Invalid domain format.")

        if TenantDomain.objects.filter(domain=domain).exists():
            raise Exception("This domain is already registered.")

        # If set as primary, demote existing primary
        if input.is_primary:
            TenantDomain.objects.filter(tenant=tenant, is_primary=True).update(is_primary=False)

        domain_obj = TenantDomain.objects.create(
            tenant=tenant,
            domain=domain,
            is_primary=input.is_primary or False,
            verification_token=secrets.token_urlsafe(32),
            status=TenantDomain.DomainStatus.PENDING,
        )
        return domain_obj

    @strawberry.mutation
    def verify_custom_domain(self, info: Info, domain_id: str) -> DomainVerificationStatus:
        """
        Trigger DNS TXT verification for a custom domain.
        A background Celery task will do the actual DNS lookup.
        """
        user = _require_tenant_admin(info)

        try:
            domain_obj = TenantDomain.objects.get(id=domain_id)
        except TenantDomain.DoesNotExist:
            raise Exception("Domain not found.")

        if user.role != "SUPER_ADMIN" and domain_obj.tenant != user.tenant:
            raise Exception("Permission denied.")

        # Dispatch Celery task for async DNS verification
        from apps.tenants.tasks import verify_domain_dns
        verify_domain_dns.delay(str(domain_obj.id))

        return DomainVerificationStatus(
            domain=domain_obj.domain,
            status="VERIFICATION_QUEUED",
            message=f"DNS verification started. Add this TXT record to your DNS: {domain_obj.get_dns_txt_value()}",
            dns_txt_value=domain_obj.get_dns_txt_value(),
        )

    @strawberry.mutation
    def remove_custom_domain(self, info: Info, domain_id: str) -> bool:
        user = _require_tenant_admin(info)
        try:
            domain_obj = TenantDomain.objects.get(id=domain_id)
        except TenantDomain.DoesNotExist:
            raise Exception("Domain not found.")
        if user.role != "SUPER_ADMIN" and domain_obj.tenant != user.tenant:
            raise Exception("Permission denied.")
        domain_obj.delete()
        return True
