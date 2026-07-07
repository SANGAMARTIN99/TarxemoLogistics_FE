"""apps.payments.queries — Stub (Phase 5 implementation)"""
import strawberry

@strawberry.type
class PaymentQuery:
    @strawberry.field
    def payments_health(self) -> str:
        return "payments-ok"
