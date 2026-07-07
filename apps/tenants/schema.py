"""
apps.tenants.schema — Tenants App GraphQL Schema
"""
import strawberry
from .queries import TenantQuery
from .mutations import TenantMutation


@strawberry.type
class TenantSchemaQuery(TenantQuery):
    pass


@strawberry.type
class TenantSchemaMutation(TenantMutation):
    pass


tenant_schema = strawberry.Schema(query=TenantSchemaQuery, mutation=TenantSchemaMutation)
