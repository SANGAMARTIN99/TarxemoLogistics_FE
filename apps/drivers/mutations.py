"""apps.drivers.mutations — Stub (Phase 2 implementation)"""
import strawberry

@strawberry.type
class DriverMutation:
    @strawberry.mutation
    def drivers_ping(self) -> str:
        return "pong"
