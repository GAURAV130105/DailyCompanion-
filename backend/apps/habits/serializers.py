"""
Serializers for Habits and Habit logs.
"""
from rest_framework import serializers
from .models import Habit, HabitLog


class HabitLogSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source="habit.name", read_only=True)

    class Meta:
        model = HabitLog
        fields = [
            "id",
            "habit",
            "habit_name",
            "user",
            "date",
            "completed",
            "value",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class HabitSerializer(serializers.ModelSerializer):
    logs_count = serializers.IntegerField(source="logs.count", read_only=True)

    class Meta:
        model = Habit
        fields = [
            "id",
            "user",
            "name",
            "description",
            "frequency",
            "target_days",
            "target_count",
            "unit",
            "color",
            "icon",
            "is_active",
            "logs_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
