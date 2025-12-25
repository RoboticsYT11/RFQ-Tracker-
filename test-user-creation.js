#!/usr/bin/env node

const https = require('https');

async function testUserCreation(baseUrl) {
  console.log('🔍 Testing User Creation API...\n');
  
  // Step 1: Login as admin
  console.log('Step 1: Logging in as admin...');
  
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });
  
  try {
    const loginResult = await makeRequest(baseUrl + '/api/auth/login', 'POST', loginData);
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResult.token;
    
    // Step 2: Try to create a new user
    console.log('\nStep 2: Creating new user...');
    
    const userData = JSON.stringify({
      username: 'testuser',
      email: 'test@company.com',
      password: 'test123',
      full_name: 'Test User',
      role: 'engineer'
    });
    
    const createResult = await makeRequest(
      baseUrl + '/api/auth/register', 
      'POST', 
      userData,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (createResult.success) {
      console.log('✅ User creation successful:', createResult.user);
    } else {
      console.log('❌ User creation failed:', createResult.message);
      console.log('Full response:', createResult);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

function makeRequest(url, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    
    const requestHeaders = { ...defaultHeaders, ...headers };
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: method,
      headers: requestHeaders
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          resolve({ success: false, message: 'Invalid JSON response', raw: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

// Run the test
const url = process.argv[2] || 'https://rfq-tracker.onrender.com';
testUserCreation(url);