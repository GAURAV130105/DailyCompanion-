"""
Views for Revision scheduling and spaced repetition.
"""
from datetime import timedelta
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwner
from .models import RevisionSchedule
from .serializers import RevisionScheduleSerializer


class RevisionScheduleViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for spaced repetition revision schedules.
    """

    serializer_class = RevisionScheduleSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["scheduled_date", "completed", "topic"]
    ordering_fields = ["scheduled_date", "revision_number", "created_at"]

    def get_queryset(self):
        return (
            RevisionSchedule.objects.filter(user=self.request.user)
            .select_related("topic__chapter__subject")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """
        Mark revision complete and optionally schedule the next spaced repetition interval.
        """
        schedule = self.get_object()
        schedule.completed = True
        schedule.completed_at = timezone.now()
        schedule.save(update_fields=["completed", "completed_at", "updated_at"])

        # Spaced repetition: intervals 1 -> 3 -> 7 -> 14 -> 30 days
        auto_schedule_next = request.data.get("auto_schedule_next", True)
        next_schedule = None
        if auto_schedule_next and schedule.revision_number < 5:
            interval_progression = [1, 3, 7, 14, 30]
            curr_idx = min(schedule.revision_number - 1, len(interval_progression) - 1)
            next_interval = (
                interval_progression[curr_idx + 1]
                if curr_idx + 1 < len(interval_progression)
                else schedule.interval_days * 2
            )
            next_date = timezone.localdate() + timedelta(days=next_interval)
            next_schedule = RevisionSchedule.objects.create(
                user=schedule.user,
                topic=schedule.topic,
                scheduled_date=next_date,
                interval_days=next_interval,
                revision_number=schedule.revision_number + 1,
            )

        data = {
            "completed": self.get_serializer(schedule).data,
            "next_schedule": (
                self.get_serializer(next_schedule).data if next_schedule else None
            ),
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="due-today")
    def due_today(self, request):
        """
        Returns revisions due on or before today that are not yet completed.
        """
        today = timezone.localdate()
        schedules = self.get_queryset().filter(
            scheduled_date__lte=today,
            completed=False,
        )
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)
