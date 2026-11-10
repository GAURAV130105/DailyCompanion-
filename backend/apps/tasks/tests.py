import pytest
from rest_framework import status


@pytest.mark.django_db
class TestTaskAPI:
    def test_create_and_list_task(self, auth_client, user):
        url = "/api/v1/tasks/"
        payload = {
            "title": "Complete Modern Indian History Chapter 4",
            "priority": "high",
            "status": "todo",
            "estimated_minutes": 90,
        }

        res = auth_client.post(url, payload)
        assert res.status_code == status.HTTP_201_CREATED
        task_id = res.data["id"]

        list_res = auth_client.get(url)
        assert list_res.status_code == status.HTTP_200_OK
        results = list_res.data.get("results", list_res.data)
        assert any(t["id"] == task_id for t in results)

    def test_complete_task(self, auth_client, user):
        create_res = auth_client.post("/api/v1/tasks/", {
            "title": "Solve 50 GS MCQs",
            "priority": "medium",
            "status": "todo",
        })
        task_id = create_res.data["id"]
        patch_res = auth_client.patch(f"/api/v1/tasks/{task_id}/", {"status": "completed"})
        assert patch_res.status_code == status.HTTP_200_OK
        assert patch_res.data["status"] == "completed"
