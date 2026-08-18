@echo off
echo ==================================================
echo   CertiSecure -- Local Development Launcher (CMD)
echo ==================================================

set ROOT_DIR=%~dp0..

echo [+] Seeding database and starting backend...
start "CertiSecure Backend" cmd /k "cd /d %ROOT_DIR%\backend && .venv\Scripts\activate && python -m app.seed && uvicorn app.main:app --reload --port 8000"

echo [+] Starting frontend server...
start "CertiSecure Frontend" cmd /k "cd /d %ROOT_DIR%\frontend && npm run dev"

echo.
echo [SUCCESS] CertiSecure services launched in separate windows!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/api/docs
