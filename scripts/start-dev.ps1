# PowerShell launcher for CertiSecure Development Environment

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  CertiSecure -- Local Development Launcher" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RootDir = Split-Path -Parent $ScriptDir

# 1. Backend Setup
Write-Host "[+] Initializing Python Backend..." -ForegroundColor Yellow
Set-Location "$RootDir\backend"

if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Gray
    python -m venv .venv
}

& "$RootDir\backend\.venv\Scripts\Activate.ps1"
pip install -q -r requirements.txt
python -m app.seed

Write-Host "[+] Starting FastAPI Backend at http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\backend'; & '$RootDir\backend\.venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --port 8000"

# 2. Frontend Setup
Write-Host "[+] Initializing Frontend..." -ForegroundColor Yellow
Set-Location "$RootDir\frontend"

Write-Host "[+] Starting Vite Frontend at http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\frontend'; npm run dev"

Write-Host "`n[SUCCESS] CertiSecure services launched!" -ForegroundColor Cyan
Write-Host "  Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  API Docs:     http://127.0.0.1:8000/api/docs" -ForegroundColor White
Write-Host "  Verify Page:  http://localhost:5173/verify" -ForegroundColor White
