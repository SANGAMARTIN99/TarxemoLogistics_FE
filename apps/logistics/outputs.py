import strawberry
import strawberry_django
from typing import List, Optional
from strawberry import auto
from .models import Truck, Container, Job, JobApplication
from apps.tenants.outputs import TenantType

@strawberry_django.type(Truck)
class TruckType:
    id: auto
    plate_number: auto
    make: auto
    model: auto
    year: auto
    capacity_tons: auto
    capacity_cbm: auto
    gps_unit_id: auto
    status: auto
    insurance_expiry: auto
    road_license_expiry: auto
    created_at: auto
    updated_at: auto

@strawberry_django.type(Container)
class ContainerType:
    id: auto
    container_number: auto
    container_type: auto
    status: auto
    created_at: auto
    updated_at: auto

@strawberry_django.type(JobApplication)
class JobApplicationType:
    id: auto
    status: auto
    license_class: auto
    experience_years: auto
    cover_letter: auto
    applied_at: auto

@strawberry_django.type(Job)
class JobType:
    id: auto
    title: auto
    description: auto
    requirements: auto
    benefits: auto
    location: auto
    job_type: auto
    salary_min: auto
    salary_max: auto
    currency: auto
    experience_years: auto
    license_class: auto
    deadline: auto
    status: auto
    posted_at: auto

    @strawberry.field
    def company(self) -> TenantType:
        # The tenant ForeignKey represents the logistics company
        return self.tenant

    @strawberry.field
    def applicants_count(self) -> int:
        return self.applications.count()

@strawberry.type
class JobPaginatedResponse:
    items: List[JobType]
    total_count: int
    page: int
    page_size: int
    has_next_page: bool

@strawberry.type
class ApplyForJobResponse:
    success: bool
    message: str
    application: Optional[JobApplicationType] = None
