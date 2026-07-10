import strawberry
from strawberry.types import Info
from decimal import Decimal
from .models import Invoice, Payment, InvoiceStatus
from .inputs import ProcessPaymentInput
from .outputs import PaymentType

@strawberry.type
class PaymentsMutation:
    @strawberry.mutation
    def process_payment(self, info: Info, input: ProcessPaymentInput) -> PaymentType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        try:
            invoice = Invoice.objects.get(id=input.invoice_id)
        except Invoice.DoesNotExist:
            raise Exception("Invoice not found.")

        # Permissions check: customer or tenant admin
        if user.role != "SUPER_ADMIN" and user.role != "TENANT_ADMIN" and invoice.customer != user:
            raise Exception("Permission denied.")

        import uuid
        tx_id = input.transaction_id or f"TXN-{uuid.uuid4().hex[:12].upper()}"
        payment_amount = Decimal(str(input.amount)) if input.amount is not None else invoice.amount

        payment = Payment.objects.create(
            invoice=invoice,
            transaction_id=tx_id,
            payment_method=input.payment_method,
            amount=payment_amount
        )

        # Update invoice status if paid in full
        total_paid = sum([p.amount for p in invoice.payments.all()])
        if total_paid >= invoice.amount:
            invoice.status = InvoiceStatus.PAID
            invoice.save()

        return payment
