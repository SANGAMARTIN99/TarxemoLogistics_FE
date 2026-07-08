import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from apps.tenants.models import Tenant

@method_decorator(csrf_exempt, name='dispatch')
class TenantLogoUploadView(View):
    def post(self, request, tenant_id):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Unauthorized"}, status=401)
            
        user = request.user
        if user.role not in ["SUPER_ADMIN", "TENANT_ADMIN"]:
            return JsonResponse({"error": "Permission denied"}, status=403)
            
        try:
            if user.role == "SUPER_ADMIN":
                tenant = Tenant.objects.get(id=tenant_id)
            else:
                if str(user.tenant_id) != str(tenant_id):
                    return JsonResponse({"error": "Permission denied"}, status=403)
                tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return JsonResponse({"error": "Tenant not found"}, status=404)
            
        if 'logo' not in request.FILES:
            return JsonResponse({"error": "No logo provided"}, status=400)
            
        logo_file = request.FILES['logo']
        tenant.logo.save(f"{tenant.id}_logo_{logo_file.name}", logo_file)
        tenant.save()
        
        return JsonResponse({
            "success": True,
            "logo_url": tenant.logo.url
        })
