"""
CertiSecure — Public Verification API

The most critical public-facing endpoint.
Performs real cryptographic verification — no boolean trust.
"""

from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.certificate_service import verify_certificate

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/{certificate_uid}")
@limiter.limit("30/minute")
async def verify(
    certificate_uid: str,
    request: Request,
):
    """
    Public certificate verification endpoint.

    Performs real cryptographic verification:
    1. Fetches certificate and issuer's public key
    2. Rebuilds canonical data from stored fields
    3. Recomputes SHA-256 hash
    4. Verifies Ed25519 signature
    5. Checks revocation status

    Returns one of:
    - VALID: Certificate is authentic
    - TAMPERED: Data has been modified (signature mismatch)
    - REVOKED: Certificate was revoked by issuer
    - NOT_FOUND: No certificate with this ID

    Rate limited: 30 requests/minute per IP.
    """
    result = await verify_certificate(
        db=None,
        certificate_uid=certificate_uid,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return result
