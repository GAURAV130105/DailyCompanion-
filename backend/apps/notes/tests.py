import pytest
from rest_framework import status


@pytest.mark.django_db
class TestNotesAndAnalyticsAPI:
    def test_notes_creation_and_search(self, auth_client, user):
        res = auth_client.post("/api/v1/notes/", {
            "title": "Summary of Article 21 and Maneka Gandhi Case",
            "content": "Due process of law introduced into Indian constitutional jurisprudence.",
            "tags": ["Polity", "Important", "Judiciary"],
            "is_pinned": True,
        }, format="json")
        assert res.status_code == status.HTTP_201_CREATED

        search_res = auth_client.get("/api/v1/notes/?search=Maneka")
        assert search_res.status_code == status.HTTP_200_OK
        items = search_res.data.get("results", search_res.data)
        assert len(items) >= 1

    def test_analytics_endpoints(self, auth_client, user):
        overview_res = auth_client.get("/api/v1/analytics/overview/")
        assert overview_res.status_code == status.HTTP_200_OK
        assert "total_study_hours" in overview_res.data

        exam_progress_res = auth_client.get("/api/v1/analytics/exam-progress/")
        assert exam_progress_res.status_code == status.HTTP_200_OK
