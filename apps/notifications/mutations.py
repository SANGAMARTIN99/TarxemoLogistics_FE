import strawberry
from strawberry.types import Info
from .models import Notification
from .outputs import NotificationType, NotificationPaginatedType
from typing import List

@strawberry.type
class NotificationsMutation:
    @strawberry.mutation
    def mark_notification_read(self, info: Info, id: str) -> bool:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        try:
            notification = Notification.objects.get(id=id, recipient=user)
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False

    @strawberry.mutation
    def mark_all_notifications_read(self, info: Info) -> int:
        """Mark all notifications as read. Returns count of updated records."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        updated = Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)
        return updated

    @strawberry.mutation
    def delete_notification(self, info: Info, id: str) -> bool:
        """Delete a single notification."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        try:
            Notification.objects.get(id=id, recipient=user).delete()
            return True
        except Notification.DoesNotExist:
            return False

