@echo off
title ChatHDI Launcher
color 0A

echo ========================================
echo     ChatHDI - Next.js Launcher
echo ========================================
echo.

:: Check if running from correct directory
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [INFO] Starting ChatHDI Full-Stack App...
echo.

:: Start Next.js server in a new window
echo Starting Next.js Dev Server (on port 3000)...
start "ChatHDI Full-Stack" cmd /k "npm run dev"

echo.
echo ========================================
echo     ChatHDI is starting...
echo ========================================
echo.
echo App URL:     http://localhost:3000
echo Health API:  http://localhost:3000/api/health
echo.
echo [TIP] Close the new CMD window to stop the server.
echo.
pause
