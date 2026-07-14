from django.contrib import admin
from .models import PricingMatrix, Quote

@admin.register(PricingMatrix)
class PricingMatrixAdmin(admin.ModelAdmin):
    list_display = ("source_location", "destination_location", "container_type", "base_rate", "per_km_rate", "per_ton_rate", "tenant")
    search_fields = ("source_location", "destination_location", "container_type", "tenant__name")
    list_filter = ("container_type", "tenant")

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "pickup_location", "delivery_location", "estimated_price", "status", "created_at")
    search_fields = ("id", "customer__email", "pickup_location", "delivery_location")
    list_filter = ("status", "tenant")
