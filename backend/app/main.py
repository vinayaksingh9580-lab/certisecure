"""
CertiSecure2 — FastAPI Application Entry Point

Configures middleware, CORS, routers, and startup events.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import audit, auth, certificates, institutions, verification
from app.core.config import settings
from app.services.json_storage import json_storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    settings.storage_dir
    settings.certificate_dir
    settings.data_path
    json_storage.initialize()
    
    # Run seed safely within the async lifespan
    users_file = settings.data_path / "users.json"
    if not users_file.exists() or users_file.stat().st_size == 0 or len(json_storage._read_file_sync(users_file)) == 0:
        try:
            from app.seed import seed
            await seed()
        except Exception as e:
            print("Seeding failed:", e)
    
    yield


app = FastAPI(
    title="CertiSecure2 API",
    description="Secure Digital Certificate Verification System using Ed25519 & SHA-256",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# -- CORS --
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Rate Limiting --
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# -- Static Files --
os.makedirs(settings.certificate_dir, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(settings.storage_dir)), name="storage")

# -- API Routers --
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(institutions.router, prefix="/api/institutions", tags=["Institutions"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(verification.router, prefix="/api/verify", tags=["Verification"])
app.include_router(audit.router, prefix="/api/audit-logs", tags=["Audit Logs"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.app_name, "version": "2.0.0"}
