import strawberry
import strawberry_django
from strawberry import auto
from .models import Notification

@strawberry_django.type(Notification)
class NotificationType:
    id: auto
    title: auto
    body: auto
    category: auto
    is_read: auto
    created_at: auto
