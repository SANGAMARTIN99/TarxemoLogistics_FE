"""apps.logistics.queries — Stub (Phase 2 implementation)"""
import strawberry

@strawberry.type
class LogisticsQuery:
    @strawberry.field
    def logistics_health(self) -> str:
        return "logistics-ok"
