"""
Serializers for Revision scheduling.
"""
from rest_framework import serializers
from .models import RevisionSchedule


class RevisionScheduleSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source="topic.name", read_only=True)
    chapter_name = serializers.CharField(source="topic.chapter.name", read_only=True)
    subject_name = serializers.CharField(source="topic.chapter.subject.name", read_only=True)
    subject_color = serializers.CharField(source="topic.chapter.subject.color", read_only=True)

    class Meta:
        model = RevisionSchedule
        fields = [
            "id",
            "user",
            "topic",
            "topic_name",
            "chapter_name",
            "subject_name",
            "subject_color",
            "scheduled_date",
            "completed",
            "completed_at",
            "interval_days",
            "revision_number",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "completed_at", "created_at", "updated_at"]
