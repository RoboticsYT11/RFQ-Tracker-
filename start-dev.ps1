# Start Both Servers
Write-Host "Starting Backend and Frontend servers..." -ForegroundColor Green

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Start Backend
$backendCmd = "Set-Location -LiteralPath '$backendPath'; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

# Wait a bit before starting frontend
Start-Sleep -Seconds 2

# Start Frontend  
$frontendCmd = "Set-Location -LiteralPath '$frontendPath'; node node_modules\.bin\react-scripts start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

Write-Host "`nServers starting in separate windows..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "`nNote: Frontend may take 30-60 seconds to compile on first start." -ForegroundColor Yellow

