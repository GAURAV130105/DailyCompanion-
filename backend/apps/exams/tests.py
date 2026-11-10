import pytest
from rest_framework import status
from apps.exams.models import ExamProfile, Subject, Chapter, Topic


@pytest.mark.django_db
class TestExamAPI:
    def test_exam_profile_and_progress(self, auth_client, user):
        # Create profile
        profile = ExamProfile.objects.create(
            user=user,
            exam_type="UPSC",
            exam_name="UPSC CSE 2026",
            attempt_number=1,
        )
        subject = Subject.objects.create(exam_profile=profile, name="Polity", weightage=25)
        chapter = Chapter.objects.create(subject=subject, name="Fundamental Rights", order=1)
        Topic.objects.create(chapter=chapter, name="Article 21 Right to Life", status="completed")
        Topic.objects.create(chapter=chapter, name="Article 32 Constitutional Remedies", status="pending")

        # Test progress endpoint
        res = auth_client.get(f"/api/v1/exams/profiles/{profile.id}/progress/")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["total_topics"] == 2
        assert res.data["completed"] == 1
        assert res.data["percent"] == 50.0

    def test_delete_exam_profile(self, auth_client, user):
        profile = ExamProfile.objects.create(
            user=user,
            exam_type="NDA",
            exam_name="NDA 2026 Test",
            attempt_number=1,
        )
        subject = Subject.objects.create(exam_profile=profile, name="Mathematics", weightage=50)
        chapter = Chapter.objects.create(subject=subject, name="Calculus", order=1)
        topic = Topic.objects.create(chapter=chapter, name="Derivatives", status="pending")

        # Delete profile
        del_res = auth_client.delete(f"/api/v1/exams/profiles/{profile.id}/")
        assert del_res.status_code == status.HTTP_204_NO_CONTENT

        # Verify cascading deletion
        assert not ExamProfile.objects.filter(id=profile.id).exists()
        assert not Subject.objects.filter(id=subject.id).exists()
        assert not Chapter.objects.filter(id=chapter.id).exists()
        assert not Topic.objects.filter(id=topic.id).exists()

