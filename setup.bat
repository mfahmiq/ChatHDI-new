@echo off
title ChatHDI Setup
color 0D

echo ========================================
echo     ChatHDI - Initial Setup
echo ========================================
echo.

:: Check Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)
python --version

:: Check Node.js
echo.
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
node --version

:: Install Backend Dependencies
echo.
echo [3/4] Installing Backend Dependencies...
cd /d %~dp0backend
pip install -r requirements.txt

:: Install Frontend Dependencies
echo.
echo [4/4] Installing Frontend Dependencies...
cd /d %~dp0frontend
call npm install

echo.
echo ========================================
echo     Setup Complete!
echo ========================================
echo.
echo To start the application, run: start.bat
echo.
echo Individual scripts:
echo   - start-backend.bat  : Start only backend
echo   - start-frontend.bat : Start only frontend
echo.
pause
