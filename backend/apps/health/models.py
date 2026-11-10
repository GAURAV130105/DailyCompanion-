"""Health & Fitness tracking model."""
from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class HealthLog(BaseModel):
    """Daily health metrics log per user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="health_logs",
    )
    date = models.DateField()
    sleep_hours = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    water_ml = models.IntegerField(null=True, blank=True, help_text="Water intake in millilitres")
    exercise_mins = models.IntegerField(null=True, blank=True)
    exercise_type = models.CharField(max_length=100, blank=True)
    steps = models.IntegerField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ["user", "date"]
        ordering = ["-date"]
        verbose_name = "Health Log"
        verbose_name_plural = "Health Logs"

    def __str__(self):
        return f"{self.user.username} health log - {self.date}"
