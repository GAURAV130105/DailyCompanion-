"""
Development settings for Student Life OS.
"""
from decouple import config
from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Database configuration
USE_SQLITE = config("USE_SQLITE", default=False, cast=bool)

if USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="student_life_os"),
            "USER": config("DB_USER", default="slos_user"),
            "PASSWORD": config("DB_PASSWORD", default="slos_pass"),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }

# Development email backend
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# CORS development
CORS_ALLOW_ALL_ORIGINS = True
