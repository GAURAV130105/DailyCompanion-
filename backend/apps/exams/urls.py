"""
URLs for Exams module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    ChapterViewSet,
    ExamProfileViewSet,
    MistakeNotebookViewSet,
    MockTestSubjectScoreViewSet,
    MockTestViewSet,
    SubjectViewSet,
    TopicViewSet,
)

app_name = "exams"

router = DefaultRouter()
router.register("profiles", ExamProfileViewSet, basename="exam-profile")
router.register("subjects", SubjectViewSet, basename="subject")
router.register("chapters", ChapterViewSet, basename="chapter")
router.register("topics", TopicViewSet, basename="topic")
router.register("mock-tests", MockTestViewSet, basename="mock-test")
router.register("mock-scores", MockTestSubjectScoreViewSet, basename="mock-score")
router.register("mistakes", MistakeNotebookViewSet, basename="mistake")

urlpatterns = [
    path("", include(router.urls)),
]
