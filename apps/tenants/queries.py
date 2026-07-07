"""
apps.tenants.queries — Tenant GraphQL Queries
"""
import strawberry
from typing import Optional, List
from strawberry.types import Info
from .models import Tenant, TenantTheme, TenantDomain
from .outputs import TenantType, TenantThemeType, TenantDomainType


@strawberry.type
class TenantQuery:

    @strawberry.field
    def tenants(
        self,
        info: Info,
        status: Optional[str] = None,
        plan: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> List[TenantType]:
        """SUPER_ADMIN only: list all tenants."""
        user = info.context.request.user
        if not user.is_authenticated or user.role != "SUPER_ADMIN":
            raise Exception("Permission denied. Super Admin access required.")

        qs = Tenant.objects.all()
        if status:
            qs = qs.filter(status=status)
        if plan:
            qs = qs.filter(plan=plan)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(email__icontains=search)
            )

        offset = (page - 1) * page_size
        return list(qs.select_related("theme")[offset: offset + page_size])

    @strawberry.field
    def my_tenant(self, info: Info) -> Optional[TenantType]:
        """Return the tenant of the authenticated user."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if not user.tenant:
            return None
        return user.tenant

    @strawberry.field
    def tenant_by_slug(self, info: Info, slug: str) -> Optional[TenantType]:
        """Public: resolve tenant config by slug (used by frontend theme loader)."""
        try:
            tenant = Tenant.objects.select_related("theme").get(
                slug=slug, status="ACTIVE"
            )
            return tenant
        except Tenant.DoesNotExist:
            return None

    @strawberry.field
    def tenant_theme(self, info: Info, tenant_id: Optional[str] = None) -> Optional[TenantThemeType]:
        """
        Public endpoint: returns theme config for the current tenant.
        Used by the frontend ThemeProvider on initial load.
        """
        # Resolve from request tenant (set by TenantResolutionMiddleware)
        tenant = getattr(info.context.request, "tenant", None)

        if tenant_id and not tenant:
            try:
                tenant = Tenant.objects.get(id=tenant_id, status="ACTIVE")
            except Tenant.DoesNotExist:
                return None

        if not tenant:
            return None

        try:
            return tenant.theme
        except TenantTheme.DoesNotExist:
            # Return default theme if not configured
            return TenantTheme(
                tenant=tenant,
                primary_color="#E8580A",
                secondary_color="#FFFFFF",
            )

    @strawberry.field
    def tenant_domains(self, info: Info) -> List[TenantDomainType]:
        """List domains for the current user's tenant."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if not user.tenant:
            return []
        if user.role not in ("TENANT_ADMIN", "SUPER_ADMIN"):
            raise Exception("Permission denied.")
        return list(TenantDomain.objects.filter(tenant=user.tenant))
