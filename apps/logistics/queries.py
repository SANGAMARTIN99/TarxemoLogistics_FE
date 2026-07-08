import strawberry
from typing import Optional, List
from strawberry.types import Info
from django.db.models import Q
from .models import Job, Truck, Container
from .outputs import JobType, JobPaginatedResponse, TruckType, ContainerType

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
