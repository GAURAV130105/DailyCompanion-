"""Notes model for knowledge management."""
from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class Note(BaseModel):
    """A personal note optionally linked to an exam subject or topic."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    title = models.CharField(max_length=300)
    content = models.TextField(blank=True)
    subject = models.ForeignKey(
        "exams.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes",
    )
    topic = models.ForeignKey(
        "exams.Topic",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_notes",
    )

    tags = models.JSONField(default=list)
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_pinned", "-updated_at"]
        verbose_name = "Note"
        verbose_name_plural = "Notes"

    def __str__(self):
        return f"{self.user.username} - {self.title}"
