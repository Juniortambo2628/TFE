@echo off
title TFE Development Servers
echo.
echo  ================================
echo   TFE Development Environment
echo  ================================
echo.

:: Check if WAMP is running
tasklist /FI "IMAGENAME eq wampmanager.exe" 2>NUL | find /I "wampmanager.exe" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] WAMP is not running. Starting WAMP...
    start "" "C:\wamp64\wampmanager.exe"
    timeout /t 5 /nobreak >NUL
) else (
    echo [OK] WAMP is already running.
)

echo.
echo Starting Laravel server on http://localhost:8000 ...
start cmd /k "cd /d C:\wamp64\www\TFE && php artisan serve"

timeout /t 2 /nobreak >NUL

echo Starting Vite dev server...
echo.

cd /d C:\wamp64\www\TFE
npm run dev
