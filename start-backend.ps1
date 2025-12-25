# Start Backend Server
Set-Location -LiteralPath "$PSScriptRoot\backend"
Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Cyan
node server.js

