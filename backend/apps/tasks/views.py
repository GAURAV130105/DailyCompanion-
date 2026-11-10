"""
ViewSets for the Tasks module.
Enforces user isolation across tasks, tags, and subtasks.
"""
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.common.permissions import IsOwner
from .models import SubTask, Task, TaskTag
from .serializers import SubTaskSerializer, TaskSerializer, TaskTagSerializer


class TaskTagViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for managing personal task tags.
    """

    serializer_class = TaskTagSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        return TaskTag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for student tasks with filtering by status, priority, and tags.
    """

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["priority", "status", "is_recurring", "tags"]
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "priority", "status", "created_at"]

    def get_queryset(self):
        return (
            Task.objects.filter(user=self.request.user)
            .prefetch_related("tags", "subtasks")
            .select_related("user")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """
        Mark a task as completed.
        """
        task = self.get_object()
        task.mark_completed()
        serializer = self.get_serializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen(self, request, pk=None):
        """
        Reopen a task back to todo status.
        """
        task = self.get_object()
        task.mark_reopened()
        serializer = self.get_serializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubTaskViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for checklist subtasks attached to a parent task.
    """

    serializer_class = SubTaskSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["task", "is_completed"]
    search_fields = ["title"]
    ordering_fields = ["order", "created_at"]

    def get_queryset(self):
        return SubTask.objects.filter(task__user=self.request.user)

    def perform_create(self, serializer):
        task = serializer.validated_data["task"]
        if task.user != self.request.user:
            raise PermissionError("Cannot add subtask to another user's task.")
        serializer.save()

    @action(detail=True, methods=["post"], url_path="toggle")
    def toggle(self, request, pk=None):
        """
        Toggle subtask completion.
        """
        subtask = self.get_object()
        subtask.is_completed = not subtask.is_completed
        subtask.save(update_fields=["is_completed", "updated_at"])
        serializer = self.get_serializer(subtask)
        return Response(serializer.data, status=status.HTTP_200_OK)
