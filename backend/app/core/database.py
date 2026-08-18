"""
CertiSecure2 — JSON Storage Helper

Replaces SQLAlchemy engine with JSON file storage initialization.
"""

from app.services.json_storage import JSONStorage, json_storage


async def get_db() -> JSONStorage:
    """Dependency yielding JSONStorage instance."""
    yield json_storage


async def get_student_db() -> JSONStorage:
    """Dependency yielding JSONStorage instance."""
    yield json_storage


async def create_tables():
    """Ensure data directory and JSON files are initialized."""
    json_storage.initialize()
