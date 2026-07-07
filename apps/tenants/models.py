"""
apps.tenants.models — Multi-Tenancy Models
==========================================
Tenant: represents one logistics company on the platform.
TenantTheme: per-tenant white-label configuration.
TenantDomain: custom domain mapping.
"""
import uuid
from django.db import models
from django.utils import timezone


class TenantPlan(models.TextChoices):
    TRIAL = "TRIAL", "Trial"
    STARTER = "STARTER", "Starter"
    GROWTH = "GROWTH", "Growth"
    ENTERPRISE = "ENTERPRISE", "Enterprise"


class TenantStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    TRIAL = "TRIAL", "Trial"
    EXPIRED = "EXPIRED", "Expired"
    PENDING = "PENDING", "Pending Setup"


class Tenant(models.Model):
    """
    Represents one logistics company (tenant) on the Tarxemo platform.
    Each tenant gets their own subdomain, data isolation, and theme.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ─── Identity ─────────────────────────────────────────────────────────────
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(
        max_length=80,
        unique=True,
        help_text="Used as subdomain: {slug}.tarxemo.com",
    )
    email = models.EmailField(help_text="Primary contact email")
    phone = models.CharField(max_length=25, blank=True)
    address = models.TextField(blank=True)
    country = models.CharField(max_length=100, default="Tanzania")
    city = models.CharField(max_length=100, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    logo = models.ImageField(upload_to="tenants/logos/", null=True, blank=True)
    favicon = models.ImageField(upload_to="tenants/favicons/", null=True, blank=True)

    # ─── Plan & Status ────────────────────────────────────────────────────────
    plan = models.CharField(max_length=20, choices=TenantPlan.choices, default=TenantPlan.TRIAL)
    status = models.CharField(max_length=20, choices=TenantStatus.choices, default=TenantStatus.PENDING)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    plan_expires_at = models.DateTimeField(null=True, blank=True)

    # ─── Timestamps ───────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenants_tenant"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.slug})"

    @property
    def subdomain_url(self) -> str:
        from django.conf import settings
        base = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        # In production: https://{slug}.tarxemo.com
        return f"{base}?tenant={self.slug}"

    @property
    def is_active(self) -> bool:
        return self.status == TenantStatus.ACTIVE

    @property
    def primary_domain(self) -> "TenantDomain | None":
        return self.domains.filter(is_primary=True, is_verified=True).first()


class TenantTheme(models.Model):
    """
    Per-tenant white-label theme configuration.
    These values are served to the frontend and injected as CSS variables.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name="theme")

    # ─── Colors ───────────────────────────────────────────────────────────────
    primary_color = models.CharField(max_length=20, default="#E8580A")
    primary_color_dark = models.CharField(max_length=20, default="#FF7A2F")
    secondary_color = models.CharField(max_length=20, default="#FFFFFF")
    accent_color = models.CharField(max_length=20, default="#1A1A2E")
    background_color = models.CharField(max_length=20, default="#F8F9FA")
    background_dark = models.CharField(max_length=20, default="#0D0D1A")
    text_color = models.CharField(max_length=20, default="#1A1A2E")
    text_color_dark = models.CharField(max_length=20, default="#E2E8F0")

    # ─── Typography ───────────────────────────────────────────────────────────
    font_family = models.CharField(max_length=100, default="Inter")
    font_family_url = models.CharField(
        max_length=300,
        default="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
    )
    heading_font_family = models.CharField(max_length=100, default="Inter")

    # ─── Layout ───────────────────────────────────────────────────────────────
    border_radius = models.CharField(max_length=20, default="12px")
    button_border_radius = models.CharField(max_length=20, default="8px")

    # ─── Custom CSS (advanced users) ─────────────────────────────────────────
    custom_css = models.TextField(
        blank=True,
        help_text="Raw CSS injected into the tenant's frontend (advanced)",
    )

    # ─── Dark mode toggle ─────────────────────────────────────────────────────
    default_dark_mode = models.BooleanField(default=False)
    allow_dark_mode_toggle = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenants_theme"

    def __str__(self):
        return f"Theme for {self.tenant.name}"

    def as_css_variables(self) -> str:
        """Generate a CSS :root block for injection into the frontend."""
        return f"""
:root {{
  --color-primary: {self.primary_color};
  --color-primary-dark: {self.primary_color_dark};
  --color-secondary: {self.secondary_color};
  --color-accent: {self.accent_color};
  --color-background: {self.background_color};
  --color-background-dark: {self.background_dark};
  --color-text: {self.text_color};
  --color-text-dark: {self.text_color_dark};
  --font-family: '{self.font_family}', sans-serif;
  --font-family-heading: '{self.heading_font_family}', sans-serif;
  --border-radius: {self.border_radius};
  --button-border-radius: {self.button_border_radius};
}}
{self.custom_css}
"""

    def as_dict(self) -> dict:
        """Serialized for GraphQL / frontend consumption."""
        return {
            "primaryColor": self.primary_color,
            "primaryColorDark": self.primary_color_dark,
            "secondaryColor": self.secondary_color,
            "accentColor": self.accent_color,
            "backgroundColor": self.background_color,
            "backgroundDark": self.background_dark,
            "textColor": self.text_color,
            "textColorDark": self.text_color_dark,
            "fontFamily": self.font_family,
            "fontFamilyUrl": self.font_family_url,
            "headingFontFamily": self.heading_font_family,
            "borderRadius": self.border_radius,
            "buttonBorderRadius": self.button_border_radius,
            "defaultDarkMode": self.default_dark_mode,
            "allowDarkModeToggle": self.allow_dark_mode_toggle,
            "customCss": self.custom_css,
        }


class TenantDomain(models.Model):
    """
    Custom domain mapping for a tenant.
    Allows a tenant to serve their portal on their own domain.

    Verification flow:
    1. Tenant adds domain (status → PENDING)
    2. System generates a TXT record value
    3. Tenant adds TXT record to their DNS
    4. Background job verifies TXT record (status → VERIFIED)
    5. Reverse proxy routes the domain to this tenant
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="domains")
    domain = models.CharField(max_length=255, unique=True, db_index=True)
    is_primary = models.BooleanField(default=False)

    class DomainStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Verification"
        VERIFIED = "VERIFIED", "Verified"
        FAILED = "FAILED", "Verification Failed"
        ACTIVE = "ACTIVE", "Active"

    status = models.CharField(
        max_length=20,
        choices=DomainStatus.choices,
        default=DomainStatus.PENDING,
    )
    verification_token = models.CharField(max_length=100, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    ssl_provisioned = models.BooleanField(default=False)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tenants_domain"

    def __str__(self):
        return f"{self.domain} → {self.tenant.name} [{self.status}]"

    def get_dns_txt_value(self) -> str:
        return f"tarxemo-verification={self.verification_token}"
