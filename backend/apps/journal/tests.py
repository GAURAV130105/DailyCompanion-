import pytest
from rest_framework import status


@pytest.mark.django_db
class TestJournalAndHealthAPI:
    def test_journal_entry_crud(self, auth_client, user):
        res = auth_client.post("/api/v1/journal/entries/", {
            "date": "2026-11-08",
            "title": "Day 45 of UPSC Prep",
            "content": "Covered Fundamental Rights in depth and revised geography notes.",
            "mood": "great",
            "mood_score": 9,
            "achievements": "Scored 120+ in GS Mock Test #3",
            "tomorrow_goals": "Finish Environment & Ecology Chapter 1",
        })
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["mood_score"] == 9

        # By-date endpoint
        by_date_res = auth_client.get("/api/v1/journal/entries/by-date/2026-11-08/")
        assert by_date_res.status_code == status.HTTP_200_OK
        assert by_date_res.data["title"] == "Day 45 of UPSC Prep"

    def test_health_log_crud(self, auth_client, user):
        res = auth_client.post("/api/v1/health/logs/", {
            "date": "2026-11-08",
            "sleep_hours": "7.50",
            "water_ml": 2800,
            "exercise_mins": 45,
            "exercise_type": "Running & Stretching",
            "steps": 8500,
            "weight_kg": "68.50",
        })
        assert res.status_code == status.HTTP_201_CREATED

        stats_res = auth_client.get("/api/v1/health/logs/stats/")
        assert stats_res.status_code == status.HTTP_200_OK
