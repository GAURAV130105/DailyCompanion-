"""
Models for Productivity score configuration and daily calculated scores.
"""
from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


class ScoreConfig(BaseModel):
    """
    User customizable weighting configuration for daily productivity score calculation.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="score_config",
    )
    study_weight = models.DecimalField(max_digits=5, decimal_places=2, default=30.0)
    task_weight = models.DecimalField(max_digits=5, decimal_places=2, default=25.0)
    habit_weight = models.DecimalField(max_digits=5, decimal_places=2, default=20.0)
    exam_weight = models.DecimalField(max_digits=5, decimal_places=2, default=15.0)
    personal_weight = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)

    class Meta:
        verbose_name = "Score Configuration"
        verbose_name_plural = "Score Configurations"

    def __str__(self):
        return f"ScoreConfig ({self.user.username})"


class ProductivityScore(BaseModel):
    """
    Daily productivity score snapshot (0.0 to 10.0).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="productivity_scores",
    )
    date = models.DateField(db_index=True)
    score = models.DecimalField(max_digits=4, decimal_places=2)  # 0.00 - 10.00
    study_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    task_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    habit_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    exam_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    personal_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    manual_override = models.BooleanField(default=False)
    override_note = models.TextField(blank=True)
    breakdown_json = models.JSONField(default=dict)

    class Meta:
        unique_together = ["user", "date"]
        ordering = ["-date"]
        verbose_name = "Productivity Score"
        verbose_name_plural = "Productivity Scores"

    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.score}/10"
