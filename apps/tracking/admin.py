from django.contrib import admin
from .models import LocationLog

@admin.register(LocationLog)
class LocationLogAdmin(admin.ModelAdmin):
    list_display = ("trip", "latitude", "longitude", "speed_kph", "heading", "timestamp")
    search_fields = ("trip__id", "trip__title")
    list_filter = ("timestamp",)
