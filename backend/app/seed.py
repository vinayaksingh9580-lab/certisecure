"""
CertiSecure2 — JSON Storage Seed Script

Creates demo data for SIH 2026 demonstration:
- 1 System Admin (admin@certisecure.dev / Admin@2026)
- 3 Institutions with Ed25519 keypairs (SMS Lucknow, IIT Delhi, NIT Trichy)
- 3 Issuers (issuer@sms.edu.in / Issuer@2026)
- 3 Verifiers (verifier@certisecure.dev / Verifier@2026)
- 5 Certificates with Ed25519 signatures, PDFs, and QR codes
- 1 Revoked certificate for demo
- Verification logs and audit trail

Run: python -m app.seed
"""

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.certificates.pdf_generator import generate_certificate_pdf
from app.certificates.qr_generator import generate_qr_code
from app.core.security import hash_password
from app.crypto.keys import generate_keypair
from app.crypto.signing import full_sign_pipeline
from app.models.models import (
    AuditLog,
    Certificate,
    CertificateStatus,
    Institution,
    InstitutionKey,
    InstitutionStatus,
    Revocation,
    RevocationReason,
    User,
    UserRole,
    VerificationLog,
)
from app.services.json_storage import json_storage


async def seed():
    """Seed the JSON storage with demo data."""
    print("[+] Seeding CertiSecure2 JSON storage...")

    # Clear previous data
    json_storage.reset_all_data()

    # ============================================================
    # 1. Institutions
    # ============================================================
    institutions_data = [
        {"name": "SMS Lucknow", "code": "SMS-LKO", "domain": "sms.edu.in", "description": "School of Management Sciences, Lucknow"},
        {"name": "Indian Institute of Technology Delhi", "code": "IIT-DEL", "domain": "iitd.ac.in", "description": "Premier engineering institution"},
        {"name": "National Institute of Technology Trichy", "code": "NIT-TCH", "domain": "nitt.edu", "description": "National Institute of Technology"},
    ]

    institutions = []
    institution_keys = []

    for inst_data in institutions_data:
        inst_obj = Institution(
            name=inst_data["name"],
            code=inst_data["code"],
            domain=inst_data["domain"],
            description=inst_data["description"],
            status=InstitutionStatus.VERIFIED,
        )
        saved_inst_dict = await json_storage.add_institution(inst_obj.to_dict())
        inst = Institution.from_dict(saved_inst_dict)
        institutions.append(inst)

        # Generate Ed25519 keypair
        public_key_pem, encrypted_private_key, key_id = generate_keypair()
        key_obj = InstitutionKey(
            institution_id=inst.id,
            key_id=key_id,
            public_key_pem=public_key_pem,
            encrypted_private_key=encrypted_private_key,
            is_active=True,
        )
        saved_key_dict = await json_storage.add_institution_key(key_obj.to_dict())
        key = InstitutionKey.from_dict(saved_key_dict)
        institution_keys.append(key)

    print(f"  [OK] Created {len(institutions)} institutions with active Ed25519 keypairs")

    # ============================================================
    # 2. Users (RBAC)
    # ============================================================
    # System Admin
    admin_obj = User(
        email="admin@certisecure.dev",
        password_hash=hash_password("Admin@2026"),
        full_name="System Administrator",
        role=UserRole.ADMIN,
        is_active=True,
    )
    saved_admin_dict = await json_storage.add_user(admin_obj.to_dict())
    admin_user = User.from_dict(saved_admin_dict)

    # Issuers
    issuers_data = [
        {"email": "issuer@sms.edu.in", "name": "Dr. Rajesh Kumar (SMS)", "inst_idx": 0},
        {"email": "issuer@iitd.ac.in", "name": "Prof. Priya Sharma (IITD)", "inst_idx": 1},
        {"email": "issuer@nitt.edu", "name": "Dr. Suresh Rajan (NITT)", "inst_idx": 2},
    ]

    issuers = []
    for idata in issuers_data:
        u_obj = User(
            email=idata["email"],
            password_hash=hash_password("Issuer@2026"),
            full_name=idata["name"],
            role=UserRole.ISSUER,
            institution_id=institutions[idata["inst_idx"]].id,
            is_active=True,
        )
        saved_u = await json_storage.add_user(u_obj.to_dict())
        issuers.append(User.from_dict(saved_u))

    # Verifiers
    verifiers_data = [
        {"email": "verifier@certisecure.dev", "name": "Global Verifier Account", "inst_idx": None},
        {"email": "hr@techcorp.com", "name": "HR Recruiter (TechCorp)", "inst_idx": None},
        {"email": "student@sms.edu.in", "name": "Vinayak Singh", "inst_idx": 0},
    ]

    verifiers = []
    for vdata in verifiers_data:
        v_obj = User(
            email=vdata["email"],
            password_hash=hash_password("Verifier@2026"),
            full_name=vdata["name"],
            role=UserRole.VERIFIER,
            institution_id=institutions[vdata["inst_idx"]].id if vdata["inst_idx"] is not None else None,
            is_active=True,
        )
        saved_v = await json_storage.add_user(v_obj.to_dict())
        verifiers.append(User.from_dict(saved_v))

    print(f"  [OK] Created users: 1 Admin, {len(issuers)} Issuers, {len(verifiers)} Verifiers")

    # ============================================================
    # 3. Certificates
    # ============================================================
    certificates_seed = [
        {
            "holder_name": "Vinayak Singh",
            "holder_email": "student@sms.edu.in",
            "roll_number": "SMS-2026-CS-042",
            "course": "B.Tech Computer Science & Engineering",
            "certificate_type": "Completion",
            "grade": "PASS",
            "description": "Successfully completed 4-year undergraduate program in Computer Science.",
            "inst_idx": 0,
        },
        {
            "holder_name": "Ananya Gupta",
            "holder_email": "ananya@sms.edu.in",
            "roll_number": "SMS-2026-CS-015",
            "course": "Artificial Intelligence & Machine Learning",
            "certificate_type": "Achievement",
            "grade": "DISTINCTION",
            "description": "Achieved top rank in AI/ML specialized certification.",
            "inst_idx": 0,
        },
        {
            "holder_name": "Rahul Verma",
            "holder_email": "rahul@iitd.ac.in",
            "roll_number": "IITD-2025-CS-108",
            "course": "Advanced Cybersecurity & Cryptography",
            "certificate_type": "Completion",
            "grade": "A+",
            "description": "Completed advanced course in cryptographic verification protocols.",
            "inst_idx": 1,
        },
        {
            "holder_name": "Sneha Patel",
            "holder_email": "sneha@iitd.ac.in",
            "roll_number": "IITD-2025-EE-094",
            "course": "Embedded Systems & Internet of Things",
            "certificate_type": "Participation",
            "grade": "MERIT",
            "description": "Participated in national IoT innovation challenge.",
            "inst_idx": 1,
        },
        {
            "holder_name": "Arjun Krishnan",
            "holder_email": "arjun@nitt.edu",
            "roll_number": "NITT-2026-EC-055",
            "course": "Cloud Native Architecture & DevOps",
            "certificate_type": "Completion",
            "grade": "FIRST CLASS",
            "description": "Completed hands-on certification in Microservices architecture.",
            "inst_idx": 2,
        },
    ]

    certificates = []
    for idx, item in enumerate(certificates_seed):
        inst_idx = item["inst_idx"]
        inst = institutions[inst_idx]
        key = institution_keys[inst_idx]
        issuer_user = issuers[inst_idx]

        issue_date = datetime.now(timezone.utc) - timedelta(days=15 - idx)
        issue_date_str = issue_date.strftime("%Y-%m-%d")

        cert_uid = f"CERT-{inst.code}-2026-{(idx + 1):06d}"

        signing_result = full_sign_pipeline(
            certificate_uid=cert_uid,
            holder_name=item["holder_name"],
            course=item["course"],
            institution_name=inst.name,
            issue_date=issue_date_str,
            encrypted_private_key=key.encrypted_private_key,
            roll_number=item["roll_number"],
            certificate_type=item["certificate_type"],
            grade=item["grade"],
            description=item["description"],
        )

        cert_obj = Certificate(
            certificate_uid=cert_uid,
            institution_id=inst.id,
            key_id=key.id,
            holder_name=item["holder_name"],
            holder_email=item["holder_email"],
            roll_number=item["roll_number"],
            course=item["course"],
            certificate_type=item["certificate_type"],
            description=item["description"],
            issue_date=issue_date,
            grade=item["grade"],
            canonical_data=signing_result["canonical_data"],
            data_hash=signing_result["data_hash"],
            signature=signing_result["signature"],
            status=CertificateStatus.ACTIVE,
            issued_by=issuer_user.id,
        )

        saved_cert_dict = await json_storage.add_certificate(cert_obj.to_dict())
        cert = Certificate.from_dict(saved_cert_dict)

        # Generate QR and PDF
        qr_path = generate_qr_code(cert_uid)
        pdf_path, pdf_hash = generate_certificate_pdf(
            certificate_uid=cert_uid,
            holder_name=item["holder_name"],
            course=item["course"],
            institution_name=inst.name,
            issue_date=issue_date_str,
            roll_number=item["roll_number"],
            certificate_type=item["certificate_type"],
            grade=item["grade"],
            description=item["description"],
            qr_path=qr_path,
        )

        await json_storage.update_certificate(
            cert_uid,
            {"qr_path": qr_path, "pdf_path": pdf_path, "pdf_hash": pdf_hash},
        )
        cert.qr_path = qr_path
        cert.pdf_path = pdf_path
        cert.pdf_hash = pdf_hash
        certificates.append(cert)

    print(f"  [OK] Created {len(certificates)} certificates with digital signatures and PDFs")

    # ============================================================
    # 4. Revocation (Revoke Certificate #2 for demonstration)
    # ============================================================
    rev_cert = certificates[1]
    await json_storage.update_certificate(rev_cert.certificate_uid, {"status": CertificateStatus.REVOKED.value})
    rev_cert.status = CertificateStatus.REVOKED

    revocation_obj = Revocation(
        certificate_id=rev_cert.id,
        reason=RevocationReason.INCORRECT_INFO,
        reason_detail="Re-issuing certificate with corrected course title",
        revoked_by=issuers[0].id,
        revoked_at=datetime.now(timezone.utc),
    )
    await json_storage.add_revocation(revocation_obj.to_dict())
    print(f"  [OK] Revoked certificate {rev_cert.certificate_uid} for demo")

    # ============================================================
    # 5. Verification Logs
    # ============================================================
    logs_data = [
        (certificates[0].id, certificates[0].certificate_uid, "VALID", "192.168.1.10"),
        (certificates[0].id, certificates[0].certificate_uid, "VALID", "192.168.1.12"),
        (certificates[1].id, certificates[1].certificate_uid, "REVOKED", "192.168.1.15"),
        (None, "CERT-FAKE-2026-999999", "NOT_FOUND", "192.168.1.20"),
        (certificates[0].id, certificates[0].certificate_uid, "TAMPERED", "192.168.1.25"),
    ]

    for cid, uid, res, ip in logs_data:
        vlog = VerificationLog(
            certificate_id=cid,
            certificate_uid=uid,
            result=res,
            ip_address=ip,
            created_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        await json_storage.add_verification_log(vlog.to_dict())

    print("  [OK] Created sample verification logs")

    # ============================================================
    # 6. Audit Logs
    # ============================================================
    audit_events = [
        (admin_user.id, "USER_LOGIN", "user", str(admin_user.id)),
        (admin_user.id, "INSTITUTION_CREATED", "institution", "1"),
        (issuers[0].id, "CERT_ISSUED", "certificate", certificates[0].certificate_uid),
        (issuers[0].id, "CERT_REVOKED", "certificate", certificates[1].certificate_uid),
    ]
    for actor_id, action, rtype, rid in audit_events:
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=rtype,
            resource_id=rid,
            ip_address="127.0.0.1",
            created_at=datetime.now(timezone.utc),
        )
        await json_storage.add_audit_log(log.to_dict())

    print("  [OK] Created audit log trail")

    print("\n[SUCCESS] CertiSecure2 JSON Storage Seeding Complete!")
    print("\nSIH Demo Credentials:")
    print("  1. Admin:    admin@certisecure.dev  / Admin@2026")
    print("  2. Issuer:   issuer@sms.edu.in      / Issuer@2026  (SMS Lucknow)")
    print("  3. Verifier: verifier@certisecure.dev / Verifier@2026")
    print(f"\nDemo Certificate UID (Valid):   {certificates[0].certificate_uid}")
    print(f"Demo Certificate UID (Revoked): {certificates[1].certificate_uid}\n")


if __name__ == "__main__":
    asyncio.run(seed())
