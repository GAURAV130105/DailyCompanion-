"""
Serializers for Study sessions and Pomodoro timers.
"""
from rest_framework import serializers
from .models import PomodoroSession, StudySession


class StudySessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    topic_name = serializers.CharField(source="topic.name", read_only=True)

    class Meta:
        model = StudySession
        fields = [
            "id",
            "user",
            "subject",
            "subject_name",
            "topic",
            "topic_name",
            "session_type",
            "start_time",
            "end_time",
            "duration_mins",
            "focus_rating",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "duration_mins", "created_at", "updated_at"]


class PomodoroSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = [
            "id",
            "user",
            "study_session",
            "work_mins",
            "break_mins",
            "cycles_planned",
            "cycles_done",
            "started_at",
            "ended_at",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "started_at", "created_at", "updated_at"]
