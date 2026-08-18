"""
CertiSecure2 — JSON Storage Service

Provides atomic, thread-safe JSON file persistence for local SIH prototype.
Files managed in data_directory (default: ./data):
- users.json
- issuers.json
- certificates.json
- revocations.json
- audit_logs.json
- verification_logs.json
"""

import asyncio
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings


class JSONStorage:
    """Atomic, thread-safe JSON storage manager."""

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = Path(data_dir or getattr(settings, "data_directory", "./data"))
        self._lock = asyncio.Lock()

        # File paths
        self.users_file = self.data_dir / "users.json"
        self.issuers_file = self.data_dir / "issuers.json"
        self.certificates_file = self.data_dir / "certificates.json"
        self.revocations_file = self.data_dir / "revocations.json"
        self.audit_logs_file = self.data_dir / "audit_logs.json"
        self.verification_logs_file = self.data_dir / "verification_logs.json"

    def initialize(self):
        """Ensure storage directory and JSON files exist."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        files = [
            self.users_file,
            self.issuers_file,
            self.certificates_file,
            self.revocations_file,
            self.audit_logs_file,
            self.verification_logs_file,
        ]
        for f in files:
            if not f.exists() or f.stat().st_size == 0:
                self._write_file_sync(f, [])

        # Auto-seed demo data if storage has no users
        if len(self._read_file_sync(self.users_file)) == 0:
            try:
                import asyncio
                from app.seed import seed
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(seed())
                except RuntimeError:
                    asyncio.run(seed())
            except Exception:
                pass

    def _read_file_sync(self, file_path: Path) -> List[Dict[str, Any]]:
        """Synchronously read a JSON file safely."""
        if not file_path.exists() or file_path.stat().st_size == 0:
            return []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_file_sync(self, file_path: Path, data: List[Dict[str, Any]]):
        """Synchronously write JSON data atomically using temporary file."""
        dir_name = file_path.parent
        dir_name.mkdir(parents=True, exist_ok=True)

        with tempfile.NamedTemporaryFile("w", dir=dir_name, delete=False, encoding="utf-8") as tf:
            json.dump(data, tf, indent=2, ensure_ascii=False, default=str)
            temp_name = tf.name

        os.replace(temp_name, file_path)

    async def _read_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Read JSON file with lock."""
        async with self._lock:
            return self._read_file_sync(file_path)

    async def _write_file(self, file_path: Path, data: List[Dict[str, Any]]):
        """Write JSON file with lock."""
        async with self._lock:
            self._write_file_sync(file_path, data)

    def reset_all_data(self):
        """Reset all data files (used by seed script)."""
        self.initialize()
        self._write_file_sync(self.users_file, [])
        self._write_file_sync(self.issuers_file, [])
        self._write_file_sync(self.certificates_file, [])
        self._write_file_sync(self.revocations_file, [])
        self._write_file_sync(self.audit_logs_file, [])
        self._write_file_sync(self.verification_logs_file, [])

    # ============================================================
    # Users & Student Accounts
    # ============================================================

    async def get_users(self) -> List[Dict[str, Any]]:
        return await self._read_file(self.users_file)

    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        users = await self.get_users()
        for u in users:
            if u.get("id") == user_id and u.get("type", "user") == "user":
                return u
        return None

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        users = await self.get_users()
        email_clean = email.strip().lower()
        for u in users:
            if u.get("email", "").strip().lower() == email_clean and u.get("type", "user") == "user":
                return u
        return None

    async def get_student_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        users = await self.get_users()
        email_clean = email.strip().lower()
        for u in users:
            if u.get("email", "").strip().lower() == email_clean and u.get("type", "student") == "student":
                return u
        return None

    async def add_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            users = self._read_file_sync(self.users_file)
            if "id" not in user_data or not user_data["id"]:
                max_id = max([u.get("id", 0) for u in users], default=0)
                user_data["id"] = max_id + 1
            if "created_at" not in user_data:
                user_data["created_at"] = datetime.now(timezone.utc).isoformat()
            if "updated_at" not in user_data:
                user_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            user_data.setdefault("type", "user")
            users.append(user_data)
            self._write_file_sync(self.users_file, users)
            return user_data

    # ============================================================
    # Institutions & Keys
    # ============================================================

    async def get_issuers_data(self) -> List[Dict[str, Any]]:
        return await self._read_file(self.issuers_file)

    async def list_institutions(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        data = await self.get_issuers_data()
        institutions = [item for item in data if item.get("type") == "institution"]
        if status_filter:
            institutions = [i for i in institutions if i.get("status") == status_filter]
        return institutions

    async def get_institution_by_id(self, inst_id: int) -> Optional[Dict[str, Any]]:
        data = await self.get_issuers_data()
        for item in data:
            if item.get("type") == "institution" and item.get("id") == inst_id:
                return item
        return None

    async def get_institution_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        data = await self.get_issuers_data()
        code_upper = code.strip().upper()
        for item in data:
            if item.get("type") == "institution" and item.get("code", "").strip().upper() == code_upper:
                return item
        return None

    async def add_institution(self, inst_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            data = self._read_file_sync(self.issuers_file)
            insts = [item for item in data if item.get("type") == "institution"]
            if "id" not in inst_data or not inst_data["id"]:
                max_id = max([i.get("id", 0) for i in insts], default=0)
                inst_data["id"] = max_id + 1
            inst_data["type"] = "institution"
            if "created_at" not in inst_data:
                inst_data["created_at"] = datetime.now(timezone.utc).isoformat()
            if "updated_at" not in inst_data:
                inst_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            data.append(inst_data)
            self._write_file_sync(self.issuers_file, data)
            return inst_data

    async def update_institution(self, inst_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self._lock:
            data = self._read_file_sync(self.issuers_file)
            updated_inst = None
            for item in data:
                if item.get("type") == "institution" and item.get("id") == inst_id:
                    item.update(updates)
                    item["updated_at"] = datetime.now(timezone.utc).isoformat()
                    updated_inst = item
                    break
            if updated_inst:
                self._write_file_sync(self.issuers_file, data)
            return updated_inst

    async def get_institution_keys(self, inst_id: int) -> List[Dict[str, Any]]:
        data = await self.get_issuers_data()
        keys = [item for item in data if item.get("type") == "key" and item.get("institution_id") == inst_id]
        keys.sort(key=lambda k: str(k.get("created_at", "")), reverse=True)
        return keys

    async def get_active_key(self, inst_id: int) -> Optional[Dict[str, Any]]:
        keys = await self.get_institution_keys(inst_id)
        for k in keys:
            if k.get("is_active"):
                return k
        return keys[0] if keys else None

    async def get_key_by_id(self, key_id_val: Any) -> Optional[Dict[str, Any]]:
        data = await self.get_issuers_data()
        for item in data:
            if item.get("type") == "key":
                if item.get("id") == key_id_val or item.get("key_id") == str(key_id_val):
                    return item
        return None

    async def add_institution_key(self, key_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            data = self._read_file_sync(self.issuers_file)
            all_keys = [item for item in data if item.get("type") == "key"]
            if "id" not in key_data or not key_data["id"]:
                max_id = max([k.get("id", 0) for k in all_keys], default=0)
                key_data["id"] = max_id + 1
            key_data["type"] = "key"
            if "created_at" not in key_data:
                key_data["created_at"] = datetime.now(timezone.utc).isoformat()
            data.append(key_data)
            self._write_file_sync(self.issuers_file, data)
            return key_data

    async def deactivate_institution_keys(self, inst_id: int) -> Optional[Dict[str, Any]]:
        async with self._lock:
            data = self._read_file_sync(self.issuers_file)
            last_deactivated = None
            for item in data:
                if item.get("type") == "key" and item.get("institution_id") == inst_id and item.get("is_active"):
                    item["is_active"] = False
                    item["deactivated_at"] = datetime.now(timezone.utc).isoformat()
                    last_deactivated = item
            if last_deactivated:
                self._write_file_sync(self.issuers_file, data)
            return last_deactivated

    # ============================================================
    # Certificates
    # ============================================================

    async def get_certificates(self) -> List[Dict[str, Any]]:
        return await self._read_file(self.certificates_file)

    async def get_certificate_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        certs = await self.get_certificates()
        uid_clean = uid.strip().upper()
        for c in certs:
            if c.get("certificate_uid", "").strip().upper() == uid_clean:
                return c
        return None

    async def get_certificate_by_id(self, cert_id: int) -> Optional[Dict[str, Any]]:
        certs = await self.get_certificates()
        for c in certs:
            if c.get("id") == cert_id:
                return c
        return None

    async def add_certificate(self, cert_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            certs = self._read_file_sync(self.certificates_file)
            if "id" not in cert_data or not cert_data["id"]:
                max_id = max([c.get("id", 0) for c in certs], default=0)
                cert_data["id"] = max_id + 1
            if "created_at" not in cert_data:
                cert_data["created_at"] = datetime.now(timezone.utc).isoformat()
            certs.append(cert_data)
            self._write_file_sync(self.certificates_file, certs)
            return cert_data

    async def update_certificate(self, cert_uid: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self._lock:
            certs = self._read_file_sync(self.certificates_file)
            uid_clean = cert_uid.strip().upper()
            updated_cert = None
            for c in certs:
                if c.get("certificate_uid", "").strip().upper() == uid_clean:
                    c.update(updates)
                    updated_cert = c
                    break
            if updated_cert:
                self._write_file_sync(self.certificates_file, certs)
            return updated_cert

    # ============================================================
    # Revocations
    # ============================================================

    async def get_revocations(self) -> List[Dict[str, Any]]:
        return await self._read_file(self.revocations_file)

    async def get_revocation_by_cert_id(self, cert_id: int) -> Optional[Dict[str, Any]]:
        revs = await self.get_revocations()
        for r in revs:
            if r.get("certificate_id") == cert_id:
                return r
        return None

    async def add_revocation(self, rev_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            revs = self._read_file_sync(self.revocations_file)
            if "id" not in rev_data or not rev_data["id"]:
                max_id = max([r.get("id", 0) for r in revs], default=0)
                rev_data["id"] = max_id + 1
            if "revoked_at" not in rev_data:
                rev_data["revoked_at"] = datetime.now(timezone.utc).isoformat()
            revs.append(rev_data)
            self._write_file_sync(self.revocations_file, revs)
            return rev_data

    # ============================================================
    # Verification Logs
    # ============================================================

    async def get_verification_logs(self) -> List[Dict[str, Any]]:
        return await self._read_file(self.verification_logs_file)

    async def add_verification_log(self, vlog_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            vlogs = self._read_file_sync(self.verification_logs_file)
            if "id" not in vlog_data or not vlog_data["id"]:
                max_id = max([v.get("id", 0) for v in vlogs], default=0)
                vlog_data["id"] = max_id + 1
            if "created_at" not in vlog_data:
                vlog_data["created_at"] = datetime.now(timezone.utc).isoformat()
            vlogs.append(vlog_data)
            self._write_file_sync(self.verification_logs_file, vlogs)
            return vlog_data

    # ============================================================
    # Audit Logs
    # ============================================================

    async def get_audit_logs(self) -> List[Dict[str, Any]]:
        return await self._read_file(self.audit_logs_file)

    async def add_audit_log(self, alog_data: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            alogs = self._read_file_sync(self.audit_logs_file)
            if "id" not in alog_data or not alog_data["id"]:
                max_id = max([a.get("id", 0) for a in alogs], default=0)
                alog_data["id"] = max_id + 1
            if "created_at" not in alog_data:
                alog_data["created_at"] = datetime.now(timezone.utc).isoformat()
            alogs.append(alog_data)
            self._write_file_sync(self.audit_logs_file, alogs)
            return alog_data


json_storage = JSONStorage()
