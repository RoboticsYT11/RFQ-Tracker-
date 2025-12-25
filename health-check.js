#!/usr/bin/env node

const https = require('https');
const http = require('http');

function healthCheck(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url + '/api/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          reject(error);
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
  });
}

async function main() {
  const url = process.argv[2];
  
  if (!url) {
    console.log('Usage: node health-check.js <URL>');
    console.log('Example: node health-check.js https://your-app.onrender.com');
    process.exit(1);
  }
  
  console.log(`🔍 Checking health of: ${url}`);
  
  try {
    const result = await healthCheck(url);
    
    if (result.status === 200 && result.data.status === 'ok') {
      console.log('✅ Health check passed!');
      console.log(`📊 Status: ${result.data.status}`);
      console.log(`💾 Database: ${result.data.database}`);
      console.log(`⏰ Timestamp: ${result.data.timestamp}`);
      console.log(`📝 Message: ${result.data.message}`);
    } else {
      console.log('❌ Health check failed!');
      console.log(`Status Code: ${result.status}`);
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.log('❌ Health check failed!');
    console.log('Error:', error.message);
  }
}

main();