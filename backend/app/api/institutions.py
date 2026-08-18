"""
CertiSecure2 — Institutions API

Manage institutions, keys, and the issuer registry using JSON storage.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_admin
from app.crypto.keys import generate_keypair, get_public_key_fingerprint
from app.models.models import (
    Institution,
    InstitutionKey,
    InstitutionStatus,
    User,
)
from app.schemas.schemas import (
    InstitutionCreate,
    InstitutionDetailResponse,
    InstitutionListResponse,
    InstitutionResponse,
    InstitutionUpdate,
)
from app.services.audit_service import AuditAction, log_event
from app.services.json_storage import json_storage

router = APIRouter()


@router.post("/", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_institution(
    data: InstitutionCreate,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Create a new institution (Admin only). Auto-generates Ed25519 keypair."""
    existing = await json_storage.get_institution_by_code(data.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"Institution code '{data.code}' already exists")

    inst_obj = Institution(
        name=data.name,
        code=data.code,
        domain=data.domain,
        description=data.description,
        status=InstitutionStatus.VERIFIED,
    )
    saved_inst = await json_storage.add_institution(inst_obj.to_dict())
    institution = Institution.from_dict(saved_inst)

    public_key_pem, encrypted_private_key, key_id = generate_keypair()
    key_obj = InstitutionKey(
        institution_id=institution.id,
        key_id=key_id,
        public_key_pem=public_key_pem,
        encrypted_private_key=encrypted_private_key,
        is_active=True,
    )
    await json_storage.add_institution_key(key_obj.to_dict())

    await log_event(
        None,
        action=AuditAction.INSTITUTION_CREATED,
        actor_id=current_user.id,
        resource_type="institution",
        resource_id=str(institution.id),
        ip_address=request.client.host if request.client else None,
        metadata={"name": data.name, "code": data.code},
    )

    await log_event(
        None,
        action=AuditAction.KEY_GENERATED,
        actor_id=current_user.id,
        resource_type="institution_key",
        resource_id=key_id,
        ip_address=request.client.host if request.client else None,
    )

    return InstitutionResponse.model_validate(institution)


@router.get("/", response_model=InstitutionListResponse)
async def list_institutions(
    status_filter: str = None,
    offset: int = 0,
    limit: int = 50,
):
    """List institutions (public)."""
    raw_insts = await json_storage.list_institutions(status_filter=status_filter)
    raw_insts.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)

    total = len(raw_insts)
    page = raw_insts[offset : offset + limit]

    institutions = [Institution.from_dict(i) for i in page]

    return InstitutionListResponse(
        institutions=[InstitutionResponse.model_validate(i) for i in institutions],
        total=total,
    )


@router.get("/{institution_id}", response_model=InstitutionDetailResponse)
async def get_institution(
    institution_id: int,
):
    """Get detailed institution info including active public key fingerprint."""
    inst_dict = await json_storage.get_institution_by_id(institution_id)
    if not inst_dict:
        raise HTTPException(status_code=404, detail="Institution not found")
    institution = Institution.from_dict(inst_dict)

    active_key_dict = await json_storage.get_active_key(institution_id)
    active_key = InstitutionKey.from_dict(active_key_dict) if active_key_dict else None

    certs = await json_storage.get_certificates()
    cert_count = sum(1 for c in certs if c.get("institution_id") == institution_id)

    status_str = institution.status.value if hasattr(institution.status, "value") else str(institution.status)

    return InstitutionDetailResponse(
        id=institution.id,
        name=institution.name,
        code=institution.code,
        domain=institution.domain,
        description=institution.description,
        logo_path=institution.logo_path,
        status=status_str,
        created_at=institution.created_at,
        updated_at=institution.updated_at,
        public_key_id=active_key.key_id if active_key else None,
        public_key_fingerprint=get_public_key_fingerprint(active_key.public_key_pem) if active_key else None,
        certificate_count=cert_count,
    )


@router.put("/{institution_id}/verify")
async def verify_institution(
    institution_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Verify/Approve an institution (Admin only)."""
    updated = await json_storage.update_institution(
        institution_id,
        {"status": InstitutionStatus.VERIFIED.value},
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Institution not found")

    await log_event(
        None,
        action=AuditAction.INSTITUTION_VERIFIED,
        actor_id=current_user.id,
        resource_type="institution",
        resource_id=str(institution_id),
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Institution verified successfully", "status": "verified"}


@router.put("/{institution_id}/suspend")
async def suspend_institution(
    institution_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Suspend an institution (Admin only)."""
    updated = await json_storage.update_institution(
        institution_id,
        {"status": InstitutionStatus.SUSPENDED.value},
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Institution not found")

    await log_event(
        None,
        action=AuditAction.INSTITUTION_SUSPENDED,
        actor_id=current_user.id,
        resource_type="institution",
        resource_id=str(institution_id),
        ip_address=request.client.host if request.client else None,
    )

    return {"message": "Institution suspended", "status": "suspended"}


@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: int,
    data: InstitutionUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update institution profile details."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role == "issuer" and current_user.institution_id != institution_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if user_role not in ["admin", "issuer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.description is not None:
        updates["description"] = data.description
    if data.domain is not None:
        updates["domain"] = data.domain

    updated = await json_storage.update_institution(institution_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Institution not found")

    return InstitutionResponse.model_validate(Institution.from_dict(updated))


@router.post("/{institution_id}/rotate-keys")
async def rotate_keys(
    institution_id: int,
    request: Request,
    current_user: User = Depends(require_admin),
):
    """Rotate Ed25519 keypair for an institution (Admin only)."""
    old_key_dict = await json_storage.deactivate_institution_keys(institution_id)

    public_key_pem, encrypted_private_key, key_id = generate_keypair()
    new_key_obj = InstitutionKey(
        institution_id=institution_id,
        key_id=key_id,
        public_key_pem=public_key_pem,
        encrypted_private_key=encrypted_private_key,
        is_active=True,
    )
    await json_storage.add_institution_key(new_key_obj.to_dict())

    await log_event(
        None,
        action=AuditAction.KEY_ROTATED,
        actor_id=current_user.id,
        resource_type="institution_key",
        resource_id=key_id,
        ip_address=request.client.host if request.client else None,
        metadata={"institution_id": institution_id, "old_key_id": old_key_dict.get("key_id") if old_key_dict else None},
    )

    return {"message": "Keys rotated successfully", "new_key_id": key_id}


@router.get("/{institution_id}/public-key")
async def get_public_key(
    institution_id: int,
):
    """Get active public key for verification (public endpoint)."""
    key_dict = await json_storage.get_active_key(institution_id)
    if not key_dict:
        raise HTTPException(status_code=404, detail="No active key found for this institution")

    key = InstitutionKey.from_dict(key_dict)
    return {
        "key_id": key.key_id,
        "public_key_pem": key.public_key_pem,
        "fingerprint": get_public_key_fingerprint(key.public_key_pem),
        "created_at": key.created_at.isoformat() if key.created_at else None,
    }
