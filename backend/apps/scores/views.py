"""
Views for Productivity scores and scoring configuration.
"""
from datetime import datetime
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwner
from .computation import compute_daily_score
from .models import ProductivityScore, ScoreConfig
from .serializers import ProductivityScoreSerializer, ScoreConfigSerializer


class ProductivityScoreViewSet(viewsets.ModelViewSet):
    """
    ViewSet for daily productivity scores and scoring configuration.
    Supports lookup by date (YYYY-MM-DD).
    """

    serializer_class = ProductivityScoreSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    lookup_field = "date"
    lookup_value_regex = r"\d{4}-\d{2}-\d{2}"
    filterset_fields = ["manual_override"]
    ordering_fields = ["date", "score"]

    def get_queryset(self):
        return ProductivityScore.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        date_str = kwargs.get("date")
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        score_obj = ProductivityScore.objects.filter(
            user=request.user, date=target_date
        ).first()
        if not score_obj:
            score_obj = compute_daily_score(request.user, target_date)
        return Response(self.get_serializer(score_obj).data)

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        today = timezone.localdate()
        score_obj = ProductivityScore.objects.filter(
            user=request.user, date=today
        ).first()
        if not score_obj:
            score_obj = compute_daily_score(request.user, today)
        return Response(self.get_serializer(score_obj).data)

    @action(detail=True, methods=["post"], url_path="compute")
    def compute(self, request, date=None):
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        score_obj = compute_daily_score(request.user, target_date)
        return Response(self.get_serializer(score_obj).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="override")
    def override(self, request, date=None):
        score_obj = self.get_object()
        new_score = request.data.get("score")
        if new_score is None:
            return Response(
                {"detail": "'score' field is required for override."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        score_obj.score = new_score
        score_obj.manual_override = True
        score_obj.override_note = request.data.get("override_note", "")
        score_obj.save(update_fields=["score", "manual_override", "override_note", "updated_at"])
        return Response(self.get_serializer(score_obj).data)

    @action(detail=False, methods=["get", "patch"], url_path="config")
    def config(self, request):
        config_obj, _ = ScoreConfig.objects.get_or_create(user=request.user)
        if request.method == "PATCH":
            serializer = ScoreConfigSerializer(
                config_obj, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(ScoreConfigSerializer(config_obj).data)
