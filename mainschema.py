"""
mainschema.py — Tarxemo Logistics Master GraphQL Schema
========================================================
Combines all app-level Query and Mutation classes into a single
Strawberry schema exposed at /graphql/
"""
import strawberry
from strawberry.schema.config import StrawberryConfig

# ─── App Queries ──────────────────────────────────────────────────────────────
from apps.authentication.queries import AuthQuery
from apps.tenants.queries import TenantQuery
from apps.logistics.queries import LogisticsQuery
from apps.drivers.queries import DriverQuery
from apps.tracking.queries import TrackingQuery
from apps.pricing.queries import PricingQuery
from apps.notifications.queries import NotificationQuery
from apps.payments.queries import PaymentQuery
from chrono_state.schema import ChronoQuery

# ─── App Mutations ────────────────────────────────────────────────────────────
from apps.authentication.mutations import AuthMutation
from apps.tenants.mutations import TenantMutation
from apps.logistics.mutations import LogisticsMutation
from apps.drivers.mutations import DriverMutation
from apps.tracking.mutations import TrackingMutation
from apps.pricing.mutations import PricingMutation
from apps.notifications.mutations import NotificationMutation
from apps.payments.mutations import PaymentMutation
from chrono_state.schema import ChronoMutation


# ─── Unified Query ────────────────────────────────────────────────────────────
@strawberry.type
class Query(
    AuthQuery,
    TenantQuery,
    LogisticsQuery,
    DriverQuery,
    TrackingQuery,
    PricingQuery,
    NotificationQuery,
    PaymentQuery,
    ChronoQuery,
):
    pass


# ─── Unified Mutation ─────────────────────────────────────────────────────────
@strawberry.type
class Mutation(
    AuthMutation,
    TenantMutation,
    LogisticsMutation,
    DriverMutation,
    TrackingMutation,
    PricingMutation,
    NotificationMutation,
    PaymentMutation,
    ChronoMutation,
):
    pass


# ─── Schema ───────────────────────────────────────────────────────────────────
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    config=StrawberryConfig(auto_camel_case=True),
)
