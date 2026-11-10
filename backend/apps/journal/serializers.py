"""Journal serializers."""
from rest_framework import serializers
from .models import JournalEntry


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = [
            "id", "date", "title", "content", "mood", "mood_score",
            "achievements", "challenges", "lessons", "tomorrow_goals",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_mood_score(self, value):
        if value is not None and not (1 <= value <= 10):
            raise serializers.ValidationError("Mood score must be between 1 and 10.")
        return value
