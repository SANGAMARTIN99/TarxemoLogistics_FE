"""apps.tracking.queries — Stub (Phase 3 implementation)"""
import strawberry

@strawberry.type
class TrackingQuery:
    @strawberry.field
    def tracking_health(self) -> str:
        return "tracking-ok"
