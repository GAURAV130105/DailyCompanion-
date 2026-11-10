"""
URLs for Planner module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import DailyPlanViewSet, TimeBlockViewSet

app_name = "planner"

router = DefaultRouter()
router.register("daily-plans", DailyPlanViewSet, basename="daily-plan")
router.register("time-blocks", TimeBlockViewSet, basename="time-block")

urlpatterns = [
    path("", include(router.urls)),
]
