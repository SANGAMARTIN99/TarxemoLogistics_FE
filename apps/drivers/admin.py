from django.contrib import admin
from .models import DriverProfile

@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "license_number", "license_class", "experience_years", "status", "rating")
    search_fields = ("user__email", "license_number")
    list_filter = ("status", "license_class")
