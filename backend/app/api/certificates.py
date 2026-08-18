"""
CertiSecure2 — Certificates API

Issue, list, detail, and revoke certificates using JSON storage.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_issuer
from app.models.models import (
    Certificate,
    Institution,
    InstitutionKey,
    User,
)
from app.schemas.schemas import (
    CertificateCreate,
    CertificateDetailResponse,
    CertificateListResponse,
    CertificateResponse,
    RevokeRequest,
)
from app.services.certificate_service import (
    issue_certificate,
    revoke_certificate,
)
from app.services.json_storage import json_storage

router = APIRouter()


@router.post("/", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def create_certificate(
    data: CertificateCreate,
    request: Request,
    current_user: User = Depends(require_issuer),
):
    """Issue a new digitally signed certificate (Issuer or Admin)."""
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="User is not associated with an institution")

    try:
        cert = await issue_certificate(
            db=None,
            holder_name=data.holder_name,
            course=data.course,
            institution_id=current_user.institution_id,
            issued_by=current_user.id,
            roll_number=data.roll_number,
            certificate_type=data.certificate_type,
            holder_email=data.holder_email,
            description=data.description,
            issue_date=data.issue_date,
            expiry_date=data.expiry_date,
            grade=data.grade,
            ip_address=request.client.host if request.client else None,
        )
        return CertificateResponse.model_validate(cert)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=CertificateListResponse)
async def list_certificates(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
):
    """List certificates according to RBAC."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    raw_certs = await json_storage.get_certificates()

    # Role filter
    if user_role == "admin":
        filtered = raw_certs
    elif user_role == "issuer":
        filtered = [c for c in raw_certs if c.get("institution_id") == current_user.institution_id]
    else:  # verifier
        if current_user.email:
            filtered = [c for c in raw_certs if str(c.get("holder_email", "")).strip().lower() == current_user.email.strip().lower()]
        else:
            filtered = []

    # Status filter
    if status_filter:
        filtered = [c for c in filtered if str(c.get("status", "")).strip().lower() == status_filter.strip().lower()]

    # Search filter
    if search:
        s_clean = search.strip().lower()
        filtered = [
            c for c in filtered
            if s_clean in str(c.get("holder_name", "")).lower()
            or s_clean in str(c.get("certificate_uid", "")).lower()
            or s_clean in str(c.get("course", "")).lower()
            or s_clean in str(c.get("roll_number", "")).lower()
        ]

    # Sort descending by created_at
    filtered.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)

    total = len(filtered)
    page_items = filtered[offset : offset + limit]

    certs = [Certificate.from_dict(item) for item in page_items]

    return CertificateListResponse(
        certificates=[CertificateResponse.model_validate(c) for c in certs],
        total=total,
    )


@router.get("/stats")
async def certificate_stats(
    current_user: User = Depends(get_current_user),
):
    """Get certificate statistics for dashboard."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    raw_certs = await json_storage.get_certificates()

    if user_role == "issuer":
        filtered_certs = [c for c in raw_certs if c.get("institution_id") == current_user.institution_id]
    else:
        filtered_certs = raw_certs

    total = len(filtered_certs)
    active = sum(1 for c in filtered_certs if str(c.get("status", "")).lower() == "active")
    revoked = sum(1 for c in filtered_certs if str(c.get("status", "")).lower() == "revoked")

    vlogs = await json_storage.get_verification_logs()
    total_verifications = len(vlogs)
    tampering = sum(1 for v in vlogs if v.get("result") == "TAMPERED")

    insts = await json_storage.list_institutions()
    total_institutions = len(insts)

    return {
        "total_certificates": total,
        "active_certificates": active,
        "revoked_certificates": revoked,
        "total_verifications": total_verifications,
        "registered_institutions": total_institutions,
        "tampering_attempts": tampering,
    }


@router.get("/{certificate_uid}", response_model=CertificateDetailResponse)
async def get_certificate(
    certificate_uid: str,
    current_user: User = Depends(get_current_user),
):
    """Get full details of a specific certificate."""
    cert_dict = await json_storage.get_certificate_by_uid(certificate_uid)
    if not cert_dict:
        raise HTTPException(status_code=404, detail="Certificate not found")

    cert = Certificate.from_dict(cert_dict)

    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role == "issuer" and cert.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Load institution, key, and issuer
    inst_dict = await json_storage.get_institution_by_id(cert.institution_id)
    if inst_dict:
        cert.institution = Institution.from_dict(inst_dict)

    key_dict = await json_storage.get_key_by_id(cert.key_id) or await json_storage.get_active_key(cert.institution_id)
    if key_dict:
        cert.signing_key = InstitutionKey.from_dict(key_dict)

    if cert.issued_by:
        issuer_dict = await json_storage.get_user_by_id(cert.issued_by)
        if issuer_dict:
            cert.issuer = User.from_dict(issuer_dict)

    cert_status_str = cert.status.value if hasattr(cert.status, "value") else str(cert.status)

    return CertificateDetailResponse(
        id=cert.id,
        certificate_uid=cert.certificate_uid,
        holder_name=cert.holder_name,
        holder_email=cert.holder_email,
        roll_number=cert.roll_number,
        course=cert.course,
        certificate_type=cert.certificate_type,
        description=cert.description,
        issue_date=cert.issue_date,
        expiry_date=cert.expiry_date,
        grade=cert.grade,
        status=cert_status_str,
        data_hash=cert.data_hash,
        institution_id=cert.institution_id,
        pdf_path=cert.pdf_path,
        qr_path=cert.qr_path,
        created_at=cert.created_at,
        institution_name=cert.institution.name if cert.institution else None,
        institution_code=cert.institution.code if cert.institution else None,
        signature=cert.signature,
        canonical_data=cert.canonical_data,
        key_id=cert.signing_key.key_id if cert.signing_key else None,
        issued_by_name=cert.issuer.full_name if cert.issuer else None,
    )


@router.post("/{certificate_uid}/revoke")
async def revoke_cert(
    certificate_uid: str,
    data: RevokeRequest,
    request: Request,
    current_user: User = Depends(require_issuer),
):
    """Revoke a certificate (Issuer or Admin)."""
    cert_dict = await json_storage.get_certificate_by_uid(certificate_uid)
    if not cert_dict:
        raise HTTPException(status_code=404, detail="Certificate not found")

    cert = Certificate.from_dict(cert_dict)
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role == "issuer" and cert.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied to revoke this certificate")

    try:
        await revoke_certificate(
            db=None,
            certificate_uid=certificate_uid,
            reason=data.reason,
            revoked_by=current_user.id,
            reason_detail=data.reason_detail,
            ip_address=request.client.host if request.client else None,
        )
        return {"message": "Certificate revoked successfully", "certificate_uid": certificate_uid}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
