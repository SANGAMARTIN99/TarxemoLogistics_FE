"""
Tarxemo Logistics — ASGI Configuration
Handles HTTP, WebSocket, and Django Channels
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.development")

# Initialize Django ASGI application first for model loading
django_asgi_app = get_asgi_application()

# Import routing after Django setup to avoid early model loading
from apps.tracking.routing import websocket_urlpatterns as tracking_ws  # noqa: E402
from apps.notifications.routing import websocket_urlpatterns as notif_ws  # noqa: E402
from core.auth_middleware import JWTAuthMiddlewareStack  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JWTAuthMiddlewareStack(
                URLRouter(
                    tracking_ws + notif_ws
                )
            )
        ),
    }
)
