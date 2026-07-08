"""
apps.payments.schema — Payments App GraphQL Schema
"""
import strawberry
from .queries import PaymentsQuery
from .mutations import PaymentsMutation

@strawberry.type
class PaymentsSchemaQuery(PaymentsQuery):
    pass

@strawberry.type
class PaymentsSchemaMutation(PaymentsMutation):
    pass
