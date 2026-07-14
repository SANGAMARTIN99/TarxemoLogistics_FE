import strawberry
from typing import List, Optional
from strawberry.types import Info
from .models import Notification
from .outputs import NotificationType, NotificationPaginatedType

@strawberry.type
class NotificationsQuery:
    @strawberry.field
    def my_notifications(
        self,
        info: Info,
        unread_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> NotificationPaginatedType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        qs = Notification.objects.filter(recipient=user)
        unread_count = qs.filter(is_read=False).count()

        if unread_only:
            qs = qs.filter(is_read=False)

        total_count = qs.count()
        offset = (page - 1) * page_size
        items = list(qs[offset:offset + page_size])

        return NotificationPaginatedType(
            items=items,
            total_count=total_count,
            unread_count=unread_count,
            page=page,
            page_size=page_size,
            has_next_page=offset + page_size < total_count,
        )

    @strawberry.field
    def unread_notification_count(self, info: Info) -> int:
        user = info.context.request.user
        if not user.is_authenticated:
            return 0
        return Notification.objects.filter(recipient=user, is_read=False).count()
