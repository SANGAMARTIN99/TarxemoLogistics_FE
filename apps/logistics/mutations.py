"""apps.logistics.mutations — Stub (Phase 2 implementation)"""
import strawberry

@strawberry.type
class LogisticsMutation:
    @strawberry.mutation
    def logistics_ping(self) -> str:
        return "pong"
