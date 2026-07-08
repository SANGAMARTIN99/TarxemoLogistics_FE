from django.urls import path
from .views import TenantLogoUploadView

urlpatterns = [
    path('<str:tenant_id>/logo/', TenantLogoUploadView.as_view(), name='tenant-logo-upload'),
]
