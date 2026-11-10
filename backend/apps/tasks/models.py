"""
Models for the Tasks module.
Supports hierarchical subtasks, custom user tags, recurrence, and priorities.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel


class TaskTag(BaseModel):
    """
    User-defined tag for organizing and filtering tasks.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_tags",
        help_text="User who created this tag",
    )
    name = models.CharField(
        max_length=50,
        help_text="Tag label",
    )
    color = models.CharField(
        max_length=20,
        default="#3B82F6",
        help_text="Hex color code for the tag badge",
    )

    class Meta:
        ordering = ["name"]
        unique_together = ("user", "name")
        verbose_name = "Task Tag"
        verbose_name_plural = "Task Tags"

    def __str__(self) -> str:
        return self.name


class Task(BaseModel):
    """
    Core Task model representing an actionable item for the student.
    """

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    RECURRENCE_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
        help_text="User who owns this task",
    )
    title = models.CharField(
        max_length=255,
        help_text="Descriptive title of the task",
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed notes or instructions for the task",
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="medium",
        db_index=True,
        help_text="Task urgency/importance level",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="todo",
        db_index=True,
        help_text="Current execution status",
    )
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Optional deadline for the task",
    )
    estimated_minutes = models.PositiveIntegerField(
        default=30,
        help_text="Estimated time in minutes to complete this task",
    )
    actual_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Actual tracked time spent in minutes",
    )
    tags = models.ManyToManyField(
        TaskTag,
        blank=True,
        related_name="tasks",
        help_text="Tags associated with this task",
    )
    is_recurring = models.BooleanField(
        default=False,
        help_text="Whether this task automatically recurs",
    )
    recurrence_pattern = models.CharField(
        max_length=20,
        choices=RECURRENCE_CHOICES,
        null=True,
        blank=True,
        help_text="Recurrence frequency if is_recurring is True",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the task was marked completed",
    )

    class Meta:
        ordering = ["status", "due_date", "-priority", "-created_at"]
        verbose_name = "Task"
        verbose_name_plural = "Tasks"

    def __str__(self) -> str:
        return self.title

    def mark_completed(self):
        """Mark task as completed and record timestamp."""
        self.status = "completed"
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "completed_at", "updated_at"])

    def mark_reopened(self):
        """Reopen a previously completed or cancelled task."""
        self.status = "todo"
        self.completed_at = None
        self.save(update_fields=["status", "completed_at", "updated_at"])


class SubTask(BaseModel):
    """
    Subtask checklist item within a parent Task.
    """

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subtasks",
        help_text="Parent task",
    )
    title = models.CharField(
        max_length=255,
        help_text="Subtask description",
    )
    is_completed = models.BooleanField(
        default=False,
        help_text="Completion flag for this subtask item",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order within the parent task",
    )

    class Meta:
        ordering = ["order", "created_at"]
        verbose_name = "SubTask"
        verbose_name_plural = "SubTasks"

    def __str__(self) -> str:
        return f"{self.task.title} -> {self.title}"
