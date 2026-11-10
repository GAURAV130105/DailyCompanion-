"""
Serializers for the Tasks module.
"""
from rest_framework import serializers
from .models import SubTask, Task, TaskTag


class TaskTagSerializer(serializers.ModelSerializer):
    """Serializer for TaskTag model."""

    user = serializers.ReadOnlyField(source="user.email")

    class Meta:
        model = TaskTag
        fields = [
            "id",
            "user",
            "name",
            "color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class SubTaskSerializer(serializers.ModelSerializer):
    """Serializer for SubTask checklist items."""

    class Meta:
        model = SubTask
        fields = [
            "id",
            "task",
            "title",
            "is_completed",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TaskSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for Task with nested tags and subtasks."""

    user = serializers.ReadOnlyField(source="user.email")
    subtasks = SubTaskSerializer(many=True, read_only=True)
    tags_detail = TaskTagSerializer(source="tags", many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        required=False,
        queryset=TaskTag.objects.all(),
        source="tags",
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "user",
            "title",
            "description",
            "priority",
            "status",
            "due_date",
            "estimated_minutes",
            "actual_minutes",
            "tags",
            "tag_ids",
            "tags_detail",
            "is_recurring",
            "recurrence_pattern",
            "completed_at",
            "subtasks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "tags", "completed_at", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Scope tag queryset to the requesting user
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            self.fields["tag_ids"].child_relation.queryset = TaskTag.objects.filter(user=request.user)
