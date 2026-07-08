"""
apps.tracking.schema — Tracking App GraphQL Schema
"""
import strawberry
from .queries import TrackingQuery
from .mutations import TrackingMutation

@strawberry.type
class TrackingSchemaQuery(TrackingQuery):
    pass

@strawberry.type
class TrackingSchemaMutation(TrackingMutation):
    pass
