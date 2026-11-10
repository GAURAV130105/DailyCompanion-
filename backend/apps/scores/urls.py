"""
URLs for Productivity scores module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ProductivityScoreViewSet

app_name = "scores"

router = DefaultRouter()
router.register("", ProductivityScoreViewSet, basename="score")

urlpatterns = [
    path("", include(router.urls)),
]
