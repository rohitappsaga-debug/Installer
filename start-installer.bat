@echo off
setlocal enabledelayedexpansion

echo ============================================
echo RMS Installer Bootstrap Launcher (Debug Mode)
echo ============================================

:: Check for admin rights
echo Checking for Administrator privileges...
openfiles >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Not running as Administrator.
    echo [!] Attempting to elevate...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    if %errorLevel% neq 0 (
        echo [ERROR] Elevation failed.
        echo Please right-click this file and select 'Run as administrator'.
        pause
    )
    exit /b
)

echo [OK] Running as Administrator.
pause

:: Detect OS
echo Detecting Operating System...
echo [OK] Windows detected.

:: Check Node.js
echo Checking for Node.js...
where node >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo [OK] Node.js is installed: !NODE_VER!
    goto :INSTALL_DEPS
)

echo [!] Node.js not found.
pause

:: Install Node.js
echo [4/6] Installing Node.js LTS...
set "NODE_MSI=node-v20.11.1-x64.msi"
set "NODE_URL=https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"

echo Downloading Node.js from !NODE_URL!...
powershell -Command "Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_MSI!'"

if not exist "!NODE_MSI!" (
    echo [ERROR] Download failed.
    pause
    exit /b 1
)

echo Installing Node.js (this may take a minute)...
msiexec /i "!NODE_MSI!" /quiet /norestart
if %errorLevel% neq 0 (
    echo [ERROR] Install failed with code !errorLevel!.
    pause
)

del "!NODE_MSI!"
set "PATH=%PATH%;C:\Program Files\nodejs\"
echo [OK] Node.js installation attempt finished.
pause

:INSTALL_DEPS
echo [5/6] Moving to installer directory...
cd /d "%~dp0\installer"
if %errorLevel% neq 0 (
    echo [ERROR] Failed to find installer directory at "%~dp0\installer"
    pause
    exit /b 1
)

echo Current directory: %CD%
if not exist "package.json" (
    echo [ERROR] package.json not found in %CD%
    pause
    exit /b 1
)

echo [6/6] Running npm install...
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
)

echo Starting installer...
call npm run installer
if %errorLevel% neq 0 (
    echo [ERROR] Installer crashed.
    pause
)

echo Done.
pause
