"""
apps.notifications.schema — Notifications App GraphQL Schema
"""
import strawberry
from .queries import NotificationsQuery
from .mutations import NotificationsMutation

@strawberry.type
class NotificationsSchemaQuery(NotificationsQuery):
    pass

@strawberry.type
class NotificationsSchemaMutation(NotificationsMutation):
    pass
