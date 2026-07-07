"""
apps.authentication.queries — GraphQL Queries
"""
import strawberry
from typing import Optional, List
from strawberry.types import Info
from .outputs import UserType
from .models import User


def require_authenticated(info: Info) -> User:
    user = info.context.request.user
    if not user.is_authenticated:
        raise Exception("Authentication required.")
    return user


@strawberry.type
class AuthQuery:

    @strawberry.field
    def me(self, info: Info) -> Optional[UserType]:
        """Return the authenticated user's profile."""
        user = info.context.request.user
        if not user.is_authenticated:
            return None
        return user

    @strawberry.field
    def users(
        self,
        info: Info,
        role: Optional[str] = None,
        tenant_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> List[UserType]:
        """
        List users. Accessible by SUPER_ADMIN (all users) or
        TENANT_ADMIN (tenant's users only).
        """
        current_user = require_authenticated(info)

        if current_user.role == "SUPER_ADMIN":
            qs = User.objects.all()
        elif current_user.role in ("TENANT_ADMIN", "OPERATIONS_MANAGER"):
            qs = User.objects.filter(tenant=current_user.tenant)
        else:
            raise Exception("Permission denied.")

        if role:
            qs = qs.filter(role=role)
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        if search:
            qs = qs.filter(
                models.Q(email__icontains=search)
                | models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
            )

        offset = (page - 1) * page_size
        return list(qs[offset: offset + page_size])

    @strawberry.field
    def user_by_id(self, info: Info, user_id: str) -> Optional[UserType]:
        current_user = require_authenticated(info)
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

        # Scope check
        if current_user.role == "SUPER_ADMIN":
            return target
        if current_user.role in ("TENANT_ADMIN", "OPERATIONS_MANAGER"):
            if target.tenant == current_user.tenant:
                return target
        if str(current_user.id) == user_id:
            return target

        raise Exception("Permission denied.")
