"""AI Assistant conversation model."""
from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class AIConversation(BaseModel):
    """Stores chat history between user and AI assistant."""

    CONTEXT_CHOICES = [
        ("general", "General"),
        ("schedule", "Schedule Planning"),
        ("exam", "Exam Preparation"),
        ("finance", "Finance"),
        ("health", "Health"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
    )
    title = models.CharField(max_length=300, default="New Conversation")
    context_type = models.CharField(max_length=20, choices=CONTEXT_CHOICES, default="general")
    messages = models.JSONField(default=list, help_text="List of {role, content, timestamp} dicts")

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "AI Conversation"
        verbose_name_plural = "AI Conversations"

    def __str__(self):
        return f"{self.user.username} - {self.title}"
