#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.argv[2] || 'https://rfq-tracker-vy6i.onrender.com/api';
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('✅ Health Check: PASSED');
      console.log(`   Database: ${response.data.database}`);
      return true;
    } else {
      console.log('❌ Health Check: FAILED');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  console.log('🔐 Testing Login...');
  try {
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: TEST_CREDENTIALS
    });
    
    if (response.status === 200 && response.data.success && response.data.token) {
      console.log('✅ Login: PASSED');
      console.log(`   User: ${response.data.user.username} (${response.data.user.role})`);
      authToken = response.data.token;
      return true;
    } else {
      console.log('❌ Login: FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Login: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testGetProfile() {
  console.log('👤 Testing Get Profile...');
  try {
    const response = await makeRequest(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Get Profile: PASSED');
      console.log(`   Name: ${response.data.user.full_name}`);
      return true;
    } else {
      console.log('❌ Get Profile: FAILED');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Get Profile: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testGetRFQs() {
  console.log('📋 Testing Get RFQs...');
  try {
    const response = await makeRequest(`${BASE_URL}/rfq?limit=5`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Get RFQs: PASSED');
      console.log(`   Total RFQs: ${response.data.pagination.total}`);
      console.log(`   Current Page: ${response.data.pagination.page}`);
      return true;
    } else {
      console.log('❌ Get RFQs: FAILED');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Get RFQs: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testGetUsers() {
  console.log('👥 Testing Get Users...');
  try {
    const response = await makeRequest(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Get Users: PASSED');
      console.log(`   Total Users: ${response.data.data.length}`);
      return true;
    } else {
      console.log('❌ Get Users: FAILED');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Get Users: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testDashboardStats() {
  console.log('📊 Testing Dashboard Stats...');
  try {
    const response = await makeRequest(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Dashboard Stats: PASSED');
      console.log(`   Total RFQs: ${response.data.data.totalRfqs || 0}`);
      return true;
    } else {
      console.log('❌ Dashboard Stats: FAILED');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard Stats: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testCreateRFQ() {
  console.log('➕ Testing Create RFQ...');
  try {
    const testRFQ = {
      customer_name: 'API Test Company',
      customer_contact_person: 'Test Contact',
      email: 'test@apitest.com',
      phone: '+91-9999999999',
      company_name: 'API Test Company Ltd',
      rfq_received_date: new Date().toISOString().split('T')[0],
      rfq_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      product_project_name: 'API Test Project',
      rfq_category: 'Automation',
      rfq_source: 'Email',
      priority: 'Medium',
      estimated_project_value: 500000,
      currency: 'INR',
      expected_order_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks_notes: 'Created via API test script'
    };

    const response = await makeRequest(`${BASE_URL}/rfq`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: testRFQ
    });
    
    if (response.status === 201 && response.data.success) {
      console.log('✅ Create RFQ: PASSED');
      console.log(`   RFQ Number: ${response.data.data.rfq_number}`);
      return true;
    } else {
      console.log('❌ Create RFQ: FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Create RFQ: ERROR');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting RFQ Tracker API Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(50));

  const tests = [
    testHealthCheck,
    testLogin,
    testGetProfile,
    testGetUsers,
    testGetRFQs,
    testDashboardStats,
    testCreateRFQ
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Empty line for readability
  }

  console.log('=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Your API is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests
runAllTests().catch(console.error);