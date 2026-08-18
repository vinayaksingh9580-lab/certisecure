"""
CertiSecure — Audit Service

Append-only audit log recording for all important system events using JSON storage.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple, List

from app.models.models import AuditLog
from app.services.json_storage import json_storage


# Audit action constants
class AuditAction:
    USER_LOGIN = "USER_LOGIN"
    USER_CREATED = "USER_CREATED"
    INSTITUTION_CREATED = "INSTITUTION_CREATED"
    INSTITUTION_VERIFIED = "INSTITUTION_VERIFIED"
    INSTITUTION_SUSPENDED = "INSTITUTION_SUSPENDED"
    KEY_GENERATED = "KEY_GENERATED"
    KEY_ROTATED = "KEY_ROTATED"
    CERT_ISSUED = "CERT_ISSUED"
    CERT_REVOKED = "CERT_REVOKED"
    CERT_VERIFIED = "CERT_VERIFIED"
    CERT_DOWNLOADED = "CERT_DOWNLOADED"
    CERT_BULK_ISSUED = "CERT_BULK_ISSUED"
    TEMPLATE_CREATED = "TEMPLATE_CREATED"
    TEMPLATE_MODIFIED = "TEMPLATE_MODIFIED"


async def log_event(
    db: Any = None,
    action: str = "",
    actor_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """Record an audit event. This is append-only."""
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        metadata_json=json.dumps(metadata) if metadata else None,
        created_at=datetime.now(timezone.utc),
    )
    await json_storage.add_audit_log(entry.to_dict())


async def get_audit_logs(
    db: Any = None,
    action: Optional[str] = None,
    actor_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
) -> Tuple[List[AuditLog], int]:
    """Retrieve audit logs with optional filtering."""
    raw_logs = await json_storage.get_audit_logs()

    # Filter
    filtered = []
    for log_dict in raw_logs:
        if action and log_dict.get("action") != action:
            continue
        if actor_id and log_dict.get("actor_id") != actor_id:
            continue
        if resource_type and log_dict.get("resource_type") != resource_type:
            continue
        filtered.append(log_dict)

    # Sort descending by created_at
    filtered.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)

    total = len(filtered)
    page_items = filtered[offset : offset + limit]

    result = [AuditLog.from_dict(item) for item in page_items]
    return result, total
