"""
Tarxemo Logistics — Core URLs
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from strawberry.django.views import AsyncGraphQLView
from mainschema import schema


urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # GraphQL API endpoint
    path(
        "graphql/",
        AsyncGraphQLView.as_view(schema=schema),
        name="graphql",
    ),

    # REST endpoints (for file/image upload — per user rules)
    path("api/tracking/", include("apps.tracking.urls")),
    path("api/drivers/", include("apps.drivers.urls")),
    path("api/payments/", include("apps.payments.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
