from django.contrib import admin
from .models import Invoice, Payment

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "trip", "customer", "amount", "status", "due_date")
    search_fields = ("id", "customer__email", "tenant__name", "trip__title")
    list_filter = ("status", "tenant")

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("transaction_id", "invoice", "payment_method", "amount", "timestamp")
    search_fields = ("transaction_id", "invoice__id")
    list_filter = ("payment_method",)
