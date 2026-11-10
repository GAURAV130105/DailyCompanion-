"""AI Assistant views.

The AI assistant reads user data to generate contextual suggestions.
It NEVER silently modifies any user records — all suggestions are read-only.
If LLM_PROVIDER is 'disabled', a helpful static response is returned based on context.
"""
import json
from datetime import datetime

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import AIConversation
from .serializers import AIConversationSerializer, AIMessageSerializer

STATIC_RESPONSES = {
    "general": (
        "I'm your Student Life OS assistant! I can help you with study planning, "
        "exam preparation analysis, revision scheduling, and productivity tips. "
        "What would you like help with today?"
    ),
    "schedule": (
        "To generate an optimal schedule: 1) Block your peak focus hours for the hardest subjects. "
        "2) Use the Pomodoro technique (25 min work / 5 min break). "
        "3) Schedule revision sessions for topics you completed 3-7 days ago. "
        "4) Leave buffer time for unexpected tasks. "
        "Would you like me to analyze your current study hours?"
    ),
    "exam": (
        "For exam preparation: Focus on high-weightage subjects first. "
        "Aim for at least one mock test per week. Review your mistake notebook regularly. "
        "Track your syllabus completion — aim for 100% coverage 4 weeks before the exam date. "
        "What exam are you preparing for?"
    ),
    "finance": (
        "For student finances: Track every expense by category. "
        "Set a monthly budget for each category. "
        "Review spending patterns weekly. "
        "Aim to save at least 20% of your income/stipend. "
        "What would you like help with?"
    ),
    "health": (
        "For student health: Aim for 7-8 hours of sleep — it's essential for memory consolidation. "
        "Drink at least 2.5 litres of water daily. "
        "Exercise for 30 minutes at least 5 days a week. "
        "Take a 5-minute break every hour of study. "
        "How can I help you with your health goals?"
    ),
}


def _call_llm(messages: list, context_type: str) -> str:
    """Call the configured LLM provider. Returns response text."""
    provider = getattr(settings, "LLM_PROVIDER", "disabled")
    if provider == "disabled":
        return STATIC_RESPONSES.get(context_type, STATIC_RESPONSES["general"])

    if provider == "openai":
        try:
            import openai
            client = openai.OpenAI(api_key=settings.LLM_API_KEY)
            response = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "system", "content": "You are a helpful AI assistant for students. Be concise and actionable."}] + messages,
                max_tokens=800,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI service temporarily unavailable. ({str(e)})"

    return STATIC_RESPONSES.get(context_type, STATIC_RESPONSES["general"])


class AIConversationViewSet(ModelViewSet):
    """CRUD for AI conversations + message sending."""

    serializer_class = AIConversationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def message(self, request, pk=None):
        """Send a message to the AI and receive a response.
        The AI reads user data for context but NEVER modifies any records.
        """
        conversation = self.get_object()
        serializer = AIMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_content = serializer.validated_data["content"]
        timestamp = datetime.utcnow().isoformat() + "Z"

        # Append user message
        messages = list(conversation.messages)
        messages.append({"role": "user", "content": user_content, "timestamp": timestamp})

        # Build LLM message history (last 10 messages for context)
        llm_messages = [{"role": m["role"], "content": m["content"]} for m in messages[-10:]]

        # Get AI response
        ai_text = _call_llm(llm_messages, conversation.context_type)

        # Append assistant response
        messages.append({
            "role": "assistant",
            "content": ai_text,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

        conversation.messages = messages
        conversation.save(update_fields=["messages", "updated_at"])

        return Response({
            "conversation_id": str(conversation.id),
            "assistant_message": ai_text,
            "messages": messages,
        })
