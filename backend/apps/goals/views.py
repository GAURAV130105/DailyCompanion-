"""
Views for Goals and Milestones.
"""
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwner
from .models import Goal, Milestone
from .serializers import GoalSerializer, MilestoneSerializer


class GoalViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for personal student goals.
    """

    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["category", "status", "exam_profile"]
    search_fields = ["title", "description"]
    ordering_fields = ["target_date", "progress", "created_at"]

    def get_queryset(self):
        return (
            Goal.objects.filter(user=self.request.user)
            .select_related("exam_profile")
            .prefetch_related("milestones")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for milestones linked to goals.
    """

    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["goal", "completed"]
    search_fields = ["title"]
    ordering_fields = ["order", "target_date"]

    def get_queryset(self):
        return Milestone.objects.filter(goal__user=self.request.user).select_related(
            "goal"
        )

    def perform_create(self, serializer):
        goal = serializer.validated_data.get("goal")
        if goal.user != self.request.user:
            raise PermissionError("Cannot add milestone to another user's goal.")
        milestone = serializer.save()
        goal.recalculate_progress()

    def perform_destroy(self, instance):
        goal = instance.goal
        super().perform_destroy(instance)
        goal.recalculate_progress()

    @action(detail=True, methods=["post"], url_path="toggle")
    def toggle(self, request, pk=None):
        """
        Toggle milestone completion and update parent goal progress.
        """
        milestone = self.get_object()
        milestone.completed = not milestone.completed
        milestone.completed_at = timezone.now() if milestone.completed else None
        milestone.save(update_fields=["completed", "completed_at", "updated_at"])
        milestone.goal.recalculate_progress()
        return Response(self.get_serializer(milestone).data, status=status.HTTP_200_OK)
