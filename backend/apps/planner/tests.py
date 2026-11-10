import pytest
from rest_framework import status


@pytest.mark.django_db
class TestPlannerAPI:
    def test_daily_plan_by_date(self, auth_client):
        # 1. Get or create by date
        res = auth_client.get("/api/v1/planner/daily-plans/by-date/2026-11-10/")
        assert res.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert res.data["date"] == "2026-11-10"
        plan_id = res.data["id"]

        # 2. Add time block with block_type='study'
        block_payload = {
            "daily_plan": plan_id,
            "title": "UPSC Modern History Session",
            "block_type": "study",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
        }
        b_res = auth_client.post("/api/v1/planner/time-blocks/", block_payload, format="json")
        assert b_res.status_code == status.HTTP_201_CREATED
        assert b_res.data["category"] == "study"
        assert b_res.data["block_type"] == "study"
        block_id = b_res.data["id"]

        # 3. Toggle time block
        toggle_res = auth_client.post(f"/api/v1/planner/time-blocks/{block_id}/toggle/")
        assert toggle_res.status_code == status.HTTP_200_OK
        assert toggle_res.data["is_completed"] is True

        # 4. Filter time blocks by date
        list_res = auth_client.get("/api/v1/planner/time-blocks/?date=2026-11-10")
        assert list_res.status_code == status.HTTP_200_OK
        results = list_res.data.get("results", list_res.data)
        assert len(results) == 1
        assert results[0]["id"] == block_id

        # 5. Delete time block
        del_res = auth_client.delete(f"/api/v1/planner/time-blocks/{block_id}/")
        assert del_res.status_code == status.HTTP_204_NO_CONTENT

    def test_daily_plan_idempotent_create(self, auth_client):
        # Post daily plan once
        res1 = auth_client.post("/api/v1/planner/daily-plans/", {"date": "2026-11-11", "primary_goal": "Goal 1"})
        assert res1.status_code == status.HTTP_201_CREATED

        # Post daily plan again for same date (should update instead of 400 error)
        res2 = auth_client.post("/api/v1/planner/daily-plans/", {"date": "2026-11-11", "primary_goal": "Goal 1 Updated"})
        assert res2.status_code == status.HTTP_200_OK
        assert res2.data["primary_goal"] == "Goal 1 Updated"
