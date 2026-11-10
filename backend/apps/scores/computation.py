"""
Computation engine for daily productivity scores.
"""
from datetime import datetime, time
from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from .models import ProductivityScore, ScoreConfig


def compute_daily_score(user, target_date):
    """
    Computes or updates the ProductivityScore for a given user and date.
    Returns the ProductivityScore instance.
    """
    # 1. Study score (Target: 6 hours = 10.0)
    try:
        from apps.study.models import StudySession

        start_of_day = timezone.make_aware(datetime.combine(target_date, time.min))
        end_of_day = timezone.make_aware(datetime.combine(target_date, time.max))

        sessions = StudySession.objects.filter(
            user=user,
            start_time__gte=start_of_day,
            start_time__lte=end_of_day,
        )
        total_mins = sessions.aggregate(Sum("duration_mins"))["duration_mins__sum"] or 0
        study_hours = total_mins / 60.0
        study_score = min(10.0, round((study_hours / 6.0) * 10.0, 2))
    except Exception:
        study_score = 0.0
        study_hours = 0.0

    # 2. Task score
    try:
        from apps.tasks.models import Task

        tasks_due = Task.objects.filter(user=user, due_date__date=target_date)
        if tasks_due.exists():
            completed_due = tasks_due.filter(status="completed").count()
            task_score = min(10.0, round((completed_due / tasks_due.count()) * 10.0, 2))
        else:
            completed_today = Task.objects.filter(
                user=user, completed_at__date=target_date
            ).count()
            task_score = 10.0 if completed_today > 0 else 7.5
    except Exception:
        task_score = 5.0

    # 3. Habit score
    try:
        from apps.habits.models import Habit, HabitLog

        active_habits = Habit.objects.filter(user=user, is_active=True).count()
        if active_habits > 0:
            completed_habits = HabitLog.objects.filter(
                user=user, date=target_date, completed=True
            ).count()
            habit_score = min(10.0, round((completed_habits / active_habits) * 10.0, 2))
        else:
            habit_score = 8.0
    except Exception:
        habit_score = 5.0

    # 4. Exam score
    try:
        from apps.exams.models import MockTest
        from apps.revision.models import RevisionSchedule

        revisions_due = RevisionSchedule.objects.filter(
            user=user, scheduled_date=target_date
        )
        tests = MockTest.objects.filter(user=user, test_date=target_date).count()
        if revisions_due.exists():
            rev_done = revisions_due.filter(completed=True).count()
            base_score = (rev_done / revisions_due.count()) * 8.0
            exam_score = min(10.0, round(base_score + (2.0 if tests > 0 else 0.0), 2))
        elif tests > 0:
            exam_score = 10.0
        else:
            exam_score = 7.0
    except Exception:
        exam_score = 5.0

    # 5. Personal / Wellness score
    try:
        from apps.health.models import HealthLog
        from apps.journal.models import JournalEntry

        has_journal = JournalEntry.objects.filter(user=user, date=target_date).exists()
        has_health = HealthLog.objects.filter(user=user, date=target_date).exists()
        personal_score = (5.0 if has_journal else 0.0) + (5.0 if has_health else 0.0)
    except Exception:
        personal_score = 5.0

    # Fetch or create user's ScoreConfig
    config, _ = ScoreConfig.objects.get_or_create(user=user)
    total_weight = float(
        config.study_weight
        + config.task_weight
        + config.habit_weight
        + config.exam_weight
        + config.personal_weight
    )
    if total_weight <= 0:
        total_weight = 100.0

    weighted_score = (
        study_score * float(config.study_weight)
        + task_score * float(config.task_weight)
        + habit_score * float(config.habit_weight)
        + exam_score * float(config.exam_weight)
        + personal_score * float(config.personal_weight)
    ) / total_weight

    final_score = round(min(10.0, max(0.0, weighted_score)), 2)

    breakdown = {
        "study": {
            "hours": round(study_hours, 2),
            "score": study_score,
            "weight": float(config.study_weight),
        },
        "tasks": {
            "score": task_score,
            "weight": float(config.task_weight),
        },
        "habits": {
            "score": habit_score,
            "weight": float(config.habit_weight),
        },
        "exams": {
            "score": exam_score,
            "weight": float(config.exam_weight),
        },
        "personal": {
            "score": personal_score,
            "weight": float(config.personal_weight),
        },
    }

    # Fetch or update ProductivityScore
    score_obj, created = ProductivityScore.objects.get_or_create(
        user=user,
        date=target_date,
        defaults={
            "score": Decimal(str(final_score)),
            "study_score": Decimal(str(study_score)),
            "task_score": Decimal(str(task_score)),
            "habit_score": Decimal(str(habit_score)),
            "exam_score": Decimal(str(exam_score)),
            "personal_score": Decimal(str(personal_score)),
            "breakdown_json": breakdown,
        },
    )

    if not created and not score_obj.manual_override:
        score_obj.score = Decimal(str(final_score))
        score_obj.study_score = Decimal(str(study_score))
        score_obj.task_score = Decimal(str(task_score))
        score_obj.habit_score = Decimal(str(habit_score))
        score_obj.exam_score = Decimal(str(exam_score))
        score_obj.personal_score = Decimal(str(personal_score))
        score_obj.breakdown_json = breakdown
        score_obj.save()

    return score_obj
