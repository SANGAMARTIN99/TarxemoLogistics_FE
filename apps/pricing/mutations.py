import strawberry
from typing import Optional
from decimal import Decimal
from strawberry.types import Info
from .models import Quote, PricingMatrix, QuoteStatus
from .inputs import RequestQuoteInput
from .outputs import RequestQuoteResponse

@strawberry.type
class PricingMutation:
    @strawberry.mutation
    def request_quote(self, info: Info, input: RequestQuoteInput) -> RequestQuoteResponse:
        user = info.context.request.user
        if not user.is_authenticated:
            return RequestQuoteResponse(
                success=False,
                message="Please login or register to request shipping quotes."
            )

        tenant = info.context.request.tenant
        if not tenant:
            return RequestQuoteResponse(
                success=False,
                message="No active carrier company context resolved. Please select a carrier."
            )

        # Attempt to find pricing in the matrix
        matrix = PricingMatrix.objects.filter(
            tenant=tenant,
            source_location__iexact=input.pickup_location,
            destination_location__iexact=input.delivery_location,
            container_type__iexact=input.container_type
        ).first()

        if matrix:
            estimated_price = matrix.base_rate + (matrix.per_ton_rate * Decimal(input.weight_tons))
        else:
            # Fallback estimation formula
            base_rate = Decimal("15000.00")
            per_ton_rate = Decimal("1200.00")
            estimated_price = base_rate + (per_ton_rate * Decimal(input.weight_tons))

        quote = Quote.objects.create(
            tenant=tenant,
            customer=user,
            pickup_location=input.pickup_location,
            delivery_location=input.delivery_location,
            weight_tons=input.weight_tons,
            container_type=input.container_type,
            cargo_details=input.cargo_details,
            estimated_price=estimated_price
        )

        return RequestQuoteResponse(
            success=True,
            message="Your freight shipping quote has been estimated successfully.",
            quote=quote
        )

    @strawberry.mutation
    def book_quote(self, info: Info, quote_id: str) -> RequestQuoteResponse:
        user = info.context.request.user
        if not user.is_authenticated:
            return RequestQuoteResponse(
                success=False,
                message="Authentication required."
            )

        try:
            quote = Quote.objects.get(id=quote_id, customer=user)
        except Quote.DoesNotExist:
            return RequestQuoteResponse(
                success=False,
                message="Quote not found."
            )

        if quote.status != QuoteStatus.PENDING:
            return RequestQuoteResponse(
                success=False,
                message=f"Quote has already been processed (Status: {quote.status})."
            )

        quote.status = QuoteStatus.APPROVED
        quote.save()

        # Create Job
        from apps.logistics.models import Job, JobStatus, JobType
        job = Job.objects.create(
            tenant=quote.tenant,
            customer=user,
            title=f"Freight Cargo: {quote.container_type} shipment",
            description=f"Corridor shipment of {quote.weight_tons} tons of cargo. Cargo Details: {quote.cargo_details or 'N/A'}",
            location=f"{quote.pickup_location} to {quote.delivery_location}",
            job_type=JobType.CONTRACT,
            salary_min=quote.estimated_price,
            salary_max=quote.estimated_price,
            status=JobStatus.CONFIRMED
        )

        # Create Invoice
        from apps.payments.models import Invoice, InvoiceStatus
        from datetime import date, timedelta
        due_date = date.today() + timedelta(days=14)
        Invoice.objects.create(
            tenant=quote.tenant,
            trip=job,
            customer=user,
            amount=quote.estimated_price,
            status=InvoiceStatus.UNPAID,
            due_date=due_date
        )

        return RequestQuoteResponse(
            success=True,
            message="Quote accepted and corridor trip booked successfully! Invoice generated.",
            quote=quote
        )

    @strawberry.mutation
    def update_pricing_matrix(
        self,
        info: Info,
        container_type: str,
        base_rate: float,
        per_ton_rate: float,
        per_km_rate: float,
        source_location: Optional[str] = "Mombasa",
        destination_location: Optional[str] = "Kampala"
    ) -> bool:
        user = info.context.request.user
        if not user.is_authenticated or user.role not in ("TENANT_ADMIN", "SUPER_ADMIN", "OPERATIONS_MANAGER"):
            raise Exception("Permission denied. Operations Manager or Tenant Admin access required.")

        tenant = info.context.request.tenant or user.tenant
        if not tenant:
            raise Exception("No active carrier company context resolved.")

        # Update or create pricing matrix
        PricingMatrix.objects.update_or_create(
            tenant=tenant,
            source_location=source_location or "Mombasa",
            destination_location=destination_location or "Kampala",
            container_type=container_type,
            defaults={
                "base_rate": Decimal(str(base_rate)),
                "per_km_rate": Decimal(str(per_km_rate)),
                "per_ton_rate": Decimal(str(per_ton_rate)),
            }
        )
        return True
