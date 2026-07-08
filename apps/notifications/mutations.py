import strawberry
from strawberry.types import Info
from .models import Notification

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
