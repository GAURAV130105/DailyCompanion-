"""
Views for Habits, habit logs, and streak computation.
"""
from datetime import timedelta
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwner
from .models import Habit, HabitLog
from .serializers import HabitLogSerializer, HabitSerializer


def compute_streaks_for_habit(habit):
    logs = habit.logs.filter(completed=True).values_list("date", flat=True).order_by("date")
    dates = sorted(set(logs))
    if not dates:
        return {"current_streak": 0, "best_streak": 0, "completed_today": False}

    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    date_set = set(dates)
    completed_today = today in date_set

    # Current streak
    current_streak = 0
    check_date = today if completed_today else yesterday
    while check_date in date_set:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Best streak
    best_streak = 0
    streak = 0
    prev_date = None
    for d in dates:
        if prev_date is None or d == prev_date + timedelta(days=1):
            streak += 1
        elif d == prev_date:
            continue
        else:
            streak = 1
        prev_date = d
        if streak > best_streak:
            best_streak = streak

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "completed_today": completed_today,
    }


class HabitViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for habits with streak analytics and daily check-ins.
    """

    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["frequency", "is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="streaks")
    def streaks(self, request):
        """
        Returns streak metrics (current streak, best streak, completed today) for all habits.
        """
        habits = self.get_queryset()
        result = []
        for habit in habits:
            streak_info = compute_streaks_for_habit(habit)
            result.append(
                {
                    "habit_id": str(habit.id),
                    "habit_name": habit.name,
                    "color": habit.color,
                    "frequency": habit.frequency,
                    "target_count": habit.target_count,
                    "unit": habit.unit,
                    **streak_info,
                }
            )
        return Response(result)

    @action(detail=True, methods=["post"], url_path="toggle-today")
    def toggle_today(self, request, pk=None):
        """
        Quick check-in or uncheck for today's habit log.
        """
        habit = self.get_object()
        today = timezone.localdate()
        log, created = HabitLog.objects.get_or_create(
            habit=habit,
            date=today,
            defaults={"user": request.user, "completed": True, "value": 1},
        )
        if not created:
            log.completed = not log.completed
            log.save(update_fields=["completed", "updated_at"])

        streak_info = compute_streaks_for_habit(habit)
        return Response(
            {
                "log": HabitLogSerializer(log).data,
                **streak_info,
            },
            status=status.HTTP_200_OK,
        )


class HabitLogViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for historical habit logs.
    """

    serializer_class = HabitLogSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["habit", "date", "completed"]
    ordering_fields = ["date", "created_at"]

    def get_queryset(self):
        return HabitLog.objects.filter(user=self.request.user).select_related("habit")

    def perform_create(self, serializer):
        habit = serializer.validated_data.get("habit")
        if habit.user != self.request.user:
            raise PermissionError("Cannot log habit for another user.")
        serializer.save(user=self.request.user)
