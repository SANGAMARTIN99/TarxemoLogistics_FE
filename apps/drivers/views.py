"""
apps.drivers.views — REST Views for Driver Document Uploads
(Phase 2: stub implementations)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser


class DriverDocumentUploadView(APIView):
    """Upload driver documents (DL, medical certificate, etc.)"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        # TODO: Phase 2 — implement document upload logic
        return Response({"message": "Document upload endpoint — Phase 2 implementation."})


class DriverPhotoUploadView(APIView):
    """Upload driver profile photo."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        # TODO: Phase 2 — implement photo upload logic
        return Response({"message": "Photo upload endpoint — Phase 2 implementation."})
