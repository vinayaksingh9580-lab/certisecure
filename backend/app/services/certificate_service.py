"""
CertiSecure2 — Certificate Service

Core business logic for certificate issuance, verification, and revocation using JSON storage:
- UID generation
- Cryptographic signing pipeline (SHA-256 + Ed25519)
- PDF and QR generation
- Revocation management
"""

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from app.certificates.pdf_generator import compute_pdf_hash, generate_certificate_pdf
from app.certificates.qr_generator import generate_qr_code
from app.core.config import settings
from app.crypto.keys import get_public_key_fingerprint
from app.crypto.signing import full_sign_pipeline, full_verify_pipeline
from app.models.models import (
    Certificate,
    CertificateStatus,
    Institution,
    InstitutionKey,
    Revocation,
    RevocationReason,
    User,
    VerificationLog,
)
from app.services.audit_service import AuditAction, log_event
from app.services.json_storage import json_storage


async def generate_certificate_uid(db: Any, institution_code: str) -> str:
    """
    Generate a unique certificate UID.
    Format: CERT-{INSTITUTION_CODE}-{YEAR}-{SEQUENCE:06d}
    Example: CERT-SMS-LKO-2026-000001
    """
    year = datetime.now(timezone.utc).year
    prefix = f"CERT-{institution_code.upper()}-{year}-"

    certs = await json_storage.get_certificates()
    count = sum(1 for c in certs if str(c.get("certificate_uid", "")).startswith(prefix))
    sequence = count + 1

    return f"{prefix}{sequence:06d}"


async def get_active_key(db: Any, institution_id: int) -> Optional[InstitutionKey]:
    """Get the active signing key for an institution."""
    key_dict = await json_storage.get_active_key(institution_id)
    if key_dict:
        return InstitutionKey.from_dict(key_dict)
    return None


async def issue_certificate(
    db: Any,
    holder_name: str,
    course: str,
    institution_id: int,
    issued_by: int,
    roll_number: Optional[str] = None,
    certificate_type: str = "Completion",
    holder_email: Optional[str] = None,
    description: Optional[str] = None,
    issue_date: Optional[str] = None,
    expiry_date: Optional[str] = None,
    grade: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Certificate:
    """
    Issue a new certificate with full cryptographic signing.
    """
    inst_dict = await json_storage.get_institution_by_id(institution_id)
    if not inst_dict:
        raise ValueError("Institution not found")
    institution = Institution.from_dict(inst_dict)

    key = await get_active_key(db, institution_id)
    if not key:
        raise ValueError("No active signing key for this institution. Contact Admin to generate keys.")

    certificate_uid = await generate_certificate_uid(db, institution.code)

    if issue_date:
        parsed_date = datetime.fromisoformat(issue_date).replace(tzinfo=timezone.utc)
    else:
        parsed_date = datetime.now(timezone.utc)

    issue_date_str = parsed_date.strftime("%Y-%m-%d")

    parsed_expiry = None
    if expiry_date:
        parsed_expiry = datetime.fromisoformat(expiry_date).replace(tzinfo=timezone.utc)

    signing_result = full_sign_pipeline(
        certificate_uid=certificate_uid,
        holder_name=holder_name,
        course=course,
        institution_name=institution.name,
        issue_date=issue_date_str,
        encrypted_private_key=key.encrypted_private_key,
        roll_number=roll_number,
        certificate_type=certificate_type,
        grade=grade,
        description=description,
    )

    cert_dict = {
        "certificate_uid": certificate_uid,
        "institution_id": institution_id,
        "key_id": key.id,
        "holder_name": holder_name,
        "holder_email": holder_email,
        "roll_number": roll_number,
        "course": course,
        "certificate_type": certificate_type,
        "description": description,
        "issue_date": parsed_date.isoformat(),
        "expiry_date": parsed_expiry.isoformat() if parsed_expiry else None,
        "grade": grade,
        "canonical_data": signing_result["canonical_data"],
        "data_hash": signing_result["data_hash"],
        "signature": signing_result["signature"],
        "status": CertificateStatus.ACTIVE.value,
        "issued_by": issued_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    saved_cert_dict = await json_storage.add_certificate(cert_dict)
    certificate = Certificate.from_dict(saved_cert_dict)
    certificate.institution = institution
    certificate.signing_key = key

    # Generate QR and PDF
    qr_path = generate_qr_code(certificate_uid)
    pdf_path, pdf_hash = generate_certificate_pdf(
        certificate_uid=certificate_uid,
        holder_name=holder_name,
        course=course,
        institution_name=institution.name,
        issue_date=issue_date_str,
        roll_number=roll_number,
        certificate_type=certificate_type,
        grade=grade,
        description=description,
        qr_path=qr_path,
    )

    certificate.qr_path = qr_path
    certificate.pdf_path = pdf_path
    certificate.pdf_hash = pdf_hash

    await json_storage.update_certificate(
        certificate_uid,
        {
            "qr_path": qr_path,
            "pdf_path": pdf_path,
            "pdf_hash": pdf_hash,
        },
    )

    await log_event(
        db,
        action=AuditAction.CERT_ISSUED,
        actor_id=issued_by,
        resource_type="certificate",
        resource_id=certificate_uid,
        ip_address=ip_address,
        metadata={"holder": holder_name, "course": course, "roll_number": roll_number},
    )

    return certificate


async def verify_certificate(
    db: Any,
    certificate_uid: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Full certificate verification pipeline using JSON storage.
    """
    now = datetime.now(timezone.utc)
    cert_dict = await json_storage.get_certificate_by_uid(certificate_uid)

    if not cert_dict:
        vlog = VerificationLog(
            certificate_uid=certificate_uid,
            result="NOT_FOUND",
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=now,
        )
        await json_storage.add_verification_log(vlog.to_dict())
        return {
            "status": "NOT_FOUND",
            "message": "No certificate found with this ID. Please check the certificate ID and try again.",
            "certificate": None,
            "crypto": None,
            "issuer": None,
            "revocation": None,
            "verified_at": now.isoformat(),
        }

    cert = Certificate.from_dict(cert_dict)

    # Attach institution & key
    inst_dict = await json_storage.get_institution_by_id(cert.institution_id)
    if inst_dict:
        cert.institution = Institution.from_dict(inst_dict)

    key_dict = await json_storage.get_key_by_id(cert.key_id) or await json_storage.get_active_key(cert.institution_id)
    if key_dict:
        cert.signing_key = InstitutionKey.from_dict(key_dict)

    # Attach revocation if exists
    rev_dict = await json_storage.get_revocation_by_cert_id(cert.id)
    if rev_dict:
        rev = Revocation.from_dict(rev_dict)
        if rev.revoked_by:
            revoker_dict = await json_storage.get_user_by_id(rev.revoked_by)
            if revoker_dict:
                rev.revoker = User.from_dict(revoker_dict)
        cert.revocation = rev

    pub_pem = cert.signing_key.public_key_pem if cert.signing_key else ""
    inst_name = cert.institution.name if cert.institution else ""

    crypto_result = full_verify_pipeline(
        certificate_uid=cert.certificate_uid,
        holder_name=cert.holder_name,
        course=cert.course,
        institution_name=inst_name,
        issue_date=cert.issue_date.strftime("%Y-%m-%d"),
        stored_hash=cert.data_hash,
        stored_signature=cert.signature,
        public_key_pem=pub_pem,
        roll_number=cert.roll_number,
        certificate_type=cert.certificate_type,
        grade=cert.grade,
        description=cert.description,
    )

    # Check PDF Document Tampering
    pdf_tampered = False
    if cert.pdf_path:
        full_pdf_path = Path(settings.storage_path) / cert.pdf_path
        if not full_pdf_path.exists():
            pdf_tampered = True
        else:
            current_pdf_hash = compute_pdf_hash(full_pdf_path)
            if cert.pdf_hash and current_pdf_hash != cert.pdf_hash:
                pdf_tampered = True
                crypto_result["current_hash"] = current_pdf_hash

    if pdf_tampered:
        crypto_result["hash_match"] = False
        crypto_result["signature_valid"] = False

    cert_status_str = cert.status.value if hasattr(cert.status, "value") else str(cert.status)

    if not crypto_result["signature_valid"] or not crypto_result["hash_match"]:
        status = "TAMPERED"
        message = "⚠ TAMPERING DETECTED — The certificate data has been modified. The cryptographic signature does not match the current data."
    elif cert_status_str == "revoked" or cert.status == CertificateStatus.REVOKED:
        status = "REVOKED"
        message = "This certificate has been revoked by the issuing institution."
    else:
        status = "VALID"
        message = "This certificate is authentic and has been cryptographically verified."

    issuer_status_str = ""
    public_fp = ""
    if cert.institution:
        issuer_status_str = cert.institution.status.value if hasattr(cert.institution.status, "value") else str(cert.institution.status)
    if cert.signing_key:
        public_fp = get_public_key_fingerprint(cert.signing_key.public_key_pem)

    issuer_info = {
        "name": cert.institution.name if cert.institution else None,
        "code": cert.institution.code if cert.institution else None,
        "status": issuer_status_str,
        "verified": issuer_status_str == "verified",
        "public_key_fingerprint": public_fp,
    }

    revocation_info = None
    if cert.revocation:
        reason_str = cert.revocation.reason.value if hasattr(cert.revocation.reason, "value") else str(cert.revocation.reason)
        revoker_name = cert.revocation.revoker.full_name if (cert.revocation and cert.revocation.revoker) else f"User #{cert.revocation.revoked_by}"
        revocation_info = {
            "revoked_at": cert.revocation.revoked_at.isoformat() if cert.revocation.revoked_at else None,
            "reason": reason_str,
            "reason_detail": cert.revocation.reason_detail,
            "revoked_by": revoker_name,
        }

    cert_info = {
        "certificate_uid": cert.certificate_uid,
        "holder_name": cert.holder_name,
        "holder_email": cert.holder_email,
        "roll_number": cert.roll_number,
        "course": cert.course,
        "certificate_type": cert.certificate_type,
        "description": cert.description,
        "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
        "expiry_date": cert.expiry_date.isoformat() if cert.expiry_date else None,
        "grade": cert.grade,
        "status": cert_status_str,
    }

    vlog = VerificationLog(
        certificate_id=cert.id,
        certificate_uid=certificate_uid,
        result=status,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=now,
    )
    await json_storage.add_verification_log(vlog.to_dict())

    await log_event(
        db,
        action=AuditAction.CERT_VERIFIED,
        resource_type="certificate",
        resource_id=certificate_uid,
        ip_address=ip_address,
        metadata={"result": status},
    )

    return {
        "status": status,
        "message": message,
        "certificate": cert_info,
        "crypto": crypto_result,
        "issuer": issuer_info,
        "revocation": revocation_info,
        "verified_at": now.isoformat(),
    }


async def revoke_certificate(
    db: Any,
    certificate_uid: str,
    reason: str,
    revoked_by: int,
    reason_detail: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Certificate:
    """Revoke a certificate. Creates immutable revocation record."""
    cert_dict = await json_storage.get_certificate_by_uid(certificate_uid)
    if not cert_dict:
        raise ValueError("Certificate not found")

    cert = Certificate.from_dict(cert_dict)
    cert_status_str = cert.status.value if hasattr(cert.status, "value") else str(cert.status)
    if cert_status_str == "revoked" or cert.status == CertificateStatus.REVOKED:
        raise ValueError("Certificate is already revoked")

    revocation = Revocation(
        certificate_id=cert.id,
        reason=RevocationReason(reason),
        reason_detail=reason_detail,
        revoked_by=revoked_by,
        revoked_at=datetime.now(timezone.utc),
    )
    await json_storage.add_revocation(revocation.to_dict())

    await json_storage.update_certificate(certificate_uid, {"status": CertificateStatus.REVOKED.value})
    cert.status = CertificateStatus.REVOKED

    await log_event(
        db,
        action=AuditAction.CERT_REVOKED,
        actor_id=revoked_by,
        resource_type="certificate",
        resource_id=certificate_uid,
        ip_address=ip_address,
        metadata={"reason": reason},
    )

    return cert
