"""
URLs for Tasks module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import SubTaskViewSet, TaskTagViewSet, TaskViewSet

app_name = "tasks"

router = DefaultRouter()
router.register("tags", TaskTagViewSet, basename="task-tag")
router.register("subtasks", SubTaskViewSet, basename="subtask")
router.register("", TaskViewSet, basename="task")

urlpatterns = [
    path("", include(router.urls)),
]
