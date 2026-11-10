"""
Serializers for the Planner module.
"""
from rest_framework import serializers
from .models import DailyPlan, TimeBlock


class TimeBlockSerializer(serializers.ModelSerializer):
    """Serializer for TimeBlock model."""

    user = serializers.ReadOnlyField(source="user.email")
    block_type = serializers.CharField(source="category", required=False)

    class Meta:
        model = TimeBlock
        fields = [
            "id",
            "user",
            "daily_plan",
            "title",
            "category",
            "block_type",
            "start_time",
            "end_time",
            "is_completed",
            "color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, "copy") else dict(data)
        if "block_type" in data_copy and "category" not in data_copy:
            data_copy["category"] = data_copy["block_type"]
        return super().to_internal_value(data_copy)

    def validate(self, attrs):
        start_time = attrs.get("start_time") or getattr(self.instance, "start_time", None)
        end_time = attrs.get("end_time") or getattr(self.instance, "end_time", None)
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        return attrs


class DailyPlanSerializer(serializers.ModelSerializer):
    """Serializer for DailyPlan model, including related time blocks."""

    user = serializers.ReadOnlyField(source="user.email")
    time_blocks = TimeBlockSerializer(many=True, read_only=True)

    class Meta:
        model = DailyPlan
        fields = [
            "id",
            "user",
            "date",
            "primary_goal",
            "notes",
            "daily_score",
            "is_completed",
            "time_blocks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
