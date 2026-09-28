@echo off
title Nexus Commerce - Starting All Services
echo ========================================================
echo         Nexus Commerce Development Startup
echo ========================================================
echo.

echo [1/3] Starting AI / ML Service (Port 8000)...
start "Nexus - AI Service (Port 8000)" cmd /k "cd /d %~dp0ai-service && .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

echo [2/3] Starting Backend API Server (Port 5000)...
start "Nexus - Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [3/3] Starting Frontend Client (Port 3000)...
start "Nexus - Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo All 3 services have been launched in separate windows!
echo - Frontend UI:   http://localhost:3000
echo - Backend API:   http://localhost:5000
echo - AI Docs:       http://localhost:8000/docs
echo ========================================================
echo.
pause
