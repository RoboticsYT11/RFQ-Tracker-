git config user.email "deploy@rfqtracker.com"
git config user.name "RFQ Deployer"
git add .
git commit -m "Initial commit for deployment"
git branch -M main
try { git remote add origin https://github.com/RoboticsYT11/RFQ-Tracker-.git } catch {}
git remote set-url origin https://github.com/RoboticsYT11/RFQ-Tracker-.git
git push -u origin main
