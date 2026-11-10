"""Health URL configuration."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthLogViewSet

router = DefaultRouter()
router.register(r"logs", HealthLogViewSet, basename="health-log")

urlpatterns = [path("", include(router.urls))]
