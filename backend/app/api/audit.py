"""
CertiSecure — Audit Logs API
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.security import require_any_admin
from app.models.models import User
from app.schemas.schemas import AuditLogListResponse, AuditLogResponse
from app.services.audit_service import get_audit_logs
from app.services.json_storage import json_storage

router = APIRouter()


@router.get("/", response_model=AuditLogListResponse)
async def list_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_any_admin),
):
    """Get paginated audit logs (admin only)."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    actor_id = None
    if user_role == "institution_admin":
        actor_id = current_user.id

    logs, total = await get_audit_logs(
        db=None,
        action=action,
        actor_id=actor_id,
        resource_type=resource_type,
        offset=offset,
        limit=limit,
    )

    # Enrich with actor names
    result_logs = []
    for log in logs:
        actor_name = None
        if log.actor_id:
            actor_dict = await json_storage.get_user_by_id(log.actor_id)
            if actor_dict:
                actor_name = actor_dict.get("full_name")

        result_logs.append(
            AuditLogResponse(
                id=log.id,
                actor_id=log.actor_id,
                actor_name=actor_name,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                ip_address=log.ip_address,
                metadata_json=log.metadata_json,
                created_at=log.created_at,
            )
        )

    return AuditLogListResponse(logs=result_logs, total=total)
