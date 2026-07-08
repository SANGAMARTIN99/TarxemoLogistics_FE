import strawberry
from decimal import Decimal
from strawberry.types import Info
from .models import Quote, PricingMatrix
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
