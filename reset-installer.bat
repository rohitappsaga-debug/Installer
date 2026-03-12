@echo off
:: Check for Admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] This script MUST be run as Administrator.
    echo Please right-click and select "Run as Administrator".
    echo.
    pause
    exit /b 1
)

set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"

echo =======================================
echo     ROBS SYSTEM INSTALLER RESET
echo =======================================
echo.

echo Deleting License Key...
if exist "%BASE_DIR%\installer\storage\license.json" (
    del /q "%BASE_DIR%\installer\storage\license.json"
    echo [OK] License key deleted.
)

echo Deleting Environment Config...
if exist "%BASE_DIR%\installer\.env" (
    del /q "%BASE_DIR%\installer\.env"
    echo [OK] .env file deleted.
)

echo Deleting Downloaded ZIPs...
if exist "%BASE_DIR%\installer\RMS.zip" del /q "%BASE_DIR%\installer\RMS.zip"
if exist "%BASE_DIR%\RMS.zip" del /q "%BASE_DIR%\RMS.zip"
if exist "%BASE_DIR%\installer\downloads" rmdir /s /q "%BASE_DIR%\installer\downloads"

echo Deleting Extracted Files...
if exist "%BASE_DIR%\installer\installed" rmdir /s /q "%BASE_DIR%\installer\installed"

echo Deleting Installation Locks...
if exist "%BASE_DIR%\installed.lock" del /q "%BASE_DIR%\installed.lock"
if exist "%BASE_DIR%\installer\robs-backend\installed.lock" del /q "%BASE_DIR%\installer\robs-backend\installed.lock"

echo.
echo ---------------------------------------
echo     CLEANING POSTGRESQL (FRESH)
echo ---------------------------------------
echo Stopping all Node.js and NPX processes...
taskkill /f /im node.exe /t >nul 2>&1
taskkill /f /im npx.exe /t >nul 2>&1
timeout /t 2 /nobreak >nul

echo Stopping PostgreSQL processes...
taskkill /f /im postgres.exe /t >nul 2>&1
taskkill /f /im pg_ctl.exe /t >nul 2>&1

echo Stopping PostgreSQL services...
net stop postgresql-x64-17 /y >nul 2>&1
net stop postgresql-x64-16 /y >nul 2>&1
net stop postgresql-x64-15 /y >nul 2>&1
net stop postgresql-x64-14 /y >nul 2>&1
net stop PostgreSQL /y >nul 2>&1
timeout /t 2 /nobreak >nul

echo Deleting PostgreSQL services...
sc delete postgresql-x64-17 >nul 2>&1
sc delete postgresql-x64-16 >nul 2>&1
sc delete postgresql-x64-15 >nul 2>&1
sc delete postgresql-x64-14 >nul 2>&1
sc delete PostgreSQL >nul 2>&1

echo Deleting PostgreSQL Files (C:\Program Files\PostgreSQL)...
if exist "C:\Program Files\PostgreSQL" rmdir /s /q "C:\Program Files\PostgreSQL"

echo Cleaning Registry entries (if any)...
reg delete "HKLM\SOFTWARE\PostgreSQL" /f >nul 2>&1

echo.
echo =======================================
echo    RESET COMPLETE! READY FOR FRESH START
echo =======================================
pause
