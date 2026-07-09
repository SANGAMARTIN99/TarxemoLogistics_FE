import uuid
from django.db import models
from django.conf import settings
from apps.tenants.models import Tenant

class TruckStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    MAINTENANCE = "MAINTENANCE", "Maintenance"
    OUT_OF_SERVICE = "OUT_OF_SERVICE", "Out of Service"

class ContainerStatus(models.TextChoices):
    AVAILABLE = "AVAILABLE", "Available"
    ASSIGNED = "ASSIGNED", "Assigned"
    MAINTENANCE = "MAINTENANCE", "Maintenance"

class JobStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    DRAFT = "DRAFT", "Draft"
    CONFIRMED = "CONFIRMED", "Confirmed"
    IN_TRANSIT = "IN_TRANSIT", "In Transit"
    DELIVERED = "DELIVERED", "Delivered"
    CANCELLED = "CANCELLED", "Cancelled"

class JobType(models.TextChoices):
    FULL_TIME = "FULL_TIME", "Full Time"
    CONTRACT = "CONTRACT", "Contract"
    PART_TIME = "PART_TIME", "Part Time"

class Truck(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="trucks")
    plate_number = models.CharField(max_length=30)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.IntegerField()
    capacity_tons = models.DecimalField(max_digits=5, decimal_places=2)
    capacity_cbm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    gps_unit_id = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=TruckStatus.choices, default=TruckStatus.ACTIVE)
    insurance_expiry = models.DateField(null=True, blank=True)
    road_license_expiry = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logistics_truck"
        unique_together = ("tenant", "plate_number")

    def __str__(self):
        return f"{self.plate_number} ({self.make} {self.model})"

class Container(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="containers")
    container_number = models.CharField(max_length=30)
    container_type = models.CharField(max_length=30) # e.g. 20FT, 40FT, Reefer
    status = models.CharField(max_length=20, choices=ContainerStatus.choices, default=ContainerStatus.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logistics_container"
        unique_together = ("tenant", "container_number")

    def __str__(self):
        return f"{self.container_number} ({self.container_type})"

class Job(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="jobs")
    title = models.CharField(max_length=150)
    description = models.TextField()
    requirements = models.TextField(null=True, blank=True)
    benefits = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255) # e.g. "Mombasa to Kampala"
    job_type = models.CharField(max_length=20, choices=JobType.choices, default=JobType.CONTRACT)
    salary_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="KES")
    experience_years = models.IntegerField(default=2)
    license_class = models.CharField(max_length=30, default="Class E")
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.OPEN)
    
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="customer_jobs")
    assigned_driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_jobs")
    assigned_truck = models.ForeignKey(Truck, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_jobs")
    assigned_container = models.ForeignKey(Container, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_jobs")
    
    posted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logistics_job"

    def __str__(self):
        return self.title

class JobApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications")
    status = models.CharField(
        max_length=20, 
        choices=[
            ("RECEIVED", "Received"),
            ("SCREENING", "Screening"),
            ("INTERVIEW", "Interview"),
            ("APPROVED", "Approved"),
            ("REJECTED", "Rejected")
        ],
        default="RECEIVED"
    )
    license_class = models.CharField(max_length=30)
    experience_years = models.IntegerField()
    cover_letter = models.TextField(null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logistics_job_application"
        unique_together = ("job", "driver")

    def __str__(self):
        return f"{self.driver.email} -> {self.job.title}"
