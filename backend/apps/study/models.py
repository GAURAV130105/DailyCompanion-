"""
Models for Study sessions and Pomodoro tracking.
"""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel


class StudySession(BaseModel):
    """
    Tracks time spent studying subjects and topics.
    """

    SESSION_TYPE_CHOICES = [
        ("study", "Study"),
        ("revision", "Revision"),
        ("practice", "Practice"),
        ("mock_test", "Mock Test"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_sessions",
    )
    subject = models.ForeignKey(
        "exams.Subject",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="study_sessions",
    )
    topic = models.ForeignKey(
        "exams.Topic",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="study_sessions",
    )
    session_type = models.CharField(
        max_length=20,
        choices=SESSION_TYPE_CHOICES,
        default="study",
    )
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_mins = models.IntegerField(null=True, blank=True)
    focus_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-start_time"]
        verbose_name = "Study Session"
        verbose_name_plural = "Study Sessions"

    def save(self, *args, **kwargs):
        if self.start_time and self.end_time:
            diff = self.end_time - self.start_time
            self.duration_mins = max(0, int(diff.total_seconds() // 60))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.session_type} ({self.duration_mins or 0}m)"


class PomodoroSession(BaseModel):
    """
    Pomodoro timer session record.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pomodoro_sessions",
    )
    study_session = models.ForeignKey(
        StudySession,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="pomodoros",
    )
    work_mins = models.IntegerField(default=25)
    break_mins = models.IntegerField(default=5)
    cycles_planned = models.IntegerField(default=4)
    cycles_done = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = "Pomodoro Session"
        verbose_name_plural = "Pomodoro Sessions"

    def __str__(self):
        return f"{self.user} - Pomodoro ({self.cycles_done}/{self.cycles_planned})"
