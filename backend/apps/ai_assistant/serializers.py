"""AI Assistant serializers."""
from rest_framework import serializers
from .models import AIConversation


class AIConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIConversation
        fields = ["id", "title", "context_type", "messages", "created_at", "updated_at"]
        read_only_fields = ["id", "messages", "created_at", "updated_at"]


class AIMessageSerializer(serializers.Serializer):
    content = serializers.CharField(required=True, max_length=5000)
