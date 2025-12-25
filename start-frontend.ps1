# Start Frontend Server
Set-Location -LiteralPath "$PSScriptRoot\frontend"
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Note: This may take 30-60 seconds on first start..." -ForegroundColor Yellow
$env:SKIP_PREFLIGHT_CHECK='true'
node node_modules\react-scripts\bin\react-scripts.js start

