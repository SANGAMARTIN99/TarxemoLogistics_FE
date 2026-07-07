"""apps.payments.mutations — Stub (Phase 5 implementation)"""
import strawberry

@strawberry.type
class PaymentMutation:
    @strawberry.mutation
    def payments_ping(self) -> str:
        return "pong"
