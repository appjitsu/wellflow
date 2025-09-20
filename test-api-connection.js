#!/usr/bin/env node

// Simple test script to verify API connection
const API_BASE_URL = 'http://localhost:3001';

async function testApiConnection() {
  console.log('🧪 Testing API Connection...\n');

  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health endpoint working');
      console.log('   📊 Status:', healthData.status);
      console.log('   🕐 Uptime:', Math.round(healthData.uptime), 'seconds');
    } else {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    // Test 2: Get users
    console.log('\n2. Testing users endpoint...');
    const usersResponse = await fetch(`${API_BASE_URL}/users`);
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log('   ✅ Users endpoint working');
      console.log('   👥 Found', users.length, 'users');
    } else {
      throw new Error(`Users endpoint failed: ${usersResponse.status}`);
    }

    // Test 3: Create a test user
    console.log('\n3. Testing user creation...');
    const testUser = {
      name: 'API Test User',
      email: `test-${Date.now()}@example.com`,
    };

    const createResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    if (createResponse.ok) {
      const newUser = await createResponse.json();
      console.log('   ✅ User creation working');
      console.log('   🆔 Created user ID:', newUser.id);
      console.log('   📧 Email:', newUser.email);
    } else {
      throw new Error(`User creation failed: ${createResponse.status}`);
    }

    console.log('\n🎉 All API tests passed!');
    console.log('\n📱 You can now test the web app at: http://localhost:3000/api-test');
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('   - API server is running: cd apps/api && pnpm run start:dev');
    console.log('   - PostgreSQL and Redis are running: cd apps/api && pnpm run dev:services');
    process.exit(1);
  }
}

// Run the test
testApiConnection();
