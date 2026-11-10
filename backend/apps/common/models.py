"""
Base models for Student Life OS.
Provides UUID primary keys and automated timestamps across all models.
"""
import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model providing:
    - UUID primary key
    - created_at timestamp
    - updated_at timestamp
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUID4) for this record",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the record was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the record was last updated",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]
