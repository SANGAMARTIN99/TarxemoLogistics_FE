from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "recipient", "tenant", "category", "is_read", "created_at")
    search_fields = ("title", "recipient__email", "tenant__name")
    list_filter = ("category", "is_read", "tenant")
