"""
Models for Revision scheduling and spaced repetition.
"""
from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


class RevisionSchedule(BaseModel):
    """
    Spaced repetition revision schedule for a syllabus topic.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="revision_schedules",
    )
    topic = models.ForeignKey(
        "exams.Topic",
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    scheduled_date = models.DateField()
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    interval_days = models.IntegerField(default=1)  # spaced repetition interval
    revision_number = models.IntegerField(default=1)

    class Meta:
        ordering = ["scheduled_date", "completed"]
        verbose_name = "Revision Schedule"
        verbose_name_plural = "Revision Schedules"

    def __str__(self):
        return f"{self.topic.name} on {self.scheduled_date} (Rev #{self.revision_number})"
