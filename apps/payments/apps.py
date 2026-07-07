"""apps.payments — App Config"""
from django.apps import AppConfig

class PaymentsConfig(AppConfig):
    name = "apps.payments"
    label = "payments"
    verbose_name = "Payments (ClickPesa)"
