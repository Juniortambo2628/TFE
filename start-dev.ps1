# TFE Development Server Starter
Write-Host ""
Write-Host "  ================================" -ForegroundColor Cyan
Write-Host "   TFE Development Environment" -ForegroundColor Cyan
Write-Host "  ================================" -ForegroundColor Cyan
Write-Host ""

# Check if WAMP is running
$wamp = Get-Process -Name "wampmanager" -ErrorAction SilentlyContinue
if (-not $wamp) {
    Write-Host "[WARN] WAMP is not running. Starting WAMP..." -ForegroundColor Yellow
    Start-Process "C:\wamp64\wampmanager.exe"
    Start-Sleep -Seconds 5
} else {
    Write-Host "[OK] WAMP is already running." -ForegroundColor Green
}

Set-Location "C:\wamp64\www\TFE"

# First-time setup: install PHP + JS deps if missing.
# --legacy-peer-deps is required until @tremor/react ships a React 19
# peer-dep bump (npm install without it errors ERESOLVE).
if (-not (Test-Path "vendor")) {
    Write-Host ""
    Write-Host "[SETUP] Installing PHP dependencies (first run)..." -ForegroundColor Yellow
    composer install --no-interaction --prefer-dist
}
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "[SETUP] Installing JS dependencies (first run)..." -ForegroundColor Yellow
    npm install --legacy-peer-deps --no-audit --no-fund
}
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "[SETUP] Copying .env.example -> .env and generating APP_KEY..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    php artisan key:generate --force
}

Write-Host ""
Write-Host "Running migrations..." -ForegroundColor Cyan
php artisan migrate --force

Write-Host ""
Write-Host "Seeding demo packages when empty..." -ForegroundColor Cyan
php artisan tinker --execute="if (App\Models\Package::count() === 0) { Artisan::call('db:seed', ['--class' => 'PackageSeeder', '--force' => true]); echo Artisan::output(); }"

Write-Host ""
Write-Host "Starting Laravel server on http://localhost:8000 ..." -ForegroundColor Cyan

# Start Laravel in a new tab
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\wamp64\www\TFE; php artisan serve"

Start-Sleep -Seconds 2

Write-Host "Starting Vite dev server..." -ForegroundColor Cyan
Write-Host ""

# Start Vite in the current window
npm run dev
