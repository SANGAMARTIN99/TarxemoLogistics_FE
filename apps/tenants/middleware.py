"""
apps.tenants.middleware — TenantResolutionMiddleware
=====================================================
Resolves which tenant is making the request by inspecting:
1. X-Tenant-ID header (preferred for API calls)
2. Subdomain: {slug}.tarxemo.com
3. Custom domain lookup (TenantDomain table)

Sets request.tenant and request.tenant_id for downstream use.
"""
from django.http import JsonResponse
from .models import Tenant, TenantDomain


class TenantResolutionMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = None
        request.tenant_id = None

        # 1. Try explicit X-Tenant-ID header
        tenant_id_header = request.headers.get("X-Tenant-ID")
        if tenant_id_header:
            try:
                tenant = Tenant.objects.get(id=tenant_id_header, status="ACTIVE")
                request.tenant = tenant
                request.tenant_id = str(tenant.id)
            except Tenant.DoesNotExist:
                pass

        # 2. Try subdomain
        if not request.tenant:
            host = request.get_host().split(":")[0]  # Strip port
            parts = host.split(".")
            if len(parts) >= 3:
                slug = parts[0]
                try:
                    tenant = Tenant.objects.get(slug=slug, status="ACTIVE")
                    request.tenant = tenant
                    request.tenant_id = str(tenant.id)
                except Tenant.DoesNotExist:
                    pass

        # 3. Try custom domain
        if not request.tenant:
            host = request.get_host().split(":")[0]
            try:
                domain = TenantDomain.objects.select_related("tenant").get(
                    domain=host,
                    status="ACTIVE",
                    tenant__status="ACTIVE",
                )
                request.tenant = domain.tenant
                request.tenant_id = str(domain.tenant.id)
            except TenantDomain.DoesNotExist:
                pass

        return self.get_response(request)
