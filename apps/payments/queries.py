import strawberry
from typing import List
from strawberry.types import Info
from .models import Invoice
from .outputs import InvoiceType

@strawberry.type
class PaymentsQuery:
    @strawberry.field
    def invoices(self, info: Info) -> List[InvoiceType]:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        # Super admin sees all, Tenant Admin sees tenant's, Customer sees their own
        if user.role == "SUPER_ADMIN":
            return list(Invoice.objects.all())
        elif user.role == "TENANT_ADMIN":
            tenant = info.context.request.tenant
            if not tenant:
                return []
            return list(Invoice.objects.filter(tenant=tenant))
        else:
            return list(Invoice.objects.filter(customer=user))
