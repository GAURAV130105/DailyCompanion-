"""
URLs for Goals module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import GoalViewSet, MilestoneViewSet

app_name = "goals"

router = DefaultRouter()
router.register("milestones", MilestoneViewSet, basename="milestone")
router.register("", GoalViewSet, basename="goal")

urlpatterns = [
    path("", include(router.urls)),
]
