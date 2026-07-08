"""
apps.pricing.schema — Pricing App GraphQL Schema
"""
import strawberry
from .queries import PricingQuery
from .mutations import PricingMutation

@strawberry.type
class PricingSchemaQuery(PricingQuery):
    pass

@strawberry.type
class PricingSchemaMutation(PricingMutation):
    pass
