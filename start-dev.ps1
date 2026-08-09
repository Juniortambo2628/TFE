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

Write-Host ""
Write-Host "Starting Laravel server on http://localhost:8000 ..." -ForegroundColor Cyan

# Start Laravel in a new tab
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\wamp64\www\TFE; php artisan serve"

Start-Sleep -Seconds 2

Write-Host "Starting Vite dev server..." -ForegroundColor Cyan
Write-Host ""

# Start Vite in the current window
Set-Location "C:\wamp64\www\TFE"
npm run dev
