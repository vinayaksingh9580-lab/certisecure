"""
CertiSecure2 — Cryptographic Unit Tests

Tests:
1. Canonical JSON determinism & key ordering
2. SHA-256 hash generation & repeatability
3. Ed25519 keypair generation and Fernet key protection
4. Signing and signature verification
5. Tamper detection (modified fields cause signature/hash failure)
"""

import pytest

from app.crypto.keys import generate_keypair, get_public_key_fingerprint, load_private_key, load_public_key
from app.crypto.signing import (
    build_canonical_data,
    canonicalize,
    compute_hash,
    full_sign_pipeline,
    full_verify_pipeline,
    sign_data,
    verify_signature,
)


def test_canonicalize_determinism():
    """Verify canonical JSON always sorts keys and formats identically."""
    d1 = {"b": 2, "a": 1, "c": {"y": "2", "x": "1"}}
    d2 = {"a": 1, "c": {"x": "1", "y": "2"}, "b": 2}
    assert canonicalize(d1) == canonicalize(d2)
    assert canonicalize(d1) == '{"a":1,"b":2,"c":{"x":"1","y":"2"}}'


def test_sha256_hash():
    """Verify SHA-256 hash output for canonical string."""
    data = {"certificate_id": "CERT-SMS-LKO-2026-000001", "holder_name": "Vinayak Singh"}
    canon = canonicalize(data)
    h1 = compute_hash(canon)
    h2 = compute_hash(canon)
    assert h1 == h2
    assert len(h1) == 64  # Hex SHA-256 length


def test_keypair_generation_and_fingerprint():
    """Verify Ed25519 key generation and fingerprinting."""
    pub_pem, enc_priv, key_id = generate_keypair()
    assert pub_pem.startswith("-----BEGIN PUBLIC KEY-----")
    assert enc_priv != pub_pem
    assert key_id.startswith("KEY-")

    fp = get_public_key_fingerprint(pub_pem)
    assert len(fp) == 16


def test_ed25519_sign_and_verify():
    """Verify signing and signature verification."""
    pub_pem, enc_priv, _ = generate_keypair()
    data = "Test Data String"

    # Private key should sign correctly
    priv_key = load_private_key(enc_priv)
    import base64
    sig_bytes = priv_key.sign(data.encode("utf-8"))
    sig_b64 = base64.b64encode(sig_bytes).decode("utf-8")

    # Public key should verify
    assert verify_signature(data, sig_b64, pub_pem) is True


def test_tamper_detection():
    """Core SIH requirement: Altering ANY field MUST cause signature/hash failure."""
    pub_pem, enc_priv, _ = generate_keypair()

    original_res = full_sign_pipeline(
        certificate_uid="CERT-SMS-LKO-2026-000001",
        holder_name="Vinayak Singh",
        course="B.Tech CS",
        institution_name="SMS Lucknow",
        issue_date="2026-08-16",
        encrypted_private_key=enc_priv,
        roll_number="SMS-001",
        certificate_type="Completion",
        grade="PASS",
    )

    # 1. Verify original is valid
    verify_orig = full_verify_pipeline(
        certificate_uid="CERT-SMS-LKO-2026-000001",
        holder_name="Vinayak Singh",
        course="B.Tech CS",
        institution_name="SMS Lucknow",
        issue_date="2026-08-16",
        stored_hash=original_res["data_hash"],
        stored_signature=original_res["signature"],
        public_key_pem=pub_pem,
        roll_number="SMS-001",
        certificate_type="Completion",
        grade="PASS",
    )
    assert verify_orig["hash_match"] is True
    assert verify_orig["signature_valid"] is True

    # 2. Tampered Grade: "PASS" -> "DISTINCTION"
    verify_tampered = full_verify_pipeline(
        certificate_uid="CERT-SMS-LKO-2026-000001",
        holder_name="Vinayak Singh",
        course="B.Tech CS",
        institution_name="SMS Lucknow",
        issue_date="2026-08-16",
        stored_hash=original_res["data_hash"],
        stored_signature=original_res["signature"],
        public_key_pem=pub_pem,
        roll_number="SMS-001",
        certificate_type="Completion",
        grade="DISTINCTION",  # TAMPERED
    )
    assert verify_tampered["hash_match"] is False
    assert verify_tampered["signature_valid"] is False
    assert verify_tampered["current_hash"] != original_res["data_hash"]


def test_pdf_generation_and_hash():
    """Verify PDF generation produces valid relative path and PDF hash."""
    from pathlib import Path
    from app.certificates.pdf_generator import generate_certificate_pdf, compute_pdf_hash

    pdf_path, pdf_hash = generate_certificate_pdf(
        certificate_uid="CERT-TEST-2026-999999",
        holder_name="Test Student",
        course="Test Course",
        institution_name="Test University",
        issue_date="2026-08-18",
        grade="PASS",
    )
    assert pdf_path.endswith("CERT-TEST-2026-999999.pdf")
    assert len(pdf_hash) == 64


@pytest.mark.asyncio
async def test_pdf_file_tampering_verification():
    """Verify that modifying an issued PDF file on disk causes verification to fail with TAMPERED."""
    from pathlib import Path
    from app.core.config import settings
    from app.services.certificate_service import verify_certificate
    from app.seed import seed

    await seed()

    uid = "CERT-SMS-LKO-2026-000001"
    res_orig = await verify_certificate(None, uid)
    assert res_orig["status"] == "VALID"

    pdf_full_path = Path(settings.storage_path) / f"certificates/pdf/{uid}.pdf"
    if pdf_full_path.exists():
        original_bytes = pdf_full_path.read_bytes()
        try:
            pdf_full_path.write_bytes(original_bytes + b"\n% TAMPERED BY TEST\n")
            res_tampered = await verify_certificate(None, uid)
            assert res_tampered["status"] == "TAMPERED"
            assert "TAMPERING DETECTED" in res_tampered["message"]
        finally:
            pdf_full_path.write_bytes(original_bytes)



