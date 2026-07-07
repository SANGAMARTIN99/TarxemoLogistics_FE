"""apps.drivers.queries — Stub (Phase 2 implementation)"""
import strawberry

@strawberry.type
class DriverQuery:
    @strawberry.field
    def drivers_health(self) -> str:
        return "drivers-ok"
