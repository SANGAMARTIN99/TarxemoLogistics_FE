import strawberry
from typing import List, Optional
from strawberry.types import Info
from .models import Quote, PricingMatrix
from .outputs import QuoteType, PricingMatrixType

@strawberry.type
class PricingQuery:
    @strawberry.field
    def quotes(self, info: Info) -> List[QuoteType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        # Super admin sees all, Tenant Admin sees tenant's, Customer sees their own
        if user.role == "SUPER_ADMIN":
            return list(Quote.objects.all())
        elif user.role == "TENANT_ADMIN":
            tenant = info.context.request.tenant
            if not tenant:
                return []
            return list(Quote.objects.filter(tenant=tenant))
        else:
            return list(Quote.objects.filter(customer=user))

    @strawberry.field
    def pricing_matrices(self, info: Info) -> List[PricingMatrixType]:
        tenant = info.context.request.tenant
        if not tenant:
            return []
        return list(PricingMatrix.objects.filter(tenant=tenant))
