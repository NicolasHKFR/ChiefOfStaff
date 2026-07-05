@echo off
title Chief of Staff Platform
cd /d "%~dp0"

echo ============================================
echo   Chief of Staff Platform - Starting...
echo ============================================
echo.

:: Check prerequisites
echo [CHECK] Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.11+.
    pause
    exit /b 1
)
python --version

echo [CHECK] Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+.
    pause
    exit /b 1
)
node --version

echo.

:: Install backend dependencies if needed
echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARN] pip install had issues, continuing...
)

:: Seed database (comment out to preserve data across restarts)
echo.
echo [2/4] Skipping seed (run 'python -m app.seed' manually to reset data)...

:: Install frontend dependencies if needed
echo.
echo [3/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    npm install
)

:: Start backend
echo.
echo [4/4] Starting services...
cd /d "%~dp0backend"
echo   Starting backend on http://localhost:8000 ...
start "Backend - Chief of Staff" cmd /k "echo Backend logs: && echo. && python -m uvicorn app.main:app --reload --port 8000 --log-level info"

:: Wait for backend to initialize
timeout /t 3 /nobreak >nul

:: Start frontend
cd /d "%~dp0frontend"
echo   Starting frontend on http://localhost:5173 ...
start "Frontend - Chief of Staff" cmd /k "echo Frontend logs: && echo. && npm run dev"

echo.
echo ============================================
echo   Both services started successfully!
echo.
echo   Backend  API: http://localhost:8000
echo   Frontend UI:  http://localhost:5173
echo.
echo   Close the server windows to stop.
echo ============================================
echo.
pause
