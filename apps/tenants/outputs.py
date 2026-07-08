"""
apps.tenants.outputs — Tenant GraphQL Output Types
"""
import strawberry
import strawberry_django
from strawberry import auto
from typing import Optional, List
from .models import Tenant, TenantTheme, TenantDomain, TenantMembership


@strawberry_django.type(TenantDomain)
class TenantDomainType:
    id: auto
    domain: auto
    is_primary: auto
    status: auto
    verified_at: auto
    ssl_provisioned: auto
    added_at: auto

    @strawberry_django.field
    def dns_txt_value(self) -> str:
        return self.get_dns_txt_value()


@strawberry_django.type(TenantTheme)
class TenantThemeType:
    id: auto
    primary_color: auto
    primary_color_dark: auto
    secondary_color: auto
    accent_color: auto
    background_color: auto
    background_dark: auto
    text_color: auto
    text_color_dark: auto
    font_family: auto
    font_family_url: auto
    heading_font_family: auto
    border_radius: auto
    button_border_radius: auto
    custom_css: auto
    default_dark_mode: auto
    allow_dark_mode_toggle: auto
    updated_at: auto


@strawberry_django.type(Tenant)
class TenantType:
    id: auto
    name: auto
    slug: auto
    email: auto
    phone: auto
    address: auto
    country: auto
    city: auto
    registration_number: auto
    plan: auto
    status: auto
    trial_ends_at: auto
    plan_expires_at: auto
    created_at: auto
    updated_at: auto

    @strawberry_django.field
    def logo_url(self) -> Optional[str]:
        return self.logo.url if self.logo else None

    @strawberry_django.field
    def favicon_url(self) -> Optional[str]:
        return self.favicon.url if self.favicon else None

    @strawberry_django.field
    def theme(self) -> Optional[TenantThemeType]:
        return getattr(self, "theme", None)

    @strawberry_django.field
    def domains(self) -> List[TenantDomainType]:
        return list(self.domains.all())

    @strawberry_django.field
    def subdomain_url(self) -> str:
        return self.subdomain_url

    @strawberry_django.field
    def user_count(self) -> int:
        return self.users.filter(is_active=True).count()




@strawberry.type
class DomainVerificationStatus:
    domain: str
    status: str
    message: str
    dns_txt_value: str


from apps.authentication.outputs import UserType

@strawberry_django.type(TenantMembership)
class TenantMembershipType:
    id: auto
    role: auto
    created_at: auto
    updated_at: auto

    @strawberry_django.field
    def tenant(self) -> TenantType:
        return self.tenant

    @strawberry_django.field
    def user(self) -> UserType:
        return self.user
