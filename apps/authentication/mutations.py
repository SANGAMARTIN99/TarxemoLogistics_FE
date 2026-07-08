"""
apps.authentication.mutations — GraphQL Mutations
==================================================
Handles login, registration, password management, and user admin.
Security features:
  - Account lockout after 5 failed logins (30-minute lockout)
  - Password complexity validation
  - Email verification flow
  - Role never user-assignable
"""
import strawberry
import re
from datetime import timedelta
from typing import Optional, Annotated, Union
from strawberry.types import Info
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserRole, EmailVerificationToken, PasswordResetToken
from .inputs import (
    LoginInput,
    RegisterUserInput,
    CreateUserByAdminInput,
    ChangePasswordInput,
    RequestPasswordResetInput,
    ResetPasswordInput,
    UpdateProfileInput,
)
from .outputs import AuthTokensType, UserType, MessageType, LoginError, VerifyOtpPayload


def _validate_password_strength(password: str) -> None:
    """Enforce strong password policy."""
    if len(password) < 10:
        raise ValueError("Password must be at least 10 characters.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character.")


def _get_tokens_for_user(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


@strawberry.type
class AuthMutation:

    @strawberry.mutation
    def login(
        self, info: Info, input: LoginInput
    ) -> Annotated[Union[AuthTokensType, LoginError], strawberry.union("LoginResult")]:
        """
        Authenticate a user and return JWT tokens.
        - Validates account lockout before attempting auth
        - Records failed login attempts
        - Resets counter on success
        """
        # Sanitize email
        email = input.email.strip().lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return LoginError(code="INVALID_CREDENTIALS", message="Invalid email or password.")

        # Check account lockout
        if user.is_account_locked:
            remaining = (user.account_locked_until - timezone.now()).seconds // 60
            return LoginError(
                code="ACCOUNT_LOCKED",
                message=f"Account is locked. Try again in {remaining} minutes.",
            )

        # Verify password
        if not user.check_password(input.password):
            user.record_failed_login()
            return LoginError(code="INVALID_CREDENTIALS", message="Invalid email or password.")

        if not user.is_active:
            return LoginError(code="ACCOUNT_INACTIVE", message="Your account has been deactivated.")

        if not user.is_verified:
            return LoginError(code="EMAIL_NOT_VERIFIED", message="Please verify your email before logging in.")

        # Success — reset failed counter, generate tokens
        user.reset_failed_logins()
        request = info.context.request
        user.last_login_ip = request.META.get("REMOTE_ADDR", "")
        user.save(update_fields=["last_login_ip"])

        tokens = _get_tokens_for_user(user)
        return AuthTokensType(
            access_token=tokens["access"],
            refresh_token=tokens["refresh"],
            user=user,
        )

    @strawberry.mutation
    def register(self, info: Info, input: RegisterUserInput) -> MessageType:
        """
        Self-registration: creates a CUSTOMER user.
        Role is hardcoded — cannot be chosen by the user.
        """
        # Sanitize
        email = input.email.strip().lower()
        first_name = input.first_name.strip()
        last_name = input.last_name.strip()

        # Validate passwords match
        if input.password != input.confirm_password:
            raise Exception("Passwords do not match.")

        try:
            _validate_password_strength(input.password)
        except ValueError as e:
            raise Exception(str(e))

        # Check uniqueness
        if User.objects.filter(email=email).exists():
            raise Exception("An account with this email already exists.")

        # Create user with CUSTOMER role (server-assigned)
        user = User.objects.create_user(
            email=email,
            password=input.password,
            first_name=first_name,
            last_name=last_name,
            phone_number=input.phone_number or "",
            role=UserRole.CUSTOMER,   # ← Always CUSTOMER for self-registration
            preferred_language=input.preferred_language or "en",
            is_verified=False,
        )

        # Create and send verification email
        _send_verification_email(user)

        return MessageType(
            success=True,
            message="Registration successful. Please check your email to verify your account.",
        )

    @strawberry.mutation
    def create_user_by_admin(self, info: Info, input: CreateUserByAdminInput) -> UserType:
        """
        Admin-only: create a user with a specific role.
        Only SUPER_ADMIN and TENANT_ADMIN can do this.
        """
        current_user = info.context.request.user
        if not current_user.is_authenticated:
            raise Exception("Authentication required.")

        # Validate role
        valid_roles = [r.value for r in UserRole]
        if input.role not in valid_roles:
            raise Exception(f"Invalid role. Must be one of: {', '.join(valid_roles)}")

        # RBAC: TENANT_ADMIN cannot create SUPER_ADMIN
        if current_user.role == "TENANT_ADMIN":
            if input.role in ("SUPER_ADMIN", "TENANT_ADMIN"):
                raise Exception("You cannot assign this role.")
        elif current_user.role != "SUPER_ADMIN":
            raise Exception("Permission denied.")

        email = input.email.strip().lower()
        if User.objects.filter(email=email).exists():
            raise Exception("A user with this email already exists.")

        # Determine tenant
        tenant = None
        if input.tenant_id:
            from apps.tenants.models import Tenant
            try:
                tenant = Tenant.objects.get(id=input.tenant_id)
            except Tenant.DoesNotExist:
                raise Exception("Tenant not found.")
        elif current_user.role == "TENANT_ADMIN":
            tenant = current_user.tenant

        import secrets
        temp_password = secrets.token_urlsafe(16)

        user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=input.first_name.strip(),
            last_name=input.last_name.strip(),
            role=input.role,
            tenant=tenant,
            phone_number=input.phone_number or "",
            is_verified=True,  # Admin-created users skip verification
        )

        # Send invite email with temp password
        _send_invite_email(user, temp_password)

        return user

    @strawberry.mutation
    def verify_email(self, info: Info, token: str) -> MessageType:
        try:
            vt = EmailVerificationToken.objects.get(token=token)
        except EmailVerificationToken.DoesNotExist:
            return MessageType(success=False, message="Invalid verification token.")

        if not vt.is_valid:
            return MessageType(success=False, message="Verification token has expired.")

        vt.user.is_verified = True
        vt.user.save(update_fields=["is_verified"])
        vt.is_used = True
        vt.save(update_fields=["is_used"])

        return MessageType(success=True, message="Email verified successfully. You can now log in.")

    @strawberry.mutation
    def request_password_reset(self, info: Info, input: RequestPasswordResetInput) -> MessageType:
        # Always return success to prevent email enumeration
        email = input.email.strip().lower()
        try:
            user = User.objects.get(email=email, is_active=True)
            _send_password_reset_email(user, info.context.request)
        except User.DoesNotExist:
            pass
        return MessageType(
            success=True,
            message="If an account exists for this email, a reset link has been sent.",
        )

    @strawberry.mutation
    def verify_otp(self, info: Info, email: str, otp: str) -> VerifyOtpPayload:
        email = email.strip().lower()
        try:
            user = User.objects.get(email=email, is_active=True)
            # Find the most recent active OTP for this user
            prt = PasswordResetToken.objects.filter(user=user, is_used=False).order_by('-created_at').first()
            
            if not prt or prt.token != otp:
                return VerifyOtpPayload(success=False, message="Invalid or expired OTP code.")
            
            if not prt.is_valid:
                return VerifyOtpPayload(success=False, message="OTP code has expired.")
            
            return VerifyOtpPayload(
                success=True, 
                message="OTP verified successfully.", 
                reset_token=prt.token
            )
        except User.DoesNotExist:
            return VerifyOtpPayload(success=False, message="Invalid or expired OTP code.")

    @strawberry.mutation
    def reset_password(self, info: Info, input: ResetPasswordInput) -> MessageType:
        try:
            prt = PasswordResetToken.objects.get(token=input.token)
        except PasswordResetToken.DoesNotExist:
            return MessageType(success=False, message="Invalid or expired reset token.")

        if not prt.is_valid:
            return MessageType(success=False, message="Reset token has expired.")

        if input.new_password != input.confirm_password:
            raise Exception("Passwords do not match.")

        try:
            _validate_password_strength(input.new_password)
        except ValueError as e:
            raise Exception(str(e))

        user = prt.user
        user.set_password(input.new_password)
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at"])

        prt.is_used = True
        prt.used_at = timezone.now()
        prt.save(update_fields=["is_used", "used_at"])

        return MessageType(success=True, message="Password has been reset successfully.")

    @strawberry.mutation
    def change_password(self, info: Info, input: ChangePasswordInput) -> MessageType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        if not user.check_password(input.current_password):
            raise Exception("Current password is incorrect.")

        if input.new_password != input.confirm_password:
            raise Exception("New passwords do not match.")

        try:
            _validate_password_strength(input.new_password)
        except ValueError as e:
            raise Exception(str(e))

        user.set_password(input.new_password)
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at"])

        return MessageType(success=True, message="Password changed successfully.")

    @strawberry.mutation
    def update_profile(self, info: Info, input: UpdateProfileInput) -> UserType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise Exception("Authentication required.")

        if input.first_name is not None:
            user.first_name = input.first_name.strip()
        if input.last_name is not None:
            user.last_name = input.last_name.strip()
        if input.phone_number is not None:
            user.phone_number = input.phone_number.strip()
        if input.preferred_language is not None:
            user.preferred_language = input.preferred_language
        if input.timezone is not None:
            user.timezone = input.timezone

        user.save()
        return user

    @strawberry.mutation
    def deactivate_user(self, info: Info, user_id: str) -> MessageType:
        """Admin-only: deactivate a user account."""
        current_user = info.context.request.user
        if not current_user.is_authenticated:
            raise Exception("Authentication required.")
        if current_user.role not in ("SUPER_ADMIN", "TENANT_ADMIN"):
            raise Exception("Permission denied.")

        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise Exception("User not found.")

        # Scope check for TENANT_ADMIN
        if current_user.role == "TENANT_ADMIN" and target.tenant != current_user.tenant:
            raise Exception("Permission denied.")

        target.is_active = False
        target.save(update_fields=["is_active"])

        return MessageType(success=True, message="User deactivated successfully.")


# ─── Helper functions ─────────────────────────────────────────────────────────

def _send_verification_email(user: User):
    from django.core.mail import send_mail
    from django.conf import settings

    token = EmailVerificationToken.objects.create(
        user=user,
        expires_at=timezone.now() + timedelta(hours=24),
    )
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token.token}"
    send_mail(
        subject="Verify your Tarxemo account",
        message=f"Hi {user.first_name},\n\nClick the link to verify your email:\n{verify_url}\n\nThis link expires in 24 hours.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def _send_password_reset_email(user: User, request):
    from django.core.mail import send_mail
    from django.conf import settings

    token = PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() + timedelta(hours=1),
        requester_ip=request.META.get("REMOTE_ADDR", ""),
    )
    send_mail(
        subject="Your Tarxemo Password Reset OTP",
        message=f"Hi {user.first_name},\n\nYou requested a password reset. Here is your 6-digit OTP code:\n\n{token.token}\n\nThis code expires in 1 hour. If you didn't request this, ignore this email.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def _send_invite_email(user: User, temp_password: str):
    from django.core.mail import send_mail
    from django.conf import settings
    send_mail(
        subject="You've been invited to Tarxemo Logistics",
        message=f"Hi {user.first_name},\n\nAn admin has created an account for you on Tarxemo Logistics.\n\nEmail: {user.email}\nTemporary Password: {temp_password}\n\nPlease log in and change your password immediately:\n{settings.FRONTEND_URL}/login",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
