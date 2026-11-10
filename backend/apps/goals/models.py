"""
Models for Goals and Milestones tracking.
"""
from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


class Goal(BaseModel):
    """
    High-level goal with target deadlines and milestone progression.
    """

    CATEGORY_CHOICES = [
        ("academic", "Academic"),
        ("exam", "Exam"),
        ("health", "Health"),
        ("finance", "Finance"),
        ("skill", "Skill"),
        ("personal", "Personal"),
        ("career", "Career"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("abandoned", "Abandoned"),
        ("paused", "Paused"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="goals",
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default="academic",
    )
    target_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    exam_profile = models.ForeignKey(
        "exams.ExamProfile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="goals",
    )

    class Meta:
        ordering = ["-status", "target_date"]
        verbose_name = "Goal"
        verbose_name_plural = "Goals"

    def __str__(self):
        return self.title

    def recalculate_progress(self):
        milestones = self.milestones.all()
        total = milestones.count()
        if total > 0:
            done = milestones.filter(completed=True).count()
            self.progress = round((done / total) * 100.0, 2)
            if self.progress >= 100.0:
                self.status = "completed"
            elif self.status == "completed" and self.progress < 100.0:
                self.status = "active"
            self.save(update_fields=["progress", "status", "updated_at"])


class Milestone(BaseModel):
    """
    Intermediate milestone supporting a parent goal.
    """

    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name="milestones",
    )
    title = models.CharField(max_length=300)
    target_date = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "target_date", "created_at"]
        verbose_name = "Milestone"
        verbose_name_plural = "Milestones"

    def __str__(self):
        return f"{self.goal.title} -> {self.title}"
