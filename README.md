# CertiSecure2 — Secure Digital Certificate Verification System

> **SIH 2026 Hackathon Project** — The Certificate Nobody Can Fake.

CertiSecure2 is a production-quality digital certificate issuance and verification network built for educational institutions. It uses **Ed25519 digital signatures** and **SHA-256 cryptographic hashing** with **QR-based instant verification** to guarantee authenticity and detect any tampering.

> [!NOTE]
> **No Blockchain**: CertiSecure2 relies on high-speed, zero-cost, asymmetric cryptography (Ed25519) rather than energy-intensive or costly blockchain networks.

---

## 🚀 Core Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, Recharts, HTML5 QR Scanner, Axios, React Router 7.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (Async), Pydantic v2, JWT Auth, bcrypt password hashing.
- **Database**: MySQL 8.0+ (`certisecure` database schema with foreign keys, indexes, & ENUM constraints).
- **Cryptography**: Ed25519 asymmetric signing (`cryptography` library), SHA-256 canonical JSON hashing, Fernet key protection at rest.
- **Certificate Output**: ReportLab PDF generator + high-density QR code generation.

---

## 🔒 Cryptographic Security Architecture

```
                                  [ Institution ]
                                         │
                               Generates Ed25519 Keypair
                                         │
 ┌───────────────────────────────────────┴──────────────────────────────────────┐
 │ PRIVATE KEY (Encrypted at rest)             PUBLIC KEY (Published in Registry)│
 └───────────────────┬───────────────────────────────────┬──────────────────────┘
                     │                                   │
              Issuance Phase                      Verification Phase
                     │                                   │
 1. Canonical JSON String                        1. Scan QR Code / Input ID
 2. SHA-256 Hash Computation                     2. Rebuild Canonical JSON Data
 3. Ed25519 Private Key Signing                  3. Calculate Current SHA-256 Hash
 4. Store Signature + Generate PDF/QR            4. Verify Signature with Public Key
                     │                                   │
                     ▼                                   ▼
        [ Signed PDF Certificate ] ──(Scan)──►  🟢 VERIFIED / 🔴 TAMPERED
```

---

## 📋 SIH 2026 Demonstration Scenario

CertiSecure2 is designed for a complete step-by-step hackathon demo:

1. **Issuer Registration**: Admin logs in and registers **SMS Lucknow** (`SMS-LKO`) as a verified issuer. An Ed25519 keypair is automatically generated.
2. **Certificate Issuance**: Issuer (`issuer@sms.edu.in`) logs in and issues a certificate for **Vinayak Singh** (Roll: `SMS-2026-CS-042`, Result: `PASS`).
3. **Cryptographic Signing**: Backend canonicalizes data, computes SHA-256 hash, signs with Ed25519 private key, and embeds a QR code into the generated ReportLab PDF.
4. **Authentic Verification**: Judge scans QR code or enters UID (`CERT-SMS-LKO-2026-000001`). System displays **🟢 VERIFIED / AUTHENTIC**.
5. **Tamper Detection**: Edit result in PDF/data from `PASS` to `DISTINCTION`. Verifying again displays **🔴 TAMPER DETECTED / INVALID** with side-by-side original vs. calculated hash mismatch.
6. **Revocation Flow**: Issuer revokes certificate. Verifying displays **⚠️ CERTIFICATE REVOKED**.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access / Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@certisecure.dev` | `Admin@2026` | Full platform control, issuer registration, key rotation |
| **Issuer (SMS Lucknow)** | `issuer@sms.edu.in` | `Issuer@2026` | Issue & revoke certificates for SMS Lucknow |
| **Verifier (Public)** | `verifier@certisecure.dev` | `Verifier@2026` | Public verification and audit log viewing |

---

## 🛠️ Installation & Setup Instructions

### 1. Database Setup (MySQL)

Create the MySQL database named `certisecure`:

```sql
CREATE DATABASE certisecure DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

*Note: You can import `database/schema.sql` into MySQL, or let SQLAlchemy auto-create tables on backend startup.*

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create & activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables file
cp .env.example .env

# Seed demo data (creates institutions, Ed25519 keys, users, sample certs)
python -m app.seed

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

FastAPI interactive API docs will be live at: `http://localhost:8000/api/docs`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend application will be live at: `http://localhost:5173`

---

## 🧪 Running Unit & Integration Tests

```bash
cd backend

# Run cryptographic integrity unit tests (SHA-256, Ed25519, Tamper detection)
python -m pytest tests/test_crypto.py -v

# Run API tests
python -m pytest tests/test_api.py -v
```

---

## 📑 Project Structure

```
certisecure/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, certificates, institutions, verification, audit)
│   │   ├── certificates/ # ReportLab PDF & QR generators
│   │   ├── core/         # Config, database session, security (bcrypt & JWT)
│   │   ├── crypto/       # Ed25519 keypair management & SHA-256 signing pipeline
│   │   ├── models/       # SQLAlchemy models (users, institutions, certificates, revocations)
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── main.py       # FastAPI application entry point
│   │   └── seed.py       # Database seed script for SIH demo
│   ├── tests/            # Pytest test suites (crypto & API tests)
│   └── requirements.txt
├── database/
│   └── schema.sql        # MySQL 8.0 DDL script
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, Layouts
│   │   ├── hooks/        # useAuth context
│   │   ├── pages/        # Landing, Login, Dashboard, Create, Details, Verify, Audit, etc.
│   │   ├── services/     # Axios API service layer
│   │   ├── types/        # TypeScript interfaces
│   │   └── index.css     # Tailwind CSS 4 theme & custom styles
│   └── package.json
└── README.md
```

---

## 🛡️ License

Built for **Smart India Hackathon (SIH 2026)**. Open source for educational and institutional verification purposes.
"# certisecure" 
"# certisecure" 
