"""
apps.authentication.schema — Auth App GraphQL Schema
"""
import strawberry
from .queries import AuthQuery
from .mutations import AuthMutation


@strawberry.type
class AuthSchemaQuery(AuthQuery):
    pass


@strawberry.type
class AuthSchemaMutation(AuthMutation):
    pass


auth_schema = strawberry.Schema(query=AuthSchemaQuery, mutation=AuthSchemaMutation)
