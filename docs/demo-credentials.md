# CertiSecure — SIH Demo Credentials & Test Scenarios

> **SIH 2026 Hackathon Demonstration Accounts**

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Access / Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@certisecure.dev` | `Admin@2026` | Full platform control, issuer registration, key rotation |
| **Issuer (SMS Lucknow)** | `issuer@sms.edu.in` | `Issuer@2026` | Issue & revoke certificates for SMS Lucknow |
| **Issuer (IIT Delhi)** | `issuer@iitd.ac.in` | `Issuer@2026` | Issue & revoke certificates for IIT Delhi |
| **Verifier (Public)** | `verifier@certisecure.dev` | `Verifier@2026` | Public verification and audit log viewing |

---

## 📜 Sample Certificate UIDs

| Scenario | Certificate UID | Holder Name | Status |
| :--- | :--- | :--- | :--- |
| **Genuine Active Cert** | `CERT-SMS-LKO-2026-000001` | Vinayak Singh | `VALID` (VERIFIED / AUTHENTIC) |
| **Revoked Cert** | `CERT-SMS-LKO-2026-000002` | Ananya Gupta | `REVOKED` (CERTIFICATE REVOKED) |

---

## 🧪 SIH Step-by-Step Demonstration Guide

### 1. Authentic Verification Flow
1. Open `http://localhost:5173/verify`
2. Enter Certificate ID: `CERT-SMS-LKO-2026-000001`
3. Click **Verify Authenticity**
4. System displays **🟢 VERIFIED / AUTHENTIC** with valid Ed25519 signature and SHA-256 hash match.

### 2. Tamper Detection Flow
1. Locate `backend/storage/certificates/pdf/CERT-SMS-LKO-2026-000001.pdf` on disk.
2. Edit any character in the PDF file (or alter data).
3. Verify `CERT-SMS-LKO-2026-000001` on `http://localhost:5173/verify`.
4. System displays **🔴 TAMPER DETECTED / INVALID**.

### 3. Certificate Revocation Flow
1. Login as Issuer: `issuer@sms.edu.in` / `Issuer@2026`
2. Go to **Certificate Directory** (`/certificates`)
3. Click **Revoke Certificate** button next to `CERT-SMS-LKO-2026-000001`
4. Enter reason: `Test revocation for SIH demonstration`
5. Click **Confirm Revocation**
6. Open `http://localhost:5173/verify/CERT-SMS-LKO-2026-000001`
7. System displays **⚠️ CERTIFICATE REVOKED** with full revocation audit record.
