"""apps.pricing.mutations — Stub (Phase 3 implementation)"""
import strawberry

@strawberry.type
class PricingMutation:
    @strawberry.mutation
    def pricing_ping(self) -> str:
        return "pong"
