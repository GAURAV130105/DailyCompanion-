"""
Serializers for Productivity scores and scoring configuration.
"""
from rest_framework import serializers
from .models import ProductivityScore, ScoreConfig


class ScoreConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreConfig
        fields = [
            "id",
            "user",
            "study_weight",
            "task_weight",
            "habit_weight",
            "exam_weight",
            "personal_weight",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class ProductivityScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductivityScore
        fields = [
            "id",
            "user",
            "date",
            "score",
            "study_score",
            "task_score",
            "habit_score",
            "exam_score",
            "personal_score",
            "manual_override",
            "override_note",
            "breakdown_json",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]
