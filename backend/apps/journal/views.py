"""Journal views."""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import JournalEntry
from .serializers import JournalEntrySerializer


class JournalEntryViewSet(ModelViewSet):
    """CRUD for private journal entries, scoped to the authenticated user."""

    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user).order_by("-date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="by-date/(?P<date>[0-9]{4}-[0-9]{2}-[0-9]{2})")
    def by_date(self, request, date=None):
        """Retrieve a journal entry for a specific date."""
        try:
            entry = JournalEntry.objects.get(user=request.user, date=date)
            return Response(JournalEntrySerializer(entry).data)
        except JournalEntry.DoesNotExist:
            return Response({"detail": "No entry for this date."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], url_path="mood-trend")
    def mood_trend(self, request):
        """Return mood scores for last 30 days."""
        entries = (
            JournalEntry.objects.filter(user=request.user, mood_score__isnull=False)
            .order_by("-date")[:30]
            .values("date", "mood", "mood_score")
        )
        return Response(list(entries))
