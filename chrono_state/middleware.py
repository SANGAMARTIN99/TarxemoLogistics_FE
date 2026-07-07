"""
chrono_state.middleware — ChronoStateMiddleware
================================================
Django middleware that:
1. Injects request context (actor, IP, request_id) into thread-local
   storage so signals can attribute audit logs to the right user.
2. Detects the X-Chrono-As-Of header and activates/deactivates
   time-travel sessions for the request.
"""
import uuid
from django.utils import timezone
from django.http import JsonResponse
from .signals import set_chrono_context


class ChronoStateMiddleware:
    """
    Middleware to:
    - Tag every request with actor + IP for audit logging
    - Handle time-travel session activation via X-Chrono-As-Of header
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # ─── Set audit context for this request ───────────────────────────
        request_id = uuid.uuid4()
        actor = request.user if hasattr(request, "user") and request.user.is_authenticated else None
        actor_ip = self._get_client_ip(request)

        # ─── Resolve tenant from request ──────────────────────────────────
        tenant_id = getattr(request, "tenant_id", None)

        set_chrono_context(
            actor=actor,
            actor_ip=actor_ip,
            request_id=request_id,
            tenant_id=tenant_id,
        )

        # ─── Time-travel: detect X-Chrono-As-Of header ───────────────────
        as_of_header = request.headers.get("X-Chrono-As-Of")
        if as_of_header:
            try:
                from dateutil.parser import parse as parse_date
                as_of = parse_date(as_of_header)
                if timezone.is_naive(as_of):
                    as_of = timezone.make_aware(as_of)
                request.chrono_as_of = as_of
            except Exception:
                return JsonResponse(
                    {"error": "Invalid X-Chrono-As-Of header format. Use ISO 8601."},
                    status=400,
                )
        else:
            request.chrono_as_of = None

        response = self.get_response(request)
        return response

    @staticmethod
    def _get_client_ip(request) -> str:
        """Extract the real client IP, respecting reverse proxies."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")
