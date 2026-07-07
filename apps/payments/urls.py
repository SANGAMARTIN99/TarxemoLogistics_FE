"""apps.payments.urls — REST URLs for ClickPesa webhooks"""
from django.urls import path
from . import views

urlpatterns = [
    path("webhook/clickpesa/", views.ClickPesaWebhookView.as_view(), name="clickpesa-webhook"),
]
