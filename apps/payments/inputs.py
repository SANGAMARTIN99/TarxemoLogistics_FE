import strawberry

@strawberry.input
class ProcessPaymentInput:
    invoice_id: str
    transaction_id: str
    payment_method: str
    amount: float
