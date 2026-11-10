"""
Views for Study sessions and Pomodoro tracking.
"""
from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwner
from .models import PomodoroSession, StudySession
from .serializers import PomodoroSessionSerializer, StudySessionSerializer


class StudySessionViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for study sessions with start/stop actions and statistics.
    """

    serializer_class = StudySessionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["session_type", "subject", "topic"]
    search_fields = ["notes", "subject__name", "topic__name"]
    ordering_fields = ["start_time", "duration_mins", "focus_rating"]

    def get_queryset(self):
        return (
            StudySession.objects.filter(user=self.request.user)
            .select_related("subject", "topic")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"], url_path="start")
    def start(self, request):
        """
        Quick-start a study session.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(
            user=request.user,
            start_time=request.data.get("start_time", timezone.now()),
        )
        return Response(self.get_serializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="stop")
    def stop(self, request, pk=None):
        """
        End an active study session.
        """
        session = self.get_object()
        session.end_time = timezone.now()
        if "focus_rating" in request.data:
            session.focus_rating = request.data["focus_rating"]
        if "notes" in request.data:
            session.notes = request.data["notes"]
        session.save()
        return Response(self.get_serializer(session).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        Summary statistics for study sessions.
        """
        qs = self.get_queryset()
        today = timezone.localdate()
        today_start = timezone.datetime.combine(today, timezone.datetime.min.time(), tzinfo=timezone.get_current_timezone())

        total_mins = qs.aggregate(Sum("duration_mins"))["duration_mins__sum"] or 0
        today_mins = (
            qs.filter(start_time__gte=today_start).aggregate(Sum("duration_mins"))[
                "duration_mins__sum"
            ]
            or 0
        )
        avg_focus = qs.aggregate(Avg("focus_rating"))["focus_rating__avg"] or 0
        total_sessions = qs.count()

        return Response(
            {
                "total_study_minutes": total_mins,
                "total_study_hours": round(total_mins / 60.0, 2),
                "today_study_minutes": today_mins,
                "today_study_hours": round(today_mins / 60.0, 2),
                "avg_focus_rating": round(avg_focus, 2),
                "total_sessions": total_sessions,
            }
        )


class PomodoroSessionViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Pomodoro timer cycles.
    """

    serializer_class = PomodoroSessionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["is_active"]
    ordering_fields = ["started_at", "cycles_done"]

    def get_queryset(self):
        return PomodoroSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="complete-cycle")
    def complete_cycle(self, request, pk=None):
        pomodoro = self.get_object()
        pomodoro.cycles_done += 1
        if pomodoro.cycles_done >= pomodoro.cycles_planned:
            pomodoro.is_active = False
            pomodoro.ended_at = timezone.now()
        pomodoro.save()
        return Response(self.get_serializer(pomodoro).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="stop")
    def stop(self, request, pk=None):
        pomodoro = self.get_object()
        pomodoro.is_active = False
        pomodoro.ended_at = timezone.now()
        pomodoro.save()
        return Response(self.get_serializer(pomodoro).data, status=status.HTTP_200_OK)
