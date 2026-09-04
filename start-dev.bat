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

:: First-time setup: install PHP + JS deps if missing.
:: --legacy-peer-deps is required until @tremor/react ships a React 19
:: peer-dep bump (npm install without it errors ERESOLVE).
if not exist "vendor" (
    echo.
    echo [SETUP] Installing PHP dependencies (first run)...
    call composer install --no-interaction --prefer-dist
)
if not exist "node_modules" (
    echo.
    echo [SETUP] Installing JS dependencies (first run)...
    call npm install --legacy-peer-deps --no-audit --no-fund
)
if not exist ".env" (
    echo.
    echo [SETUP] Copying .env.example -^> .env and generating APP_KEY...
    copy .env.example .env >NUL
    call php artisan key:generate --force
)

echo.
echo Running migrations...
call php artisan migrate --force

echo.
echo Seeding demo packages when empty...
call php artisan tinker --execute="if (App\Models\Package::count() === 0) { Artisan::call('db:seed', ['--class' => 'PackageSeeder', '--force' => true]); echo Artisan::output(); }"

echo.
echo Starting Laravel server on http://localhost:8000 ...
start cmd /k "cd /d C:\wamp64\www\TFE && php artisan serve"

timeout /t 2 /nobreak >NUL

echo Starting Vite dev server...
echo.

cd /d C:\wamp64\www\TFE
npm run dev
