"""
CertiSecure2 — Pydantic Schemas

Request/response schemas for all API endpoints.
Provides input validation and serialization.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ============================================================
# Auth Schemas
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


# ============================================================
# User Schemas
# ============================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = "verifier"  # admin, issuer, verifier
    institution_id: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    institution_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int


# ============================================================
# Institution Schemas
# ============================================================

class InstitutionCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    code: str = Field(..., min_length=2, max_length=50, pattern=r"^[A-Z0-9\-]+$")
    domain: Optional[str] = None
    description: Optional[str] = None

    @field_validator("code")
    @classmethod
    def code_uppercase(cls, v):
        return v.upper()


class InstitutionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None


class InstitutionResponse(BaseModel):
    id: int
    name: str
    code: str
    domain: Optional[str] = None
    description: Optional[str] = None
    logo_path: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InstitutionDetailResponse(InstitutionResponse):
    public_key_id: Optional[str] = None
    public_key_fingerprint: Optional[str] = None
    certificate_count: int = 0


class InstitutionListResponse(BaseModel):
    institutions: List[InstitutionResponse]
    total: int


# ============================================================
# Certificate Schemas
# ============================================================

class CertificateCreate(BaseModel):
    holder_name: str = Field(..., min_length=2, max_length=255)
    holder_email: Optional[EmailStr] = None
    roll_number: Optional[str] = Field(None, max_length=100)
    course: str = Field(..., min_length=2, max_length=500)
    certificate_type: str = Field(default="Completion", max_length=100)
    description: Optional[str] = None
    issue_date: Optional[str] = None  # ISO format, defaults to today
    expiry_date: Optional[str] = None
    grade: Optional[str] = None


class CertificateResponse(BaseModel):
    id: int
    certificate_uid: str
    holder_name: str
    holder_email: Optional[str] = None
    roll_number: Optional[str] = None
    course: str
    certificate_type: str
    description: Optional[str] = None
    issue_date: datetime
    expiry_date: Optional[datetime] = None
    grade: Optional[str] = None
    status: str
    data_hash: str
    institution_id: int
    pdf_path: Optional[str] = None
    qr_path: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CertificateDetailResponse(CertificateResponse):
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    signature: str
    canonical_data: str
    key_id: Optional[str] = None
    issued_by_name: Optional[str] = None


class CertificateListResponse(BaseModel):
    certificates: List[CertificateResponse]
    total: int


# ============================================================
# Verification Schemas
# ============================================================

class CryptoVerificationResult(BaseModel):
    hash_match: bool
    signature_valid: bool
    original_hash: str
    current_hash: str
    algorithm: str
    hash_algorithm: str


class IssuerInfo(BaseModel):
    name: str
    code: str
    status: str
    verified: bool
    public_key_fingerprint: Optional[str] = None


class RevocationInfo(BaseModel):
    revoked_at: datetime
    reason: str
    reason_detail: Optional[str] = None


class VerificationResponse(BaseModel):
    status: str  # VALID, TAMPERED, REVOKED, NOT_FOUND
    message: str
    certificate: Optional[Dict[str, Any]] = None
    crypto: Optional[CryptoVerificationResult] = None
    issuer: Optional[IssuerInfo] = None
    revocation: Optional[RevocationInfo] = None
    verified_at: datetime


# ============================================================
# Revocation Schemas
# ============================================================

class RevokeRequest(BaseModel):
    reason: str = Field(..., pattern=r"^(incorrect_information|fraud|duplicate_issuance|administrative_error|other)$")
    reason_detail: Optional[str] = None


# ============================================================
# Audit Log Schemas
# ============================================================

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int


# ============================================================
# Dashboard / Statistics Schemas
# ============================================================

class DashboardStats(BaseModel):
    total_certificates: int = 0
    active_certificates: int = 0
    revoked_certificates: int = 0
    total_verifications: int = 0
    registered_institutions: int = 0
    tampering_attempts: int = 0


# Resolve forward references
TokenResponse.model_rebuild()
