"""apps.tracking.mutations — Stub (Phase 3 implementation)"""
import strawberry

@strawberry.type
class TrackingMutation:
    @strawberry.mutation
    def tracking_ping(self) -> str:
        return "pong"
