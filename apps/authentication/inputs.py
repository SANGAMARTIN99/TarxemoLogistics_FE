"""
apps.authentication.inputs — GraphQL Input Types
"""
import strawberry
from typing import Optional


@strawberry.input
class LoginInput:
    email: str
    password: str


@strawberry.input
class RegisterUserInput:
    """
    User registration input.
    NOTE: Role is NOT included — roles are server-assigned only.
    """
    email: str
    first_name: str
    last_name: str
    password: str
    confirm_password: str
    phone_number: Optional[str] = None
    preferred_language: Optional[str] = "en"


@strawberry.input
class CreateUserByAdminInput:
    """Used by TENANT_ADMIN / SUPER_ADMIN to invite a user with a specific role."""
    email: str
    first_name: str
    last_name: str
    role: str            # Validated server-side against UserRole choices
    tenant_id: Optional[str] = None
    phone_number: Optional[str] = None


@strawberry.input
class ChangePasswordInput:
    current_password: str
    new_password: str
    confirm_password: str


@strawberry.input
class RequestPasswordResetInput:
    email: str


@strawberry.input
class ResetPasswordInput:
    token: str
    new_password: str
    confirm_password: str


@strawberry.input
class UpdateProfileInput:
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    preferred_language: Optional[str] = None
    timezone: Optional[str] = None
