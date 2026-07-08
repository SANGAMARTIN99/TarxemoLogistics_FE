import uuid
from django.db import models
from django.conf import settings
from apps.tenants.models import Tenant
from apps.logistics.models import Job

class InvoiceStatus(models.TextChoices):
    UNPAID = "UNPAID", "Unpaid"
    PAID = "PAID", "Paid"
    OVERDUE = "OVERDUE", "Overdue"

class PaymentMethod(models.TextChoices):
    STRIPE = "STRIPE", "Stripe"
    MPESA = "MPESA", "M-Pesa"
    BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="invoices")
    trip = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="invoices")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invoices")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.UNPAID)
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments_invoice"

    def __str__(self):
        return f"Invoice {self.id} ({self.amount} KES)"

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    transaction_id = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.STRIPE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments_payment"

    def __str__(self):
        return f"Payment {self.transaction_id} for Invoice {self.invoice.id}"
