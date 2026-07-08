"""
apps.logistics.schema — Logistics App GraphQL Schema
"""
import strawberry
from .queries import LogisticsQuery
from .mutations import LogisticsMutation

@strawberry.type
class LogisticsSchemaQuery(LogisticsQuery):
    pass

@strawberry.type
class LogisticsSchemaMutation(LogisticsMutation):
    pass
