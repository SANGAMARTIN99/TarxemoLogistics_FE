"""
apps.authentication.outputs — GraphQL Output Types
"""
import strawberry
import strawberry_django
from strawberry import auto
from typing import Optional
from .models import User


@strawberry_django.type(User)
class UserType:
    id: auto
    email: auto
    first_name: auto
    last_name: auto
    phone_number: auto
    role: auto
    is_active: auto
    is_verified: auto
    is_2fa_enabled: auto
    preferred_language: auto
    timezone: auto
    date_joined: auto
    updated_at: auto

    @strawberry_django.field
    def full_name(self) -> str:
        return self.get_full_name()

    @strawberry_django.field
    def tenant_id(self) -> Optional[str]:
        return str(self.tenant_id) if self.tenant_id else None

    @strawberry_django.field
    def tenant_name(self) -> Optional[str]:
        return self.tenant.name if self.tenant else None

    @strawberry_django.field
    def profile_photo_url(self) -> Optional[str]:
        if self.profile_photo:
            return self.profile_photo.url
        return None


@strawberry.type
class AuthTokensType:
    access_token: str
    refresh_token: str
    user: UserType
    token_type: str = "Bearer"


@strawberry.type
class MessageType:
    success: bool
    message: str


@strawberry.type
class LoginError:
    code: str
    message: str


@strawberry.type
class ExistsType:
    exists: bool


from typing import Annotated

LoginResult = Annotated[AuthTokensType | LoginError, strawberry.union("LoginResult")]
