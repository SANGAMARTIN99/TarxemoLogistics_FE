"""apps.notifications.mutations — Stub (Phase 3 implementation)"""
import strawberry

@strawberry.type
class NotificationMutation:
    @strawberry.mutation
    def notifications_ping(self) -> str:
        return "pong"
