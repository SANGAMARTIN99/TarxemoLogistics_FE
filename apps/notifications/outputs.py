import strawberry
import strawberry_django
from strawberry import auto
from typing import List
from .models import Notification

@strawberry_django.type(Notification)
class NotificationType:
    id: auto
    title: auto
    body: auto
    category: auto
    is_read: auto
    created_at: auto


@strawberry.type
class NotificationPaginatedType:
    items: List[NotificationType]
    total_count: int
    unread_count: int
    page: int
    page_size: int
    has_next_page: bool
