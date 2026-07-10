import strawberry
from strawberry.types import Info
from typing import Optional
from .outputs import DriverDashboardType, DriverEarningsType, DriverTripType
from apps.logistics.models import Job

@strawberry.type
class DriversQuery:
    @strawberry.field
    def driver_dashboard(self, info: Info) -> DriverDashboardType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        # Compute stats for user
        assigned_jobs = Job.objects.filter(assigned_driver=user)
        completed_trips_count = assigned_jobs.filter(status="DELIVERED").count()
        available_jobs_count = Job.objects.filter(status="OPEN").count()
        
        # Format upcoming trips
        upcoming_trips = []
        for job in assigned_jobs.filter(status__in=["CONFIRMED", "IN_TRANSIT"]):
            upcoming_trips.append(
                DriverTripType(
                    id=str(job.id),
                    title=job.title,
                    pickup=job.location.split(" to ")[0] if " to " in job.location else job.location,
                    delivery=job.location.split(" to ")[1] if " to " in job.location else job.location,
                    date=str(job.deadline) if job.deadline else "2026-08-12",
                    status=job.status
                )
            )

        # Get driver rating
        rating = 5.0
        if hasattr(user, "driver_profile"):
            rating = float(user.driver_profile.rating)

        # Compute monthly earnings
        this_month_earnings = sum([float(job.salary_min or 0) for job in assigned_jobs.filter(status="DELIVERED")])

        earnings = DriverEarningsType(
            this_month=this_month_earnings,
            last_month=0.0,
            currency="KES"
        )

        return DriverDashboardType(
            available_jobs=available_jobs_count,
            completed_trips=completed_trips_count,
            rating=rating,
            earnings=earnings,
            upcoming_trips=upcoming_trips
        )
