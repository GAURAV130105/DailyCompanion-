"""
Views for Exam preparation, syllabus tracking, mock tests, and mistakes.
"""
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwner
from .models import (
    Chapter,
    ExamProfile,
    MistakeNotebook,
    MockTest,
    MockTestSubjectScore,
    Subject,
    Topic,
)
from .serializers import (
    ChapterSerializer,
    ExamProfileSerializer,
    MistakeNotebookSerializer,
    MockTestSerializer,
    MockTestSubjectScoreSerializer,
    SubjectSerializer,
    TopicSerializer,
)


class ExamProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for student target exam profiles.
    """

    serializer_class = ExamProfileSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["exam_type", "is_active"]
    search_fields = ["exam_name", "notes"]
    ordering_fields = ["target_date", "exam_name", "created_at"]

    def get_queryset(self):
        return ExamProfile.objects.filter(user=self.request.user).prefetch_related(
            "subjects"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["get"], url_path="progress")
    def progress(self, request, pk=None):
        """
        Returns syllabus completion breakdown overall and by subject.
        """
        exam = self.get_object()
        topics = Topic.objects.filter(chapter__subject__exam_profile=exam)
        total_topics = topics.count()
        completed = topics.filter(status="completed").count()
        in_progress = topics.filter(status="in_progress").count()
        pending = topics.filter(status="pending").count()
        needs_revision = topics.filter(status="needs_revision").count()

        percent = round((completed / total_topics * 100.0), 1) if total_topics > 0 else 0.0

        by_subject = []
        for subj in exam.subjects.all():
            sub_topics = Topic.objects.filter(chapter__subject=subj)
            sub_total = sub_topics.count()
            sub_completed = sub_topics.filter(status="completed").count()
            sub_pct = (
                round((sub_completed / sub_total * 100.0), 1)
                if sub_total > 0
                else 0.0
            )
            by_subject.append(
                {
                    "subject_id": str(subj.id),
                    "subject_name": subj.name,
                    "color": subj.color,
                    "total_topics": sub_total,
                    "completed": sub_completed,
                    "percent": sub_pct,
                }
            )

        return Response(
            {
                "total_topics": total_topics,
                "completed": completed,
                "in_progress": in_progress,
                "pending": pending,
                "needs_revision": needs_revision,
                "percent": percent,
                "by_subject": by_subject,
            }
        )


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["exam_profile"]
    search_fields = ["name"]
    ordering_fields = ["order", "name"]

    def get_queryset(self):
        return Subject.objects.filter(
            exam_profile__user=self.request.user
        ).prefetch_related("chapters__topics")

    def perform_create(self, serializer):
        exam = serializer.validated_data.get("exam_profile")
        if exam.user != self.request.user:
            raise PermissionError("Cannot add subject to another user's exam profile.")
        serializer.save()


class ChapterViewSet(viewsets.ModelViewSet):
    serializer_class = ChapterSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["subject"]
    search_fields = ["name"]
    ordering_fields = ["order", "name"]

    def get_queryset(self):
        return Chapter.objects.filter(
            subject__exam_profile__user=self.request.user
        ).prefetch_related("topics")

    def perform_create(self, serializer):
        subject = serializer.validated_data.get("subject")
        if subject.exam_profile.user != self.request.user:
            raise PermissionError("Cannot add chapter to another user's subject.")
        serializer.save()


class TopicViewSet(viewsets.ModelViewSet):
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["chapter", "status", "difficulty"]
    search_fields = ["name", "notes"]
    ordering_fields = ["name", "status", "difficulty"]

    def get_queryset(self):
        return Topic.objects.filter(
            chapter__subject__exam_profile__user=self.request.user
        )

    def perform_create(self, serializer):
        chapter = serializer.validated_data.get("chapter")
        if chapter.subject.exam_profile.user != self.request.user:
            raise PermissionError("Cannot add topic to another user's chapter.")
        serializer.save()

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        topic = self.get_object()
        new_status = request.data.get("status")
        if new_status in dict(Topic.status.field.choices):
            topic.status = new_status
            if new_status == "completed" and not topic.completed_at:
                topic.completed_at = timezone.now()
            elif new_status != "completed":
                topic.completed_at = None
            topic.save(update_fields=["status", "completed_at", "updated_at"])
            return Response(self.get_serializer(topic).data)
        return Response(
            {"detail": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST
        )


class MockTestViewSet(viewsets.ModelViewSet):
    serializer_class = MockTestSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["exam_profile"]
    search_fields = ["test_name", "notes"]
    ordering_fields = ["test_date", "obtained_marks", "created_at"]

    def get_queryset(self):
        return (
            MockTest.objects.filter(user=self.request.user)
            .select_related("exam_profile")
            .prefetch_related("subject_scores__subject")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MockTestSubjectScoreViewSet(viewsets.ModelViewSet):
    serializer_class = MockTestSubjectScoreSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["mock_test", "subject"]

    def get_queryset(self):
        return MockTestSubjectScore.objects.filter(
            mock_test__user=self.request.user
        ).select_related("subject", "mock_test")

    def perform_create(self, serializer):
        mock_test = serializer.validated_data.get("mock_test")
        if mock_test.user != self.request.user:
            raise PermissionError("Cannot add subject score to another user's mock test.")
        serializer.save()


class MistakeNotebookViewSet(viewsets.ModelViewSet):
    serializer_class = MistakeNotebookSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["subject", "topic", "reviewed"]
    search_fields = ["question_text", "correct_answer", "explanation"]
    ordering_fields = ["created_at", "reviewed"]

    def get_queryset(self):
        return (
            MistakeNotebook.objects.filter(user=self.request.user)
            .select_related("subject", "topic", "mock_test")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        entry = self.get_object()
        entry.reviewed = True
        entry.reviewed_at = timezone.now()
        entry.save(update_fields=["reviewed", "reviewed_at", "updated_at"])
        return Response(self.get_serializer(entry).data)
