"""
URLs for Habits module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import HabitLogViewSet, HabitViewSet

app_name = "habits"

router = DefaultRouter()
router.register("logs", HabitLogViewSet, basename="habit-log")
router.register("", HabitViewSet, basename="habit")

urlpatterns = [
    path("", include(router.urls)),
]
