# CertiSecure — Local Setup & Architecture Report

> **Project Name**: CertiSecure — Secure Digital Certificate Verification Network
> **Target Environment**: Windows Laptop / Local Development

---

## 1. Detected Project Architecture & Technology Stack

| Component | Technology / Framework | Configuration / Details |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4 | React Router 7, Lucide Icons, Axios, HTML5 QR Scanner |
| **Backend** | Python 3.11+ (FastAPI, SQLAlchemy Async) | Uvicorn ASGI server, Pydantic v2, JWT Auth |
| **Database** | MySQL 8.0+ / SQLite (aiomysql / aiosqlite) | Relational schema with foreign keys, indexes & ENUM constraints |
| **Cryptography** | Asymmetric Ed25519 & SHA-256 | `cryptography` library, canonical JSON hashing, Fernet encryption at rest |
| **Document Output** | ReportLab PDF + PIL QR Generator | High-resolution PDF certificates with embedded QR codes & checksums |

---

## 2. System Software Requirements

- **Operating System**: Windows 10 / 11 (PowerShell / Command Prompt)
- **Python**: Python 3.11 or newer (`python --version`)
- **Node.js**: Node.js 20+ LTS (`node -v`)
- **Package Manager**: npm 10+ (`npm -v`)
- **Database Server**: MySQL 8.0+ Server (or SQLite fallback)

---

## 3. Required Ports & Environment Configuration

| Service | Host & Port | Environment Variable |
| :--- | :--- | :--- |
| **FastAPI Backend** | `http://127.0.0.1:8000` | `STORAGE_PATH=storage`, `JWT_SECRET` |
| **Vite Frontend** | `http://localhost:5173` | `VITE_API_URL=http://localhost:8000/api` |
| **API Documentation** | `http://127.0.0.1:8000/api/docs` | FastAPI Swagger UI |

---

## 4. Local Startup Commands

### Terminal 1 — Backend API Server
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend Dev Server
```powershell
cd frontend
npm install
npm run dev
```

---

## 5. One-Click Automation Scripts

- `scripts/start-dev.ps1`: Run `powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1`
- `scripts/start-dev.bat`: Double-click or run `scripts/start-dev.bat` in CMD.
