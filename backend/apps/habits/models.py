"""
Models for Habits and Habit tracking logs.
"""
from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


class Habit(BaseModel):
    """
    Habit definition with frequency and target metrics.
    """

    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("custom", "Custom"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habits",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default="daily",
    )
    target_days = models.JSONField(default=list)  # ['Mon', 'Tue', ...]
    target_count = models.IntegerField(default=1)
    unit = models.CharField(max_length=50, default="times")
    color = models.CharField(max_length=7, default="#6366f1")
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-is_active", "name"]
        verbose_name = "Habit"
        verbose_name_plural = "Habits"

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class HabitLog(BaseModel):
    """
    Daily log entry for a tracked habit.
    """

    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name="logs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habit_logs",
    )
    date = models.DateField()
    completed = models.BooleanField(default=False)
    value = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ["habit", "date"]
        ordering = ["-date"]
        verbose_name = "Habit Log"
        verbose_name_plural = "Habit Logs"

    def __str__(self):
        return f"{self.habit.name} on {self.date} ({'Done' if self.completed else 'Pending'})"
