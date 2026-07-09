import strawberry
from typing import Optional, List
from strawberry.types import Info
from django.db.models import Q
from .models import Job, Truck, Container
from .outputs import JobType, JobPaginatedResponse, TruckType, ContainerType, CustomerDashboardType, CustomerDashboardShipmentType
from apps.pricing.models import Quote

@strawberry.type
class LogisticsQuery:
    @strawberry.field
    def jobs(
        self,
        info: Info,
        search: Optional[str] = None,
        company_id: Optional[str] = None,
        page: Optional[int] = 1,
        page_size: Optional[int] = 10,
        status: Optional[str] = "OPEN"
    ) -> JobPaginatedResponse:
        queryset = Job.objects.all().order_by("-posted_at")

        if status:
            queryset = queryset.filter(status=status)

        if company_id:
            queryset = queryset.filter(tenant_id=company_id)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(location__icontains=search) |
                Q(description__icontains=search)
            )

        total_count = queryset.count()
        
        # Paginate
        offset = (page - 1) * page_size
        items = list(queryset[offset:offset + page_size])
        
        has_next_page = offset + page_size < total_count

        return JobPaginatedResponse(
            items=items,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_next_page=has_next_page
        )

    @strawberry.field
    def job(self, info: Info, id: str) -> Optional[JobType]:
        try:
            return Job.objects.get(id=id)
        except Job.DoesNotExist:
            return None

    @strawberry.field
    def trucks(self, info: Info) -> List[TruckType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
            
        tenant = info.context.request.tenant
        if not tenant:
            return []
            
        return list(Truck.objects.filter(tenant=tenant))

    @strawberry.field
    def containers(self, info: Info) -> List[ContainerType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
            
        tenant = info.context.request.tenant
        if not tenant:
            return []
            
        return list(Container.objects.filter(tenant=tenant))

    @strawberry.field
    def customer_dashboard(self, info: Info) -> CustomerDashboardType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        # Compute stats for customer user
        active_shipments_count = Job.objects.filter(customer=user, status__in=["CONFIRMED", "IN_TRANSIT"]).count()
        total_shipments_count = Job.objects.filter(customer=user).count()
        pending_quotes_count = Quote.objects.filter(customer=user, status="PENDING").count()

        # Format recent shipments
        recent_jobs = Job.objects.filter(customer=user).order_by("-posted_at")[:5]
        recent_shipments = []
        for job in recent_jobs:
            pickup = job.location.split(" to ")[0] if " to " in job.location else job.location
            delivery = job.location.split(" to ")[1] if " to " in job.location else job.location
            tracking_num = f"TRX-{str(job.id)[:8].upper()}"
            recent_shipments.append(
                CustomerDashboardShipmentType(
                    id=str(job.id),
                    tracking_number=tracking_num,
                    status=job.status,
                    pickup=pickup,
                    delivery=delivery,
                    estimated_delivery=str(job.deadline) if job.deadline else "2026-08-12"
                )
            )

        return CustomerDashboardType(
            active_shipments=active_shipments_count,
            total_shipments=total_shipments_count,
            pending_quotes=pending_quotes_count,
            recent_shipments=recent_shipments
        )
