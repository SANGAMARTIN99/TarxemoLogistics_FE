"""
apps.drivers.schema — Drivers App GraphQL Schema
"""
import strawberry
from .queries import DriversQuery
from .mutations import DriversMutation

@strawberry.type
class DriversSchemaQuery(DriversQuery):
    pass

@strawberry.type
class DriversSchemaMutation(DriversMutation):
    pass
