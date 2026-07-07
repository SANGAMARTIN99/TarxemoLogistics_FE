"""
apps.notifications.consumers — Real-Time Notification WebSocket Consumer
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Personal notification channel for each authenticated user.
    Group name: notifications_user_{user_id}
    Tenant-broadcast group: notifications_tenant_{tenant_id}
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user_id = str(user.id)
        self.user_group = f"notifications_user_{self.user_id}"
        self.tenant_group = f"notifications_tenant_{user.tenant_id}" if user.tenant_id else None

        # Join personal notification group
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # Join tenant-wide notification group (for broadcasts)
        if self.tenant_group:
            await self.channel_layer.group_add(self.tenant_group, self.channel_name)

        await self.accept()

        await self.send(json.dumps({
            "type": "connected",
            "message": "Connected to live notifications.",
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if self.tenant_group:
            await self.channel_layer.group_discard(self.tenant_group, self.channel_name)

    async def receive(self, text_data):
        """Mark notifications as read when client sends ack."""
        try:
            data = json.loads(text_data)
            if data.get("type") == "mark_read":
                # TODO: Mark notification as read in DB (Phase 3)
                pass
        except json.JSONDecodeError:
            pass

    async def send_notification(self, event):
        """Push a notification to this user's WebSocket."""
        await self.send(json.dumps({
            "type": "notification",
            "id": event.get("id"),
            "title": event.get("title"),
            "body": event.get("body"),
            "category": event.get("category"),
            "data": event.get("data", {}),
            "timestamp": event.get("timestamp"),
        }))

    async def broadcast_notification(self, event):
        """Push a tenant-wide broadcast notification."""
        await self.send(json.dumps({
            "type": "broadcast",
            "title": event.get("title"),
            "body": event.get("body"),
            "category": event.get("category"),
            "timestamp": event.get("timestamp"),
        }))
