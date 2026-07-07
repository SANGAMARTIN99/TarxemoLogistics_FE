"""
apps.tenants.inputs — Tenant GraphQL Inputs
"""
import strawberry
from typing import Optional


@strawberry.input
class CreateTenantInput:
    name: str
    slug: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = "Tanzania"
    city: Optional[str] = None
    registration_number: Optional[str] = None
    plan: Optional[str] = "TRIAL"


@strawberry.input
class UpdateTenantInput:
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    registration_number: Optional[str] = None


@strawberry.input
class UpdateTenantThemeInput:
    primary_color: Optional[str] = None
    primary_color_dark: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    background_dark: Optional[str] = None
    text_color: Optional[str] = None
    text_color_dark: Optional[str] = None
    font_family: Optional[str] = None
    font_family_url: Optional[str] = None
    heading_font_family: Optional[str] = None
    border_radius: Optional[str] = None
    button_border_radius: Optional[str] = None
    custom_css: Optional[str] = None
    default_dark_mode: Optional[bool] = None
    allow_dark_mode_toggle: Optional[bool] = None


@strawberry.input
class AddCustomDomainInput:
    tenant_id: str
    domain: str
    is_primary: Optional[bool] = False
