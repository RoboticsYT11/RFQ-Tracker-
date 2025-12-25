#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 RFQ Tracker - Production Deployment Verification\n');

const checks = [];

// Check 1: render.yaml exists and is properly configured
function checkRenderConfig() {
  try {
    const renderConfig = fs.readFileSync('render.yaml', 'utf8');
    const hasDatabase = renderConfig.includes('databases:');
    const hasWebService = renderConfig.includes('type: web');
    const hasBuildCommand = renderConfig.includes('buildCommand: npm run build:all');
    const hasStartCommand = renderConfig.includes('startCommand: npm start');
    
    if (hasDatabase && hasWebService && hasBuildCommand && hasStartCommand) {
      checks.push({ name: 'Render Configuration', status: '✅', details: 'render.yaml properly configured' });
    } else {
      checks.push({ name: 'Render Configuration', status: '❌', details: 'render.yaml missing required configuration' });
    }
  } catch (error) {
    checks.push({ name: 'Render Configuration', status: '❌', details: 'render.yaml not found' });
  }
}

// Check 2: Backend package.json has correct scripts
function checkBackendPackage() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const hasCorrectStart = packageJson.scripts.start.includes('deploy-init.js');
    const hasRequiredDeps = packageJson.dependencies.express && packageJson.dependencies.pg;
    
    if (hasCorrectStart && hasRequiredDeps) {
      checks.push({ name: 'Backend Package', status: '✅', details: 'Scripts and dependencies configured' });
    } else {
      checks.push({ name: 'Backend Package', status: '❌', details: 'Missing required scripts or dependencies' });
    }
  } catch (error) {
    checks.push({ name: 'Backend Package', status: '❌', details: 'backend/package.json not found or invalid' });
  }
}

// Check 3: Database configuration
function checkDatabaseConfig() {
  try {
    const dbConfig = fs.readFileSync('backend/config/database.js', 'utf8');
    const hasConnectionString = dbConfig.includes('DATABASE_URL');
    const hasSSL = dbConfig.includes('ssl:');
    
    if (hasConnectionString && hasSSL) {
      checks.push({ name: 'Database Configuration', status: '✅', details: 'DATABASE_URL and SSL configured' });
    } else {
      checks.push({ name: 'Database Configuration', status: '❌', details: 'Missing DATABASE_URL or SSL configuration' });
    }
  } catch (error) {
    checks.push({ name: 'Database Configuration', status: '❌', details: 'Database config file not found' });
  }
}

// Check 4: Server configuration
function checkServerConfig() {
  try {
    const serverJs = fs.readFileSync('backend/server.js', 'utf8');
    const bindsToHost = serverJs.includes('0.0.0.0');
    const hasHealthCheck = serverJs.includes('/api/health');
    const hasStaticServing = serverJs.includes('express.static');
    const hasCatchAll = serverJs.includes('app.get(\'*\'');
    
    if (bindsToHost && hasHealthCheck && hasStaticServing && hasCatchAll) {
      checks.push({ name: 'Server Configuration', status: '✅', details: 'Production server settings configured' });
    } else {
      checks.push({ name: 'Server Configuration', status: '❌', details: 'Missing production server configuration' });
    }
  } catch (error) {
    checks.push({ name: 'Server Configuration', status: '❌', details: 'server.js not found' });
  }
}

// Check 5: Database scripts
function checkDatabaseScripts() {
  const migrateExists = fs.existsSync('backend/scripts/migrate.js');
  const seedExists = fs.existsSync('backend/scripts/seed.js');
  const deployInitExists = fs.existsSync('backend/scripts/deploy-init.js');
  
  if (migrateExists && seedExists && deployInitExists) {
    checks.push({ name: 'Database Scripts', status: '✅', details: 'Migration, seed, and deploy-init scripts present' });
  } else {
    checks.push({ name: 'Database Scripts', status: '❌', details: 'Missing required database scripts' });
  }
}

// Check 6: Frontend build configuration
function checkFrontendConfig() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    const hasBuildScript = packageJson.scripts.build;
    const hasReactScripts = packageJson.dependencies['react-scripts'];
    
    if (hasBuildScript && hasReactScripts) {
      checks.push({ name: 'Frontend Configuration', status: '✅', details: 'React build configuration present' });
    } else {
      checks.push({ name: 'Frontend Configuration', status: '❌', details: 'Missing React build configuration' });
    }
  } catch (error) {
    checks.push({ name: 'Frontend Configuration', status: '❌', details: 'frontend/package.json not found' });
  }
}

// Check 7: Root package.json
function checkRootPackage() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasBuildAll = packageJson.scripts['build:all'];
    const hasStart = packageJson.scripts.start;
    
    if (hasBuildAll && hasStart) {
      checks.push({ name: 'Root Package Configuration', status: '✅', details: 'Build and start scripts configured' });
    } else {
      checks.push({ name: 'Root Package Configuration', status: '❌', details: 'Missing build:all or start scripts' });
    }
  } catch (error) {
    checks.push({ name: 'Root Package Configuration', status: '❌', details: 'package.json not found' });
  }
}

// Check 8: Documentation
function checkDocumentation() {
  const deploymentMdExists = fs.existsSync('DEPLOYMENT.md');
  const checklistExists = fs.existsSync('DEPLOYMENT-CHECKLIST.md');
  
  if (deploymentMdExists && checklistExists) {
    checks.push({ name: 'Documentation', status: '✅', details: 'Deployment guides present' });
  } else {
    checks.push({ name: 'Documentation', status: '❌', details: 'Missing deployment documentation' });
  }
}

// Run all checks
function runAllChecks() {
  checkRenderConfig();
  checkBackendPackage();
  checkDatabaseConfig();
  checkServerConfig();
  checkDatabaseScripts();
  checkFrontendConfig();
  checkRootPackage();
  checkDocumentation();
  
  // Display results
  console.log('📋 Deployment Readiness Report:\n');
  
  let allPassed = true;
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.details}`);
    if (check.status === '❌') allPassed = false;
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED! Ready for production deployment.');
    console.log('\n📋 Next Steps:');
    console.log('1. Push code to GitHub repository');
    console.log('2. Connect repository to Render (Blueprint deployment)');
    console.log('3. Monitor deployment logs');
    console.log('4. Run health check: node health-check.js <YOUR_URL>');
    console.log('5. Test application functionality');
    console.log('\n🚀 Your RFQ Tracker will be globally accessible with HTTPS!');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above before deploying.');
  }
  
  console.log('\n📖 For detailed instructions, see DEPLOYMENT.md');
}

runAllChecks();