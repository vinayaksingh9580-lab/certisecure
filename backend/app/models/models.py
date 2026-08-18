"""
CertiSecure2 — Data Models for JSON Persistence

Data models for JSON storage while preserving all Enums, relationships, and attributes.
Roles: ADMIN, ISSUER, VERIFIER
"""

import enum
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# ============================================================
# Enums
# ============================================================

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ISSUER = "issuer"
    VERIFIER = "verifier"


class InstitutionStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"


class CertificateStatus(str, enum.Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


class RevocationReason(str, enum.Enum):
    INCORRECT_INFO = "incorrect_information"
    FRAUD = "fraud"
    DUPLICATE = "duplicate_issuance"
    ADMIN_ERROR = "administrative_error"
    OTHER = "other"


def utcnow():
    return datetime.now(timezone.utc)


def parse_dt(val: Any) -> Optional[datetime]:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(str(val))
    except Exception:
        return None


# ============================================================
# Models
# ============================================================

class User:
    def __init__(
        self,
        id: Optional[int] = None,
        email: str = "",
        password_hash: str = "",
        full_name: str = "",
        role: Any = UserRole.VERIFIER,
        institution_id: Optional[int] = None,
        is_active: bool = True,
        created_at: Any = None,
        updated_at: Any = None,
        institution: Any = None,
        **kwargs,
    ):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.full_name = full_name
        self.role = UserRole(role) if isinstance(role, str) else role
        self.institution_id = institution_id
        self.is_active = is_active
        self.created_at = parse_dt(created_at) or utcnow()
        self.updated_at = parse_dt(updated_at) or utcnow()
        self.institution = institution

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": "user",
            "email": self.email,
            "password_hash": self.password_hash,
            "full_name": self.full_name,
            "role": self.role.value if hasattr(self.role, "value") else str(self.role),
            "institution_id": self.institution_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "User":
        return cls(**data)


class StudentAccount:
    def __init__(
        self,
        id: Optional[int] = None,
        user_id: int = 0,
        email: str = "",
        password_hash: str = "",
        full_name: str = "",
        student_code: Optional[str] = None,
        is_active: bool = True,
        created_at: Any = None,
        updated_at: Any = None,
        **kwargs,
    ):
        self.id = id
        self.user_id = user_id
        self.email = email
        self.password_hash = password_hash
        self.full_name = full_name
        self.student_code = student_code
        self.is_active = is_active
        self.created_at = parse_dt(created_at) or utcnow()
        self.updated_at = parse_dt(updated_at) or utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": "student",
            "user_id": self.user_id,
            "email": self.email,
            "password_hash": self.password_hash,
            "full_name": self.full_name,
            "student_code": self.student_code,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StudentAccount":
        return cls(**data)


class Institution:
    def __init__(
        self,
        id: Optional[int] = None,
        name: str = "",
        code: str = "",
        domain: Optional[str] = None,
        description: Optional[str] = None,
        logo_path: Optional[str] = None,
        status: Any = InstitutionStatus.PENDING,
        created_at: Any = None,
        updated_at: Any = None,
        keys: Optional[List[Any]] = None,
        users: Optional[List[Any]] = None,
        certificates: Optional[List[Any]] = None,
        **kwargs,
    ):
        self.id = id
        self.name = name
        self.code = code
        self.domain = domain
        self.description = description
        self.logo_path = logo_path
        self.status = InstitutionStatus(status) if isinstance(status, str) else status
        self.created_at = parse_dt(created_at) or utcnow()
        self.updated_at = parse_dt(updated_at) or utcnow()
        self.keys = keys or []
        self.users = users or []
        self.certificates = certificates or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": "institution",
            "name": self.name,
            "code": self.code,
            "domain": self.domain,
            "description": self.description,
            "logo_path": self.logo_path,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Institution":
        return cls(**data)


class InstitutionKey:
    def __init__(
        self,
        id: Optional[int] = None,
        institution_id: int = 0,
        key_id: str = "",
        public_key_pem: str = "",
        encrypted_private_key: str = "",
        is_active: bool = True,
        created_at: Any = None,
        deactivated_at: Any = None,
        institution: Any = None,
        **kwargs,
    ):
        self.id = id
        self.institution_id = institution_id
        self.key_id = key_id
        self.public_key_pem = public_key_pem
        self.encrypted_private_key = encrypted_private_key
        self.is_active = is_active
        self.created_at = parse_dt(created_at) or utcnow()
        self.deactivated_at = parse_dt(deactivated_at)
        self.institution = institution

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": "key",
            "institution_id": self.institution_id,
            "key_id": self.key_id,
            "public_key_pem": self.public_key_pem,
            "encrypted_private_key": self.encrypted_private_key,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "deactivated_at": self.deactivated_at.isoformat() if self.deactivated_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "InstitutionKey":
        return cls(**data)


class Certificate:
    def __init__(
        self,
        id: Optional[int] = None,
        certificate_uid: str = "",
        institution_id: int = 0,
        key_id: Any = None,
        holder_name: str = "",
        holder_email: Optional[str] = None,
        roll_number: Optional[str] = None,
        course: str = "",
        certificate_type: str = "Completion",
        description: Optional[str] = None,
        issue_date: Any = None,
        expiry_date: Any = None,
        grade: Optional[str] = None,
        canonical_data: str = "",
        data_hash: str = "",
        signature: str = "",
        status: Any = CertificateStatus.ACTIVE,
        pdf_path: Optional[str] = None,
        pdf_hash: Optional[str] = None,
        qr_path: Optional[str] = None,
        issued_by: int = 0,
        created_at: Any = None,
        institution: Any = None,
        signing_key: Any = None,
        issuer: Any = None,
        revocation: Any = None,
        **kwargs,
    ):
        self.id = id
        self.certificate_uid = certificate_uid
        self.institution_id = institution_id
        self.key_id = key_id
        self.holder_name = holder_name
        self.holder_email = holder_email
        self.roll_number = roll_number
        self.course = course
        self.certificate_type = certificate_type
        self.description = description
        self.issue_date = parse_dt(issue_date) or utcnow()
        self.expiry_date = parse_dt(expiry_date)
        self.grade = grade
        self.canonical_data = canonical_data
        self.data_hash = data_hash
        self.signature = signature
        self.status = CertificateStatus(status) if isinstance(status, str) else status
        self.pdf_path = pdf_path
        self.pdf_hash = pdf_hash
        self.qr_path = qr_path
        self.issued_by = issued_by
        self.created_at = parse_dt(created_at) or utcnow()
        self.institution = institution
        self.signing_key = signing_key
        self.issuer = issuer
        self.revocation = revocation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "certificate_uid": self.certificate_uid,
            "institution_id": self.institution_id,
            "key_id": self.key_id,
            "holder_name": self.holder_name,
            "holder_email": self.holder_email,
            "roll_number": self.roll_number,
            "course": self.course,
            "certificate_type": self.certificate_type,
            "description": self.description,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "grade": self.grade,
            "canonical_data": self.canonical_data,
            "data_hash": self.data_hash,
            "signature": self.signature,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "pdf_path": self.pdf_path,
            "pdf_hash": self.pdf_hash,
            "qr_path": self.qr_path,
            "issued_by": self.issued_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Certificate":
        return cls(**data)


class VerificationLog:
    def __init__(
        self,
        id: Optional[int] = None,
        certificate_id: Optional[int] = None,
        certificate_uid: str = "",
        result: str = "VALID",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        created_at: Any = None,
        certificate: Any = None,
        **kwargs,
    ):
        self.id = id
        self.certificate_id = certificate_id
        self.certificate_uid = certificate_uid
        self.result = result
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.created_at = parse_dt(created_at) or utcnow()
        self.certificate = certificate

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "certificate_id": self.certificate_id,
            "certificate_uid": self.certificate_uid,
            "result": self.result,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VerificationLog":
        return cls(**data)


class Revocation:
    def __init__(
        self,
        id: Optional[int] = None,
        certificate_id: int = 0,
        reason: Any = RevocationReason.OTHER,
        reason_detail: Optional[str] = None,
        revoked_by: int = 0,
        revoked_at: Any = None,
        certificate: Any = None,
        revoker: Any = None,
        **kwargs,
    ):
        self.id = id
        self.certificate_id = certificate_id
        self.reason = RevocationReason(reason) if isinstance(reason, str) else reason
        self.reason_detail = reason_detail
        self.revoked_by = revoked_by
        self.revoked_at = parse_dt(revoked_at) or utcnow()
        self.certificate = certificate
        self.revoker = revoker

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "certificate_id": self.certificate_id,
            "reason": self.reason.value if hasattr(self.reason, "value") else str(self.reason),
            "reason_detail": self.reason_detail,
            "revoked_by": self.revoked_by,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Revocation":
        return cls(**data)


class AuditLog:
    def __init__(
        self,
        id: Optional[int] = None,
        actor_id: Optional[int] = None,
        action: str = "",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        metadata_json: Optional[str] = None,
        created_at: Any = None,
        actor: Any = None,
        **kwargs,
    ):
        self.id = id
        self.actor_id = actor_id
        self.action = action
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.ip_address = ip_address
        self.metadata_json = metadata_json
        self.created_at = parse_dt(created_at) or utcnow()
        self.actor = actor

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "actor_id": self.actor_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "ip_address": self.ip_address,
            "metadata_json": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AuditLog":
        return cls(**data)
