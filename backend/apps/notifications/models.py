"""Notification model."""
from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class Notification(BaseModel):
    TYPE_CHOICES = [
        ("reminder", "Reminder"),
        ("alert", "Alert"),
        ("achievement", "Achievement"),
        ("system", "System"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="reminder")
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.user.username} - {self.title} ({'Read' if self.is_read else 'Unread'})"
