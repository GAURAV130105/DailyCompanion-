"""
Journal Entry model for daily reflection and mood tracking.
Entries are private user data.
"""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import BaseModel


class JournalEntry(BaseModel):
    """
    Daily journal entry with structured reflection fields and mood tracking.
    All content fields are private to the user.
    """

    MOOD_CHOICES = [
        ("great", "Great"),
        ("good", "Good"),
        ("neutral", "Neutral"),
        ("low", "Low"),
        ("bad", "Bad"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="journal_entries",
    )
    date = models.DateField()
    title = models.CharField(max_length=300, blank=True)
    content = models.TextField(blank=True)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, null=True, blank=True)
    mood_score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Mood score from 1 (worst) to 10 (best)",
    )
    achievements = models.TextField(blank=True)
    challenges = models.TextField(blank=True)
    lessons = models.TextField(blank=True)
    tomorrow_goals = models.TextField(blank=True)

    class Meta:
        unique_together = ["user", "date"]
        ordering = ["-date"]
        verbose_name = "Journal Entry"
        verbose_name_plural = "Journal Entries"

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.mood or 'no mood'})"
