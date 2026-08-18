"""
CertiSecure2 — Application Configuration

Loads all settings from environment variables with sensible defaults.
Uses pydantic-settings for type-safe configuration.
"""

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # -- Application --
    app_name: str = "CertiSecure2"
    app_env: str = "development"
    debug: bool = True
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    # -- Data Storage --
    data_directory: str = "./data"

    # -- Security --
    secret_key: str = "CHANGE-ME-TO-A-RANDOM-64-CHAR-STRING"
    jwt_secret_key: str = "CHANGE-ME-TO-ANOTHER-RANDOM-64-CHAR-STRING"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # -- Cryptography --
    # Master key for encrypting institution private keys at rest (Fernet key)
    master_encryption_key: str = "CHANGE-ME-GENERATE-A-FERNET-KEY"

    # -- Storage --
    storage_path: str = "./storage"
    certificate_storage_path: str = "./storage/certificates"

    # -- Rate Limiting --
    rate_limit_verify: str = "30/minute"

    # -- CORS --
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def data_path(self) -> Path:
        import os
        is_vercel = bool(os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"))
        path = Path("/tmp/data") if is_vercel else Path(self.data_directory)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def storage_dir(self) -> Path:
        import os
        is_vercel = bool(os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"))
        path = Path("/tmp/storage") if is_vercel else Path(self.storage_path)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def certificate_dir(self) -> Path:
        import os
        is_vercel = bool(os.environ.get("VERCEL") or os.environ.get("VERCEL_ENV"))
        path = Path("/tmp/storage/certificates") if is_vercel else Path(self.certificate_storage_path)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()

