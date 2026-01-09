@echo off
title ChatHDI Backend
color 0B

echo ========================================
echo     ChatHDI Backend Server
echo ========================================
echo.

cd /d %~dp0backend

:: Check if virtual environment exists
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo [INFO] Starting FastAPI server...
echo [INFO] API will be available at http://localhost:8000
echo [INFO] API Docs at http://localhost:8000/docs
echo.

python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

pause
