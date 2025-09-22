#!/usr/bin/env node

/**
 * Deployment verification script
 * Tests key endpoints and functionality after deployment
 */

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.BASE_URL 
  ? process.env.BASE_URL
  : 'http://localhost:3000';

console.log(`🔍 Verifying deployment at: ${baseUrl}`);

async function testEndpoint(path, expectedStatus = 200) {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const status = response.status;
    const success = status === expectedStatus;
    
    console.log(`${success ? '✅' : '❌'} ${path} - Status: ${status} (expected: ${expectedStatus})`);
    
    if (!success) {
      const text = await response.text();
      console.log(`   Error response: ${text.substring(0, 200)}...`);
    }
    
    return success;
  } catch (error) {
    console.log(`❌ ${path} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Running deployment verification tests...\n');
  
  const tests = [
    // Core pages
    ['/', 200],
    
    // API endpoints
    ['/api/health', 200],
    ['/api/whatsapp?action=status&sessionId=test', 200],
    ['/api/whatsapp-qr?sessionId=test', 200],
    ['/api/whatsapp-qr/poll?sessionId=test', 404], // Expected 404 for non-existent session
    
    // AI endpoints (might fail if no API key configured)
    ['/api/ai/chat', 405], // Expected 405 for GET request to POST endpoint
    ['/api/ai/generate', 405], // Expected 405 for GET request to POST endpoint
    
    // Other API endpoints  
    ['/api/notes', 200],
    ['/api/tasks', 200],
    ['/api/projects', 200],
    ['/api/tags', 200],
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [path, expectedStatus] of tests) {
    if (await testEndpoint(path, expectedStatus)) {
      passed++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Deployment appears to be working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above for details.');
    process.exit(1);
  }
}

// Add basic fetch polyfill for Node.js < 18
if (!global.fetch) {
  console.log('Installing fetch polyfill...');
  const fetch = require('node-fetch');
  global.fetch = fetch;
}

runTests().catch(error => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});