@echo off
title ChatHDI Frontend
color 0E

echo ========================================
echo     ChatHDI Frontend Server
echo ========================================
echo.

cd /d %~dp0frontend

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [INFO] Starting React development server...
echo [INFO] App will be available at http://localhost:3000
echo.

npm start

pause
