"""apps.notifications.queries — Stub (Phase 3 implementation)"""
import strawberry

@strawberry.type
class NotificationQuery:
    @strawberry.field
    def notifications_health(self) -> str:
        return "notifications-ok"
