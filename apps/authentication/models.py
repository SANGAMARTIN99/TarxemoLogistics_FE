"""
apps.authentication.models — Custom User Model
================================================
Role-based user model. Roles are NEVER user-selected — assigned by admins only.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone as dj_timezone


class UserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    TENANT_ADMIN = "TENANT_ADMIN", "Tenant Admin"
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER", "Operations Manager"
    FINANCE_OFFICER = "FINANCE_OFFICER", "Finance Officer"
    DRIVER = "DRIVER", "Driver"
    CUSTOMER = "CUSTOMER", "Customer"
    VIEWER = "VIEWER", "Viewer"


class UserManager(BaseUserManager):

    def create_user(self, email: str, password: str = None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("role", UserRole.SUPER_ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with role-based access control.
    Roles are assigned server-side only — never chosen by the user.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ─── Core identity ────────────────────────────────────────────────────────
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True)
    profile_photo = models.ImageField(upload_to="users/photos/", null=True, blank=True)

    # ─── Role (server-assigned, never user-chosen) ────────────────────────────
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True,
    )

    # ─── Tenant association ───────────────────────────────────────────────────
    tenant = models.ForeignKey(
        "tenants.Tenant",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
        help_text="Null for SUPER_ADMIN users",
    )

    # ─── Account status ───────────────────────────────────────────────────────
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(
        default=False,
        help_text="Email verification status",
    )

    # ─── 2FA ─────────────────────────────────────────────────────────────────
    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, blank=True)

    # ─── Security tracking ────────────────────────────────────────────────────
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)

    # ─── Preferences ─────────────────────────────────────────────────────────
    preferred_language = models.CharField(max_length=10, default="en")
    timezone = models.CharField(max_length=50, default="UTC")
    notification_preferences = models.JSONField(default=dict, blank=True)

    # ─── Timestamps ──────────────────────────────────────────────────────────
    date_joined = models.DateTimeField(default=dj_timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        db_table = "auth_user"
        ordering = ["email"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}> [{self.role}]"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_account_locked(self) -> bool:
        if self.account_locked_until is None:
            return False
        return dj_timezone.now() < self.account_locked_until

    def record_failed_login(self):
        """Increment failed login counter and lock account after 5 attempts."""
        from datetime import timedelta
        self.failed_login_attempts += 1
        self.last_failed_login = dj_timezone.now()
        if self.failed_login_attempts >= 5:
            self.account_locked_until = dj_timezone.now() + timedelta(minutes=30)
        self.save(update_fields=["failed_login_attempts", "last_failed_login", "account_locked_until"])

    def reset_failed_logins(self):
        self.failed_login_attempts = 0
        self.account_locked_until = None
        self.save(update_fields=["failed_login_attempts", "account_locked_until"])

    def has_role(self, *roles) -> bool:
        return self.role in roles

    @property
    def is_super_admin(self) -> bool:
        return self.role == UserRole.SUPER_ADMIN

    @property
    def is_tenant_admin(self) -> bool:
        return self.role == UserRole.TENANT_ADMIN

    @property
    def is_driver(self) -> bool:
        return self.role == UserRole.DRIVER

    @property
    def is_customer(self) -> bool:
        return self.role == UserRole.CUSTOMER


class EmailVerificationToken(models.Model):
    """One-time token for email verification."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "auth_email_verification_token"

    @property
    def is_valid(self) -> bool:
        return not self.is_used and dj_timezone.now() < self.expires_at


class PasswordResetToken(models.Model):
    """Secure password reset token (single-use, time-limited)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    requester_ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = "auth_password_reset_token"

    @property
    def is_valid(self) -> bool:
        return not self.is_used and dj_timezone.now() < self.expires_at
