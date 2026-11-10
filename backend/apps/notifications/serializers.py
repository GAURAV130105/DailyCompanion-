"""Notifications serializers."""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "type", "is_read", "action_url", "scheduled_at", "sent_at", "created_at"]
        read_only_fields = ["id", "created_at"]
