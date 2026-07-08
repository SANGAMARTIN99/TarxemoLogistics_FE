import strawberry
import strawberry_django
from strawberry import auto
from .models import Invoice, Payment

@strawberry_django.type(Invoice)
class InvoiceType:
    id: auto
    amount: auto
    status: auto
    due_date: auto
    created_at: auto

@strawberry_django.type(Payment)
class PaymentType:
    id: auto
    transaction_id: auto
    payment_method: auto
    amount: auto
    timestamp: auto
