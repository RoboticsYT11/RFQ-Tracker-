# RFQ Tracker - One-Click Startup Script
# This script will install dependencies (if needed) and start both servers

Write-Host "Starting RFQ Tracker Application..." -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

# Function to check if dependencies are installed
function Test-Dependencies {
    param($Path)
    return Test-Path (Join-Path $Path "node_modules")
}

# Function to install dependencies
function Install-Dependencies {
    param($Path, $Name)
    Write-Host "Installing $Name dependencies..." -ForegroundColor Yellow
    Set-Location -LiteralPath $Path
    npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install $Name dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "$Name dependencies installed" -ForegroundColor Green
}

# Store original location
$originalLocation = Get-Location
$rootPath = $PSScriptRoot

try {
    # Check and install root dependencies
    if (-not (Test-Dependencies $rootPath)) {
        Write-Host "Installing root dependencies..." -ForegroundColor Yellow
        Set-Location -LiteralPath $rootPath
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to install root dependencies" -ForegroundColor Red
            exit 1
        }
        Write-Host "Root dependencies installed" -ForegroundColor Green
    }

    # Check and install backend dependencies
    $backendPath = Join-Path $rootPath "backend"
    if (-not (Test-Dependencies $backendPath)) {
        Install-Dependencies $backendPath "Backend"
    }

    # Check and install frontend dependencies  
    $frontendPath = Join-Path $rootPath "frontend"
    if (-not (Test-Dependencies $frontendPath)) {
        Install-Dependencies $frontendPath "Frontend"
    }

    Write-Host "All dependencies are ready!" -ForegroundColor Green
    Write-Host ""

    # Kill any existing processes on ports 3000 and 5000
    Write-Host "Checking for existing processes..." -ForegroundColor Yellow
    
    $processes3000 = netstat -ano | findstr ":3000" | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique
    $processes5000 = netstat -ano | findstr ":5000" | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique
    
    foreach ($pid in $processes3000) {
        if ($pid -and $pid -ne "0") {
            Write-Host "Stopping process on port 3000 (PID: $pid)" -ForegroundColor Yellow
            taskkill /PID $pid /F 2>$null
        }
    }
    
    foreach ($pid in $processes5000) {
        if ($pid -and $pid -ne "0") {
            Write-Host "Stopping process on port 5000 (PID: $pid)" -ForegroundColor Yellow
            taskkill /PID $pid /F 2>$null
        }
    }

    Write-Host ""
    Write-Host "Starting servers..." -ForegroundColor Green
    
    # Start Backend Server
    Write-Host "Starting Backend Server..." -ForegroundColor Cyan
    $backendCmd = "Set-Location -LiteralPath '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal
    
    # Wait for backend to start
    Start-Sleep -Seconds 3
    
    # Start Frontend Server
    Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
    $frontendCmd = "Set-Location -LiteralPath '$frontendPath'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; Write-Host 'This may take 30-60 seconds on first start...' -ForegroundColor Yellow; `$env:SKIP_PREFLIGHT_CHECK='true'; node node_modules\react-scripts\bin\react-scripts.js start"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal
    
    Write-Host ""
    Write-Host "Servers are starting in separate windows!" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Health:   http://localhost:5000/api/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Yellow
    Write-Host "   Admin:    admin / admin123" -ForegroundColor White
    Write-Host "   Sales:    sales1 / sales123" -ForegroundColor White
    Write-Host "   Engineer: engineer1 / engineer123" -ForegroundColor White
    Write-Host ""
    Write-Host "Frontend may take 30-60 seconds to compile on first start" -ForegroundColor Yellow
    Write-Host "Your browser should automatically open to http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press any key to exit this window..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
} finally {
    # Return to original location
    Set-Location -LiteralPath $originalLocation
}