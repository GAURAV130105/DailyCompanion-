"""
URLs for Revision module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import RevisionScheduleViewSet

app_name = "revision"

router = DefaultRouter()
router.register("schedules", RevisionScheduleViewSet, basename="revision-schedule")

urlpatterns = [
    path("", include(router.urls)),
]
