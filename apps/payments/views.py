"""
apps.payments.views — ClickPesa Webhook Handler (Phase 5 stub)
"""
from rest_framework.views import APIView
from rest_framework.response import Response


class ClickPesaWebhookView(APIView):
    """
    Receives payment webhooks from ClickPesa gateway.
    Phase 5 implementation.
    """
    authentication_classes = []  # Webhook — no JWT auth
    permission_classes = []

    def post(self, request):
        # TODO: Phase 5 — verify signature, update payment status
        return Response({"received": True})
