"""
Encryption utilities for private data in Student Life OS.
Uses Fernet symmetric encryption.
"""
import base64
from cryptography.fernet import Fernet
from django.conf import settings


def _get_fernet() -> Fernet:
    """Initialize Fernet cipher using configured FIELD_ENCRYPTION_KEY."""
    raw_key = getattr(settings, "FIELD_ENCRYPTION_KEY", "dGhpcy1pcy1hLXNhbXBsZS0zMi1ieXRlLWtleS0xMjM0NTY=")
    # Ensure 32-byte url-safe base64 key
    try:
        key_bytes = raw_key.encode("utf-8")
        # Validate Fernet key format
        base64.urlsafe_b64decode(key_bytes)
        return Fernet(key_bytes)
    except Exception:
        # Fallback to safe padded key
        padded = raw_key.ljust(32, "x")[:32].encode("utf-8")
        b64 = base64.urlsafe_b64encode(padded)
        return Fernet(b64)


def encrypt_text(plain_text: str) -> str:
    """Encrypt a plain text string into a ciphertext string."""
    if not plain_text:
        return ""
    fernet = _get_fernet()
    return fernet.encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_text(cipher_text: str) -> str:
    """Decrypt a ciphertext string back to plain text."""
    if not cipher_text:
        return ""
    fernet = _get_fernet()
    try:
        return fernet.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except Exception:
        return cipher_text
