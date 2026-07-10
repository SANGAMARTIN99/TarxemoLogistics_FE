import strawberry
from typing import Optional

@strawberry.input
class ProcessPaymentInput:
    invoice_id: str
    payment_method: str
    transaction_id: Optional[str] = None
    amount: Optional[float] = None
