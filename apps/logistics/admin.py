from django.contrib import admin
from .models import Truck, Container, Job, JobApplication, SupportTicket, SupportTicketResponse

@admin.register(Truck)
class TruckAdmin(admin.ModelAdmin):
    list_display = ("plate_number", "tenant", "make", "model", "capacity_tons", "status")
    search_fields = ("plate_number", "make", "model", "tenant__name")
    list_filter = ("status", "tenant")

@admin.register(Container)
class ContainerAdmin(admin.ModelAdmin):
    list_display = ("container_number", "tenant", "container_type", "status")
    search_fields = ("container_number", "tenant__name")
    list_filter = ("status", "container_type", "tenant")

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "tenant", "location", "job_type", "status", "deadline")
    search_fields = ("title", "location", "tenant__name")
    list_filter = ("status", "job_type", "tenant")

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("job", "driver", "status", "applied_at")
    search_fields = ("job__title", "driver__email")
    list_filter = ("status",)

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("subject", "customer", "category", "priority", "status", "created_at")
    search_fields = ("subject", "customer__email", "category")
    list_filter = ("status", "priority", "category")

@admin.register(SupportTicketResponse)
class SupportTicketResponseAdmin(admin.ModelAdmin):
    list_display = ("ticket", "sender", "is_staff", "created_at")
    search_fields = ("ticket__subject", "sender__email")
    list_filter = ("is_staff",)
