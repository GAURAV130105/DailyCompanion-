"""
User model for Student Life OS.
Defines custom User with UUID primary key, profile attributes, and study preferences.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Primary User model for Student Life OS.
    Uses UUID primary key and email as the primary identification key.
    """

    THEME_CHOICES = [
        ("light", "Light"),
        ("dark", "Dark"),
        ("system", "System"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the user",
    )
    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="Primary email address used for login",
    )
    username = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Optional display handle",
    )
    first_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="User's first name",
    )
    last_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="User's last name",
    )
    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
        help_text="Profile picture image file",
    )
    bio = models.TextField(
        blank=True,
        help_text="Short student biography or academic bio",
    )
    user_timezone = models.CharField(
        max_length=50,
        default="Asia/Kolkata",
        help_text="User's local timezone (e.g. Asia/Kolkata, America/New_York)",
    )


    # Preferences & Study Settings
    daily_study_goal_minutes = models.PositiveIntegerField(
        default=240,
        help_text="Daily target study duration in minutes (default 4 hours)",
    )
    pomodoro_work_duration = models.PositiveIntegerField(
        default=25,
        help_text="Focus interval duration in minutes",
    )
    pomodoro_short_break = models.PositiveIntegerField(
        default=5,
        help_text="Short break duration in minutes",
    )
    pomodoro_long_break = models.PositiveIntegerField(
        default=15,
        help_text="Long break duration in minutes",
    )
    theme = models.CharField(
        max_length=20,
        choices=THEME_CHOICES,
        default="system",
        help_text="UI theme preference",
    )

    # Standard Django user fields
    is_staff = models.BooleanField(
        default=False,
        help_text="Designates whether the user can log into admin site",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user account should be treated as active",
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        help_text="Date and time when user registered",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when account was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when account was last updated",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        """Return user's full name or email if name is empty."""
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email
