# Deploy RFQ Tracker to GitHub and Render
Write-Host "Starting RFQ Tracker deployment to GitHub..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Cyan
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Cyan
$commitMessage = "feat: Complete RFQ Tracker application with Render deployment config"
git commit -m $commitMessage

# Set main branch
Write-Host "Setting main branch..." -ForegroundColor Yellow
git branch -M main

# Add remote origin
$repoUrl = "https://github.com/RoboticsYT11/RFQ-Tracker-.git"
Write-Host "Adding remote origin: $repoUrl" -ForegroundColor Yellow

# Check if remote already exists
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "Remote origin already exists, updating..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
} else {
    git remote add origin $repoUrl
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push -u origin main

Write-Host ""
Write-Host "Successfully deployed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps for Render Deployment:" -ForegroundColor Cyan
Write-Host "1. Go to https://render.com and sign up/login" -ForegroundColor White
Write-Host "2. Click 'New +' and select 'Blueprint'" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Render will automatically detect render.yaml and deploy" -ForegroundColor White
Write-Host "5. Wait for deployment to complete (5-10 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "Your app will be available at:" -ForegroundColor Yellow
Write-Host "   Frontend: https://rfq-tracker-frontend.onrender.com" -ForegroundColor White
Write-Host "   Backend:  https://rfq-tracker-backend.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "Default login: admin / admin123" -ForegroundColor Green