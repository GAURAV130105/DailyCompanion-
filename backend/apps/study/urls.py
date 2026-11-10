"""
URLs for Study module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import PomodoroSessionViewSet, StudySessionViewSet

app_name = "study"

router = DefaultRouter()
router.register("sessions", StudySessionViewSet, basename="study-session")
router.register("pomodoro", PomodoroSessionViewSet, basename="pomodoro")

urlpatterns = [
    path("", include(router.urls)),
]
