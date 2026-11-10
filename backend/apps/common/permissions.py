"""
Permissions for Student Life OS.
Enforces strict user ownership of resources.
"""
from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to access or edit it.
    Assumes the model instance has either a `user` attribute or is the User model itself.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Read/write permissions are only allowed to the owner of the object.
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "daily_plan") and hasattr(obj.daily_plan, "user"):
            return obj.daily_plan.user == request.user
        if hasattr(obj, "task") and hasattr(obj.task, "user"):
            return obj.task.user == request.user
        if hasattr(obj, "exam_profile") and hasattr(obj.exam_profile, "user"):
            return obj.exam_profile.user == request.user
        if hasattr(obj, "goal") and hasattr(obj.goal, "user"):
            return obj.goal.user == request.user
        if hasattr(obj, "habit") and hasattr(obj.habit, "user"):
            return obj.habit.user == request.user
        if hasattr(obj, "conversation") and hasattr(obj.conversation, "user"):
            return obj.conversation.user == request.user
        return obj == request.user
