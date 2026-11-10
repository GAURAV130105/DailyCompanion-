"""
Models for the Daily Planner module.
Enables students to define daily goals, notes, and hourly time blocks.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel


class DailyPlan(BaseModel):
    """
    Daily schedule plan for a user on a given calendar date.
    Each user has at most one DailyPlan per date.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_plans",
        help_text="User who owns this daily plan",
    )
    date = models.DateField(
        default=timezone.now,
        help_text="The date of the plan",
    )
    primary_goal = models.CharField(
        max_length=255,
        blank=True,
        help_text="Primary objective or MIT (Most Important Task) for the day",
    )
    notes = models.TextField(
        blank=True,
        help_text="End-of-day reflections or general notes",
    )
    daily_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Computed or self-assigned productivity score (0-100)",
    )
    is_completed = models.BooleanField(
        default=False,
        help_text="Whether this day's plan has been completed and reviewed",
    )

    class Meta:
        ordering = ["-date"]
        unique_together = ("user", "date")
        verbose_name = "Daily Plan"
        verbose_name_plural = "Daily Plans"

    def __str__(self) -> str:
        return f"{self.user.email} - {self.date}"


class TimeBlock(BaseModel):
    """
    Individual block of time allocated to an activity during the day.
    """

    CATEGORY_CHOICES = [
        ("study", "Study / Deep Work"),
        ("lecture", "Class / Lecture"),
        ("break", "Rest / Break"),
        ("exercise", "Workout / Exercise"),
        ("chore", "Chores / Errands"),
        ("personal", "Personal Time"),
        ("exam", "Exam / Test"),
        ("task", "Task / To-Do"),
        ("meal", "Meal"),
        ("sleep", "Sleep"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="time_blocks",
        help_text="User who owns this time block",
    )
    daily_plan = models.ForeignKey(
        DailyPlan,
        on_delete=models.CASCADE,
        related_name="time_blocks",
        null=True,
        blank=True,
        help_text="Optional link to a specific DailyPlan",
    )
    title = models.CharField(
        max_length=255,
        help_text="Title or label for the time block",
    )
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="study",
        help_text="Category of activity",
    )
    start_time = models.TimeField(
        help_text="Scheduled start time",
    )
    end_time = models.TimeField(
        help_text="Scheduled end time",
    )
    is_completed = models.BooleanField(
        default=False,
        help_text="Status indicating whether this block was completed",
    )
    color = models.CharField(
        max_length=20,
        default="#3B82F6",
        blank=True,
        help_text="Display color hex code for calendar UI",
    )

    class Meta:
        ordering = ["start_time"]
        verbose_name = "Time Block"
        verbose_name_plural = "Time Blocks"

    def __str__(self) -> str:
        return f"{self.title} ({self.start_time} - {self.end_time})"
