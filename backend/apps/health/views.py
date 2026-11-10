"""Health views."""
from django.db.models import Avg
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import HealthLog
from .serializers import HealthLogSerializer


class HealthLogViewSet(ModelViewSet):
    """CRUD for daily health logs, scoped to the authenticated user."""

    serializer_class = HealthLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["date"]

    def get_queryset(self):
        return HealthLog.objects.filter(user=self.request.user).order_by("-date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Return 7-day and 30-day averages for key health metrics."""
        from django.utils import timezone
        from datetime import timedelta

        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        def avg_for_range(start):
            return HealthLog.objects.filter(
                user=request.user, date__gte=start
            ).aggregate(
                avg_sleep=Avg("sleep_hours"),
                avg_water=Avg("water_ml"),
                avg_exercise=Avg("exercise_mins"),
                avg_steps=Avg("steps"),
                avg_weight=Avg("weight_kg"),
            )

        return Response({
            "week": avg_for_range(week_ago),
            "month": avg_for_range(month_ago),
        })
