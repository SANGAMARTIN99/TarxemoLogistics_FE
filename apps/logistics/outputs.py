import strawberry
import strawberry_django
from typing import List, Optional
from strawberry import auto
from .models import Truck, Container, Job, JobApplication, SupportTicket, SupportTicketResponse
from apps.tenants.outputs import TenantType
from apps.authentication.outputs import UserType

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
    customer: Optional[UserType]

    @strawberry.field
    def company(self) -> TenantType:
        # The tenant ForeignKey represents the logistics company
        return self.tenant

    @strawberry.field
    def applicants_count(self) -> int:
        return self.applications.count()

    @strawberry.field
    def tracking_number(self) -> str:
        return f"TRX-{str(self.id)[:8].upper()}"

    @strawberry.field
    def pickup(self) -> str:
        return self.location.split(" to ")[0] if " to " in self.location else self.location

    @strawberry.field
    def delivery(self) -> str:
        return self.location.split(" to ")[1] if " to " in self.location else self.location

    @strawberry.field
    def estimated_delivery(self) -> str:
        return str(self.deadline) if self.deadline else "2026-08-12"

    @strawberry.field
    def actual_delivery(self) -> str:
        return str(self.updated_at.date()) if self.status == "DELIVERED" else ""

    @strawberry.field
    def weight_tons(self) -> float:
        return 12.5

    @strawberry.field
    def container_type(self) -> str:
        return self.assigned_container.container_type if self.assigned_container else "40FT"

    @strawberry.field
    def amount(self) -> float:
        return float(self.salary_min or 4500000)

    @strawberry.field
    def created_at(self) -> str:
        return self.posted_at.isoformat()

    @strawberry.field
    def tenant(self) -> Optional[TenantType]:
        return self.tenant

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

@strawberry.type
class CustomerDashboardShipmentType:
    id: str
    tracking_number: str
    status: str
    pickup: str
    delivery: str
    estimated_delivery: str

@strawberry.type
class CustomerDashboardType:
    active_shipments: int
    total_shipments: int
    pending_quotes: int
    recent_shipments: List[CustomerDashboardShipmentType]

@strawberry.type
class LogisticsManagerLogType:
    checkpoint: str
    time: str
    operator: str
    code: str
    status: str

@strawberry.type
class LogisticsManagerPricingType:
    base_rate_km: float
    currency: str
    corridor_name: str

@strawberry.type
class LogisticsManagerDashboardType:
    corridor_utility: str
    active_drivers_count: int
    active_tenants_count: int
    active_logs: List[LogisticsManagerLogType]
    pricing: LogisticsManagerPricingType


@strawberry_django.type(SupportTicketResponse)
class SupportTicketResponseType:
    id: auto
    message: auto
    is_staff: auto
    created_at: auto


@strawberry_django.type(SupportTicket)
class SupportTicketType:
    id: auto
    subject: auto
    category: auto
    priority: auto
    status: auto
    description: auto
    created_at: auto
    updated_at: auto

    @strawberry.field
    def responses(self) -> List[SupportTicketResponseType]:
        return list(self.responses.all())


# ─── OPERATIONS MANAGER TYPES ─────────────────────────────────────────────────

@strawberry.type
class OperationsFleetStatsType:
    total_trucks: int
    active_trucks: int
    maintenance_trucks: int
    oos_trucks: int
    total_containers: int
    assigned_containers: int
    active_dispatches: int
    pending_jobs: int
    delivered_today: int
    fleet_utilization: int


@strawberry.type
class OperationsDriverStatusType:
    id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    status: str  # ON_DUTY | AVAILABLE
    active_job_id: Optional[str]
    active_job_title: Optional[str]
    completed_trips: int
    rating: float


@strawberry.type
class OperationsDriverStatusPaginatedType:
    items: List[OperationsDriverStatusType]
    total_count: int
    page: int
    page_size: int
    has_next_page: bool

