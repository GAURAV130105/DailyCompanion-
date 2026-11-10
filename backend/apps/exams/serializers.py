"""
Serializers for the Exam preparation module.
"""
from rest_framework import serializers
from .models import (
    Chapter,
    ExamProfile,
    MistakeNotebook,
    MockTest,
    MockTestSubjectScore,
    Subject,
    Topic,
)


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = [
            "id",
            "chapter",
            "name",
            "status",
            "difficulty",
            "estimated_hours",
            "completed_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChapterSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    topics_count = serializers.IntegerField(source="topics.count", read_only=True)

    class Meta:
        model = Chapter
        fields = [
            "id",
            "subject",
            "name",
            "order",
            "estimated_hours",
            "is_completed",
            "status",
            "completed_at",
            "topics",
            "topics_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SubjectSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    chapters_count = serializers.IntegerField(source="chapters.count", read_only=True)

    class Meta:
        model = Subject
        fields = [
            "id",
            "exam_profile",
            "name",
            "weightage",
            "color",
            "order",
            "chapters",
            "chapters_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ExamProfileSerializer(serializers.ModelSerializer):
    subjects_count = serializers.IntegerField(source="subjects.count", read_only=True)

    class Meta:
        model = ExamProfile
        fields = [
            "id",
            "user",
            "exam_type",
            "exam_name",
            "target_date",
            "attempt_number",
            "is_active",
            "notes",
            "subjects_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class MockTestSubjectScoreSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = MockTestSubjectScore
        fields = [
            "id",
            "mock_test",
            "subject",
            "subject_name",
            "marks_obtained",
            "max_marks",
            "correct",
            "incorrect",
            "attempted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MockTestSerializer(serializers.ModelSerializer):
    subject_scores = MockTestSubjectScoreSerializer(many=True, read_only=True)
    exam_name = serializers.CharField(source="exam_profile.exam_name", read_only=True)

    class Meta:
        model = MockTest
        fields = [
            "id",
            "user",
            "exam_profile",
            "exam_name",
            "test_name",
            "test_date",
            "total_marks",
            "obtained_marks",
            "total_questions",
            "attempted",
            "correct",
            "incorrect",
            "unattempted",
            "time_taken_mins",
            "percentile",
            "notes",
            "subject_scores",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class MistakeNotebookSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    topic_name = serializers.CharField(source="topic.name", read_only=True)
    test_name = serializers.CharField(source="mock_test.test_name", read_only=True)

    class Meta:
        model = MistakeNotebook
        fields = [
            "id",
            "user",
            "mock_test",
            "test_name",
            "subject",
            "subject_name",
            "topic",
            "topic_name",
            "question_text",
            "correct_answer",
            "user_answer",
            "explanation",
            "reviewed",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
