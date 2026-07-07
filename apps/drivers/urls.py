"""apps.drivers.urls — REST URLs (file upload for driver docs)"""
from django.urls import path
from . import views

urlpatterns = [
    path("upload-document/", views.DriverDocumentUploadView.as_view(), name="driver-doc-upload"),
    path("upload-photo/", views.DriverPhotoUploadView.as_view(), name="driver-photo-upload"),
]
