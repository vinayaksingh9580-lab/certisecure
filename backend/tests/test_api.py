"""
CertiSecure2 — API End-to-End Tests

Tests:
1. Health check endpoint
2. Public verification endpoint for valid, tampered, non-existent certs
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    """Verify health endpoint returns 200 and healthy status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["version"] == "2.0.0"


@pytest.mark.asyncio
async def test_public_verify_not_found():
    """Verify non-existent certificate returns NOT_FOUND status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/verify/CERT-INVALID-999999")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "NOT_FOUND"
    assert data["certificate"] is None


@pytest.mark.asyncio
async def test_public_verify_valid_and_revoked():
    """Verify valid and revoked certificate endpoints."""
    from app.seed import seed
    await seed()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Valid cert
        resp_valid = await ac.get("/api/verify/CERT-SMS-LKO-2026-000001")
        assert resp_valid.status_code == 200
        assert resp_valid.json()["status"] == "VALID"

        # Revoked cert
        resp_rev = await ac.get("/api/verify/CERT-SMS-LKO-2026-000002")
        assert resp_rev.status_code == 200
        assert resp_rev.json()["status"] == "REVOKED"


