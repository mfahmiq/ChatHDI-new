@echo off
title ChatHDI Launcher
color 0A

echo ========================================
echo     ChatHDI - Full Stack Launcher
echo ========================================
echo.

:: Check if running from correct directory
if not exist "backend\server.py" (
    echo [ERROR] backend\server.py not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERROR] frontend\package.json not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [INFO] Starting ChatHDI Backend and Frontend...
echo.

:: Start Backend in new window
echo [1/2] Starting Backend (FastAPI on port 8000)...
start "ChatHDI Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

:: Start Frontend in new window
echo [2/2] Starting Frontend (React on port 3000)...
start "ChatHDI Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo     ChatHDI is starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo [TIP] Close this window to keep servers running.
echo [TIP] Close individual server windows to stop them.
echo.
pause
