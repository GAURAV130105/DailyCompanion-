"""
ViewSets for the Planner module.
Enforces strict user-scoped access for Daily Plans and Time Blocks.
"""
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.common.permissions import IsOwner
from .models import DailyPlan, TimeBlock
from .serializers import DailyPlanSerializer, TimeBlockSerializer


class DailyPlanViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for user's Daily Plans.
    """

    serializer_class = DailyPlanSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["date", "is_completed"]
    search_fields = ["primary_goal", "notes"]
    ordering_fields = ["date", "daily_score", "created_at"]

    def get_queryset(self):
        return DailyPlan.objects.filter(user=self.request.user).prefetch_related("time_blocks")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Handle plan creation gracefully. If a plan for the specified date already exists
        for this user, update it instead of throwing a unique constraint 400 error.
        """
        date_str = request.data.get("date")
        if date_str:
            existing = DailyPlan.objects.filter(user=request.user, date=date_str).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["get", "post"], url_path="by-date/(?P<plan_date>[0-9]{4}-[0-9]{2}-[0-9]{2})")
    def by_date(self, request, plan_date=None):
        """
        Get or initialize a daily plan for a specific date.
        """
        daily_plan, created = DailyPlan.objects.get_or_create(
            user=request.user,
            date=plan_date,
            defaults={"primary_goal": "Focus on high-priority goals"},
        )
        if request.method == "POST" and request.data:
            serializer = self.get_serializer(daily_plan, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        else:
            serializer = self.get_serializer(daily_plan)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    @action(detail=False, methods=["get", "post"], url_path="today")
    def today(self, request):
        """
        Get or initialize today's daily plan for the authenticated user.
        """
        today_date = timezone.localdate()
        daily_plan, created = DailyPlan.objects.get_or_create(
            user=request.user,
            date=today_date,
            defaults={"primary_goal": "Focus on high-priority goals"},
        )
        serializer = self.get_serializer(daily_plan)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """
        Mark the daily plan as completed.
        """
        daily_plan = self.get_object()
        daily_plan.is_completed = True
        daily_plan.save(update_fields=["is_completed", "updated_at"])
        serializer = self.get_serializer(daily_plan)
        return Response(serializer.data)


class TimeBlockViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for Time Blocks.
    """

    serializer_class = TimeBlockSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["category", "is_completed", "daily_plan"]
    search_fields = ["title"]
    ordering_fields = ["start_time", "end_time", "created_at"]

    def get_queryset(self):
        qs = TimeBlock.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get("date")
        if date_param:
            qs = qs.filter(daily_plan__date=date_param)
        plan_id = self.request.query_params.get("daily_plan") or self.request.query_params.get("plan_id")
        if plan_id:
            qs = qs.filter(daily_plan_id=plan_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="toggle")
    def toggle(self, request, pk=None):
        """
        Toggle the completion status of a time block.
        """
        block = self.get_object()
        block.is_completed = not block.is_completed
        block.save(update_fields=["is_completed", "updated_at"])
        serializer = self.get_serializer(block)
        return Response(serializer.data)
