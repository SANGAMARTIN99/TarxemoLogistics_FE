import strawberry
from strawberry.types import Info
from .models import Truck, Container, Job, JobApplication, SupportTicket, SupportTicketResponse
from .inputs import CreateTruckInput, CreateContainerInput, CreateJobInput, JobApplicationInput
from .outputs import (
    TruckType, ContainerType, JobType, ApplyForJobResponse, JobApplicationType,
    SupportTicketType, SupportTicketResponseType
)

@strawberry.type
class LogisticsMutation:
    @strawberry.mutation
    def create_truck(self, info: Info, input: CreateTruckInput) -> TruckType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
            
        tenant = info.context.request.tenant
        if not tenant:
            raise Exception("No active tenant context.")
            
        if user.role not in ("TENANT_ADMIN", "SUPER_ADMIN", "OPERATIONS_MANAGER"):
            raise Exception("Permission denied.")

        truck = Truck.objects.create(
            tenant=tenant,
            plate_number=input.plate_number,
            make=input.make,
            model=input.model,
            year=input.year,
            capacity_tons=input.capacity_tons,
            capacity_cbm=input.capacity_cbm,
            gps_unit_id=input.gps_unit_id
        )
        return truck

    @strawberry.mutation
    def create_container(self, info: Info, input: CreateContainerInput) -> ContainerType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
            
        tenant = info.context.request.tenant
        if not tenant:
            raise Exception("No active tenant context.")
            
        if user.role not in ("TENANT_ADMIN", "SUPER_ADMIN", "OPERATIONS_MANAGER"):
            raise Exception("Permission denied.")

        container = Container.objects.create(
            tenant=tenant,
            container_number=input.container_number,
            container_type=input.container_type
        )
        return container

    @strawberry.mutation
    def create_job(self, info: Info, input: CreateJobInput) -> JobType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
            
        tenant = info.context.request.tenant
        if not tenant:
            raise Exception("No active tenant context.")
            
        if user.role not in ("TENANT_ADMIN", "SUPER_ADMIN", "OPERATIONS_MANAGER"):
            raise Exception("Permission denied.")

        job = Job.objects.create(
            tenant=tenant,
            title=input.title,
            description=input.description,
            requirements=input.requirements,
            benefits=input.benefits,
            location=input.location,
            job_type=input.job_type,
            salary_min=input.salary_min,
            salary_max=input.salary_max,
            currency=input.currency,
            experience_years=input.experience_years,
            license_class=input.license_class,
            deadline=input.deadline
        )
        return job

    @strawberry.mutation
    def apply_for_job(self, info: Info, input: JobApplicationInput) -> ApplyForJobResponse:
        user = info.context.request.user
        if not user.is_authenticated:
            return ApplyForJobResponse(
                success=False,
                message="Please authenticate or register first before submitting your application."
            )

        try:
            job = Job.objects.get(id=input.job_id)
        except Job.DoesNotExist:
            return ApplyForJobResponse(success=False, message="Target job not found.")

        # Check if user already applied
        if JobApplication.objects.filter(job=job, driver=user).exists():
            return ApplyForJobResponse(success=False, message="You have already submitted an application for this job.")

        application = JobApplication.objects.create(
            job=job,
            driver=user,
            license_class=input.license_class,
            experience_years=input.experience_years,
            cover_letter=input.cover_letter
        )

        return ApplyForJobResponse(
            success=True,
            message="Application submitted successfully. Our carriers will reach out to you shortly.",
            application=application
        )

    @strawberry.mutation
    def create_support_ticket(self, info: Info, subject: str, description: str, category: str, priority: str) -> SupportTicketType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        ticket = SupportTicket.objects.create(
            customer=user,
            subject=subject,
            description=description,
            category=category,
            priority=priority
        )
        return ticket

    @strawberry.mutation
    def create_support_ticket_response(self, info: Info, ticket_id: str, message: str) -> SupportTicketResponseType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        try:
            ticket = SupportTicket.objects.get(id=ticket_id)
        except SupportTicket.DoesNotExist:
            raise Exception("Ticket not found.")
            
        is_staff = user.role in ("SUPER_ADMIN", "TENANT_ADMIN", "OPERATIONS_MANAGER")
        
        response = SupportTicketResponse.objects.create(
            ticket=ticket,
            sender=user,
            message=message,
            is_staff=is_staff
        )
        return response
