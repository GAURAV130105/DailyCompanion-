from django.urls import path
from .views import (
    OverviewView, StudyTrendsView, ExamProgressView,
    ProductivityTrendView, HabitAnalyticsView, FinanceAnalyticsView,
)

urlpatterns = [
    path("overview/", OverviewView.as_view(), name="analytics-overview"),
    path("study-trends/", StudyTrendsView.as_view(), name="analytics-study"),
    path("exam-progress/", ExamProgressView.as_view(), name="analytics-exam"),
    path("productivity/", ProductivityTrendView.as_view(), name="analytics-productivity"),
    path("habits/", HabitAnalyticsView.as_view(), name="analytics-habits"),
    path("finance/", FinanceAnalyticsView.as_view(), name="analytics-finance"),
]
