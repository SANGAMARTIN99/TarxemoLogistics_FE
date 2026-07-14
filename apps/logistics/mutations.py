import strawberry
from strawberry.types import Info
from typing import Optional
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

    # ─── OPERATIONS MANAGER MUTATIONS ────────────────────────────────────────

    @strawberry.mutation
    def assign_driver_to_job(
        self,
        info: Info,
        job_id: str,
        driver_id: str,
        truck_id: Optional[str] = None,
        container_id: Optional[str] = None,
    ) -> JobType:
        """Assign a driver (and optionally truck + container) to a job."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if user.role not in ("OPERATIONS_MANAGER", "TENANT_ADMIN", "SUPER_ADMIN"):
            raise Exception("Permission denied.")

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            raise Exception("Job not found.")

        try:
            driver = User.objects.get(id=driver_id, role="DRIVER")
        except User.DoesNotExist:
            raise Exception("Driver not found.")

        job.assigned_driver = driver
        job.status = "CONFIRMED"

        if truck_id:
            try:
                truck = Truck.objects.get(id=truck_id)
                job.assigned_truck = truck
                truck.status = "ACTIVE"
                truck.save()
            except Truck.DoesNotExist:
                pass

        if container_id:
            try:
                container = Container.objects.get(id=container_id)
                job.assigned_container = container
                container.status = "ASSIGNED"
                container.save()
            except Container.DoesNotExist:
                pass

        job.save()

        # Create notification for driver
        try:
            from apps.notifications.models import Notification
            Notification.objects.create(
                recipient=driver,
                title="New Trip Assigned",
                body=f"You have been assigned to job: {job.title}. Please prepare for departure.",
                category="TRIP_UPDATE",
            )
        except Exception:
            pass

        return job

    @strawberry.mutation
    def update_job_status(self, info: Info, job_id: str, status: str) -> JobType:
        """Update trip/job lifecycle status."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if user.role not in ("OPERATIONS_MANAGER", "TENANT_ADMIN", "SUPER_ADMIN", "DRIVER"):
            raise Exception("Permission denied.")

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            raise Exception("Job not found.")

        allowed_statuses = ["OPEN", "DRAFT", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]
        if status not in allowed_statuses:
            raise Exception(f"Invalid status. Must be one of: {', '.join(allowed_statuses)}")

        job.status = status
        job.save()

        # Notify the customer if job has one
        if job.customer:
            try:
                from apps.notifications.models import Notification
                status_messages = {
                    "CONFIRMED": f"Your shipment {job.tracking_number} has been confirmed and is being prepared.",
                    "IN_TRANSIT": f"Your shipment {job.tracking_number} is now in transit. Track it live.",
                    "DELIVERED": f"Your shipment {job.tracking_number} has been delivered successfully!",
                    "CANCELLED": f"Your shipment {job.tracking_number} has been cancelled. Please contact support.",
                }
                msg = status_messages.get(status)
                if msg:
                    Notification.objects.create(
                        recipient=job.customer,
                        title=f"Shipment {status.replace('_', ' ').title()}",
                        body=msg,
                        category="TRIP_UPDATE",
                    )
            except Exception:
                pass

        return job

    @strawberry.mutation
    def update_truck_status(self, info: Info, truck_id: str, status: str) -> TruckType:
        """Update truck operational status."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if user.role not in ("OPERATIONS_MANAGER", "TENANT_ADMIN", "SUPER_ADMIN"):
            raise Exception("Permission denied.")

        try:
            truck = Truck.objects.get(id=truck_id)
        except Truck.DoesNotExist:
            raise Exception("Truck not found.")

        allowed = ["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"]
        if status not in allowed:
            raise Exception(f"Invalid status. Must be one of: {', '.join(allowed)}")

        truck.status = status
        truck.save()
        return truck

    @strawberry.mutation
    def review_application(self, info: Info, application_id: str, decision: str) -> JobApplicationType:
        """Approve or reject a driver application."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")
        if user.role not in ("OPERATIONS_MANAGER", "TENANT_ADMIN", "SUPER_ADMIN"):
            raise Exception("Permission denied.")

        allowed_decisions = ["APPROVED", "REJECTED", "SCREENING", "INTERVIEW"]
        if decision not in allowed_decisions:
            raise Exception(f"Invalid decision. Must be one of: {', '.join(allowed_decisions)}")

        try:
            application = JobApplication.objects.select_related("driver", "job").get(id=application_id)
        except JobApplication.DoesNotExist:
            raise Exception("Application not found.")

        application.status = decision
        application.save()

        # Notify the driver
        try:
            from apps.notifications.models import Notification
            messages = {
                "APPROVED": f"Congratulations! Your application for '{application.job.title}' has been approved.",
                "REJECTED": f"Your application for '{application.job.title}' was not successful this time.",
                "SCREENING": f"Your application for '{application.job.title}' is now under review.",
                "INTERVIEW": f"You have been shortlisted for '{application.job.title}'. Expect contact from our team.",
            }
            Notification.objects.create(
                recipient=application.driver,
                title=f"Application {decision.title()}",
                body=messages[decision],
                category="INFO",
            )
        except Exception:
            pass

        return application
