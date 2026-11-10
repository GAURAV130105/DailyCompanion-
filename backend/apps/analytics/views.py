"""Analytics views — aggregated cross-app statistics."""
from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.study.models import StudySession
from apps.tasks.models import Task
from apps.habits.models import Habit, HabitLog
from apps.scores.models import ProductivityScore
from apps.finance.models import Transaction
from apps.exams.models import ExamProfile, Topic


class OverviewView(APIView):
    """High-level summary stats for the dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        # Total study hours (all time)
        study_total = StudySession.objects.filter(
            user=user, end_time__isnull=False
        ).aggregate(total=Sum("duration_mins"))["total"] or 0

        # Tasks completed this week
        tasks_done = Task.objects.filter(
            user=user, status="completed", completed_at__date__gte=week_ago
        ).count()

        # Average score last 7 days
        avg_score = ProductivityScore.objects.filter(
            user=user, date__gte=week_ago
        ).aggregate(avg=Avg("score"))["avg"]

        # Active habits count
        active_habits = Habit.objects.filter(user=user, is_active=True).count()

        return Response({
            "total_study_hours": round(study_total / 60, 1),
            "tasks_completed_this_week": tasks_done,
            "avg_score_last_7_days": round(float(avg_score), 2) if avg_score else None,
            "active_habits": active_habits,
        })


class StudyTrendsView(APIView):
    """Daily study hours for last N days."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        since = timezone.now().date() - timedelta(days=days)

        from django.db.models.functions import TruncDate
        data = (
            StudySession.objects.filter(user=request.user, start_time__date__gte=since, end_time__isnull=False)
            .annotate(day=TruncDate("start_time"))
            .values("day")
            .annotate(total_mins=Sum("duration_mins"))
            .order_by("day")
        )
        return Response([
            {"date": str(r["day"]), "hours": round((r["total_mins"] or 0) / 60, 2)}
            for r in data
        ])


class ExamProgressView(APIView):
    """Per-exam syllabus completion percentage."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profiles = ExamProfile.objects.filter(user=request.user, is_active=True)
        result = []
        for p in profiles:
            total = Topic.objects.filter(chapter__subject__exam_profile=p).count()
            done = Topic.objects.filter(
                chapter__subject__exam_profile=p, status="completed"
            ).count()
            result.append({
                "exam_id": str(p.id),
                "exam_name": p.exam_name,
                "total_topics": total,
                "completed": done,
                "percent": round(done / total * 100, 1) if total else 0,
            })
        return Response(result)


class ProductivityTrendView(APIView):
    """Daily productivity scores for last N days."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        since = timezone.now().date() - timedelta(days=days)
        scores = ProductivityScore.objects.filter(
            user=request.user, date__gte=since
        ).order_by("date").values("date", "score")
        return Response(list(scores))


class HabitAnalyticsView(APIView):
    """Habit completion rates."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        since = timezone.now().date() - timedelta(days=days)
        habits = Habit.objects.filter(user=request.user, is_active=True)
        result = []
        for h in habits:
            logs = HabitLog.objects.filter(habit=h, date__gte=since)
            total = logs.count()
            done = logs.filter(completed=True).count()
            result.append({
                "habit_id": str(h.id),
                "name": h.name,
                "color": h.color,
                "total_days": total,
                "completed_days": done,
                "completion_rate": round(done / total * 100, 1) if total else 0,
            })
        return Response(result)


class FinanceAnalyticsView(APIView):
    """Monthly income vs expense for last N months."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        months = int(request.query_params.get("months", 6))
        from django.db.models.functions import TruncMonth
        since = timezone.now().date() - timedelta(days=months * 30)
        data = (
            Transaction.objects.filter(user=request.user, date__gte=since)
            .annotate(month=TruncMonth("date"))
            .values("month", "type")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )
        # pivot into {month: {income: x, expense: y}}
        pivot = {}
        for r in data:
            m = str(r["month"])[:7]
            pivot.setdefault(m, {"month": m, "income": 0, "expense": 0})
            pivot[m][r["type"]] = float(r["total"])
        return Response(list(pivot.values()))
