import strawberry
from typing import List
from strawberry.types import Info
from .models import Notification
from .outputs import NotificationType

@strawberry.type
class NotificationsQuery:
    @strawberry.field
    def my_notifications(self, info: Info, unread_only: bool = False) -> List[NotificationType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        queryset = Notification.objects.filter(recipient=user)
        if unread_only:
            queryset = queryset.filter(is_read=False)

        return list(queryset)
