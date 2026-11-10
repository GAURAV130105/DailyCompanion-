"""
Serializers for Goals and Milestones.
"""
from rest_framework import serializers
from .models import Goal, Milestone


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = [
            "id",
            "goal",
            "title",
            "target_date",
            "completed",
            "completed_at",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "completed_at", "created_at", "updated_at"]


class GoalSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    exam_name = serializers.CharField(source="exam_profile.exam_name", read_only=True)

    class Meta:
        model = Goal
        fields = [
            "id",
            "user",
            "title",
            "description",
            "category",
            "target_date",
            "status",
            "progress",
            "exam_profile",
            "exam_name",
            "milestones",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
