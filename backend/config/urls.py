"""
Main URL configuration for Student Life OS.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/planner/", include("apps.planner.urls")),
    path("api/v1/tasks/", include("apps.tasks.urls")),
    path("api/v1/study/", include("apps.study.urls")),
    path("api/v1/exams/", include("apps.exams.urls")),
    path("api/v1/revision/", include("apps.revision.urls")),
    path("api/v1/goals/", include("apps.goals.urls")),
    path("api/v1/habits/", include("apps.habits.urls")),
    path("api/v1/scores/", include("apps.scores.urls")),
    path("api/v1/finance/", include("apps.finance.urls")),
    path("api/v1/journal/", include("apps.journal.urls")),
    path("api/v1/health/", include("apps.health.urls")),
    path("api/v1/notes/", include("apps.notes.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/ai/", include("apps.ai_assistant.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
