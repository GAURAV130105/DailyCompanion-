"""Health serializers."""
from rest_framework import serializers
from .models import HealthLog


class HealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthLog
        fields = [
            "id", "date", "sleep_hours", "water_ml", "exercise_mins",
            "exercise_type", "steps", "weight_kg", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
