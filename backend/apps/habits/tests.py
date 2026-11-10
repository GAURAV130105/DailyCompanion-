import pytest
from rest_framework import status


@pytest.mark.django_db
class TestHabitsAPI:
    def test_create_habit_and_log(self, auth_client, user):
        # Create habit
        res = auth_client.post("/api/v1/habits/", {
            "name": "Morning 5km Run",
            "frequency": "daily",
            "target_count": 1,
            "unit": "times",
            "color": "#10b981",
        }, format="json")
        assert res.status_code == status.HTTP_201_CREATED
        habit_id = res.data["id"]

        # Log completion
        log_res = auth_client.post("/api/v1/habits/logs/", {
            "habit": habit_id,
            "date": "2026-11-08",
            "completed": True,
            "value": 1,
        }, format="json")
        assert log_res.status_code == status.HTTP_201_CREATED
        assert log_res.data["completed"] is True
