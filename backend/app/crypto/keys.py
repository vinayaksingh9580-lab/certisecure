"""
CertiSecure — Ed25519 Key Management

Handles Ed25519 keypair generation, private key encryption at rest,
and public key export. Private keys are encrypted using Fernet
(symmetric encryption derived from MASTER_ENCRYPTION_KEY).
"""

import base64
from datetime import datetime, timezone

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
    PublicFormat,
)

from app.core.config import settings


def _get_fernet() -> Fernet:
    """Get Fernet cipher using the master encryption key."""
    key = settings.master_encryption_key.encode()
    return Fernet(key)


def generate_keypair() -> tuple[str, str, str]:
    """
    Generate a new Ed25519 keypair.

    Returns:
        Tuple of (public_key_pem, encrypted_private_key, key_id)
        - public_key_pem: PEM-encoded public key (safe to share)
        - encrypted_private_key: Fernet-encrypted PEM private key (store in DB)
        - key_id: Unique identifier for this key
    """
    # Generate Ed25519 private key
    private_key = Ed25519PrivateKey.generate()

    # Serialize private key to PEM
    private_key_pem = private_key.private_bytes(
        encoding=Encoding.PEM,
        format=PrivateFormat.PKCS8,
        encryption_algorithm=NoEncryption(),
    )

    # Serialize public key to PEM
    public_key_pem = private_key.public_key().public_bytes(
        encoding=Encoding.PEM,
        format=PublicFormat.SubjectPublicKeyInfo,
    )

    # Encrypt private key at rest
    fernet = _get_fernet()
    encrypted_private_key = fernet.encrypt(private_key_pem).decode("utf-8")

    # Generate a unique key ID
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    import uuid
    short_id = uuid.uuid4().hex[:8].upper()
    key_id = f"KEY-{timestamp}-{short_id}"

    return (
        public_key_pem.decode("utf-8"),
        encrypted_private_key,
        key_id,
    )


def decrypt_private_key(encrypted_private_key: str) -> bytes:
    """
    Decrypt an encrypted private key.

    Args:
        encrypted_private_key: Fernet-encrypted PEM private key

    Returns:
        Raw PEM bytes of the private key
    """
    fernet = _get_fernet()
    return fernet.decrypt(encrypted_private_key.encode("utf-8"))


def load_private_key(encrypted_private_key: str) -> Ed25519PrivateKey:
    """
    Load an Ed25519 private key from its encrypted storage form.

    Args:
        encrypted_private_key: Fernet-encrypted PEM private key

    Returns:
        Ed25519PrivateKey object ready for signing
    """
    from cryptography.hazmat.primitives.serialization import load_pem_private_key

    pem_bytes = decrypt_private_key(encrypted_private_key)
    return load_pem_private_key(pem_bytes, password=None)


def load_public_key(public_key_pem: str):
    """
    Load an Ed25519 public key from PEM format.

    Args:
        public_key_pem: PEM-encoded public key string

    Returns:
        Ed25519PublicKey object ready for verification
    """
    from cryptography.hazmat.primitives.serialization import load_pem_public_key

    return load_pem_public_key(public_key_pem.encode("utf-8"))


def get_public_key_fingerprint(public_key_pem: str) -> str:
    """
    Generate a short fingerprint of a public key for display.

    Returns:
        First 16 hex characters of the SHA-256 hash of the public key.
    """
    import hashlib
    digest = hashlib.sha256(public_key_pem.encode("utf-8")).hexdigest()
    return digest[:16].upper()
