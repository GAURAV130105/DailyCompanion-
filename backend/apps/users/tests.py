import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestAuthAPI:
    def test_register_success(self, api_client):
        url = "/api/v1/auth/register/"
        data = {
            "email": "newstudent@example.com",
            "password": "SecurePassword@123",
            "password_confirm": "SecurePassword@123",
            "first_name": "New",
            "last_name": "Student",
        }

        response = api_client.post(url, data)
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]

    def test_login_success(self, api_client, user):
        url = "/api/v1/auth/login/"
        data = {
            "email": user.email,
            "password": "TestPass@123",
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data or "tokens" in response.data or "token" in response.data

    def test_profile_authenticated(self, auth_client):
        url = "/api/v1/auth/profile/"
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "testuser@example.com"

    def test_profile_unauthenticated(self, api_client):
        url = "/api/v1/auth/profile/"
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
