@echo off
title Claude Counter - Desktop Patcher
echo ===================================================
echo   Claude Counter Desktop Patcher for Windows
echo ===================================================
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [-] Error: Node.js is not installed on this system.
    echo Please download and install Node.js from: https://nodejs.org/
    echo After installing Node.js, reopen this file.
    echo.
    echo ===================================================
    pause
    exit /b 1
)

echo [+] Node.js detected. Running patch script...
node "%~dp0scripts\patch-desktop.js"

echo.
echo ===================================================
pause
