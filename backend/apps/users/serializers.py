"""
Serializers for User authentication and profile management.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for reading and representing User details."""

    full_name = serializers.ReadOnlyField()
    timezone = serializers.CharField(source="user_timezone", required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "avatar",
            "bio",
            "timezone",
            "daily_study_goal_minutes",
            "pomodoro_work_duration",
            "pomodoro_short_break",
            "pomodoro_long_break",
            "theme",
            "date_joined",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "email", "date_joined", "created_at", "updated_at"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for handling new user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    tokens = serializers.SerializerMethodField(read_only=True)
    timezone = serializers.CharField(source="user_timezone", required=False, default="Asia/Kolkata")

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "timezone",
            "tokens",
        ]
        read_only_fields = ["id", "tokens"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Password fields do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            user_timezone=validated_data.get("user_timezone", "Asia/Kolkata"),
        )
        return user


    def get_tokens(self, user) -> dict:
        """Generate JWT access and refresh tokens for newly registered user."""
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class UserLoginSerializer(serializers.Serializer):
    """Serializer for authenticating users and providing JWT tokens."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})
    tokens = serializers.SerializerMethodField(read_only=True)
    user = UserSerializer(read_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError({"detail": "Invalid email or password credentials."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})

        self.user_obj = user
        return attrs

    def get_tokens(self, attrs) -> dict:
        refresh = RefreshToken.for_user(self.user_obj)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for handling password changes."""

    old_password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is not correct.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password": "New passwords do not match."})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile and study preferences."""

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "username",
            "avatar",
            "bio",
            "timezone",
            "daily_study_goal_minutes",
            "pomodoro_work_duration",
            "pomodoro_short_break",
            "pomodoro_long_break",
            "theme",
        ]
