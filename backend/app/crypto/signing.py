"""
CertiSecure2 — Digital Signing & Verification

Implements the core cryptographic signing pipeline:
1. Canonical JSON serialization (deterministic)
2. SHA-256 hashing
3. Ed25519 signing
4. Ed25519 verification

This module is the heart of CertiSecure's tamper detection.
"""

import base64
import hashlib
import json
from typing import Any, Dict, Optional

from cryptography.exceptions import InvalidSignature

from app.crypto.keys import load_private_key, load_public_key


def canonicalize(data: Dict[str, Any]) -> str:
    """
    Create a deterministic canonical JSON representation.

    Rules:
    - Keys sorted alphabetically
    - No extra whitespace
    - UTF-8 encoding
    - Consistent separator format
    """
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def compute_hash(canonical_json: str) -> str:
    """
    Compute SHA-256 hash of canonical JSON string.

    Returns:
        Hex digest of SHA-256 hash
    """
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def sign_data(canonical_json: str, encrypted_private_key: str) -> str:
    """
    Sign canonical data using Ed25519.

    Args:
        canonical_json: Deterministic JSON string to sign
        encrypted_private_key: Fernet-encrypted private key from DB

    Returns:
        Base64-encoded Ed25519 signature
    """
    private_key = load_private_key(encrypted_private_key)
    signature_bytes = private_key.sign(canonical_json.encode("utf-8"))
    return base64.b64encode(signature_bytes).decode("utf-8")


def verify_signature(canonical_json: str, signature_b64: str, public_key_pem: str) -> bool:
    """
    Verify an Ed25519 signature against canonical data.

    This is the core tamper detection mechanism:
    - If ANY byte of the canonical data changes, the signature will NOT match.
    - The verification uses ONLY the public key (private key is never needed).
    """
    try:
        public_key = load_public_key(public_key_pem)
        signature_bytes = base64.b64decode(signature_b64)
        public_key.verify(signature_bytes, canonical_json.encode("utf-8"))
        return True
    except (InvalidSignature, Exception):
        return False


def build_canonical_data(
    certificate_uid: str,
    holder_name: str,
    course: str,
    institution_name: str,
    issue_date: str,
    roll_number: Optional[str] = None,
    certificate_type: str = "Completion",
    grade: Optional[str] = None,
    description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build the canonical certificate data dictionary.

    Only fields that are part of the certificate's identity are included.
    This dictionary is what gets hashed and signed.
    """
    data = {
        "certificate_id": certificate_uid,
        "certificate_type": certificate_type,
        "course": course,
        "holder_name": holder_name,
        "institution": institution_name,
        "issue_date": issue_date,
    }
    if roll_number:
        data["roll_number"] = roll_number
    if grade:
        data["grade"] = grade
    if description:
        data["description"] = description
    return data


def full_sign_pipeline(
    certificate_uid: str,
    holder_name: str,
    course: str,
    institution_name: str,
    issue_date: str,
    encrypted_private_key: str,
    roll_number: Optional[str] = None,
    certificate_type: str = "Completion",
    grade: Optional[str] = None,
    description: Optional[str] = None,
) -> Dict[str, str]:
    """
    Complete signing pipeline: build data → canonicalize → hash → sign.
    """
    data = build_canonical_data(
        certificate_uid=certificate_uid,
        holder_name=holder_name,
        course=course,
        institution_name=institution_name,
        issue_date=issue_date,
        roll_number=roll_number,
        certificate_type=certificate_type,
        grade=grade,
        description=description,
    )

    canonical = canonicalize(data)
    data_hash = compute_hash(canonical)
    signature = sign_data(canonical, encrypted_private_key)

    return {
        "canonical_data": canonical,
        "data_hash": data_hash,
        "signature": signature,
    }


def full_verify_pipeline(
    certificate_uid: str,
    holder_name: str,
    course: str,
    institution_name: str,
    issue_date: str,
    stored_hash: str,
    stored_signature: str,
    public_key_pem: str,
    roll_number: Optional[str] = None,
    certificate_type: str = "Completion",
    grade: Optional[str] = None,
    description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Complete verification pipeline: rebuild data → hash → compare → verify signature.
    """
    data = build_canonical_data(
        certificate_uid=certificate_uid,
        holder_name=holder_name,
        course=course,
        institution_name=institution_name,
        issue_date=issue_date,
        roll_number=roll_number,
        certificate_type=certificate_type,
        grade=grade,
        description=description,
    )
    canonical = canonicalize(data)
    current_hash = compute_hash(canonical)

    hash_match = current_hash == stored_hash
    signature_valid = verify_signature(canonical, stored_signature, public_key_pem)

    return {
        "hash_match": hash_match,
        "signature_valid": signature_valid,
        "original_hash": stored_hash,
        "current_hash": current_hash,
        "algorithm": "Ed25519",
        "hash_algorithm": "SHA-256",
    }
