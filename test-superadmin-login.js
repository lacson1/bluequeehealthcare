#!/usr/bin/env node

/**
 * Simple Super Admin Login Test
 * Tests the super admin demo login functionality
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const USERNAME = process.argv[2] || 'superadmin';
const PASSWORD = process.argv[3] || 'super123';

console.log('\n🧪 Testing Super Admin Login Demo');
console.log('=====================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Username: ${USERNAME}`);
console.log(`Password: ${PASSWORD}\n`);

async function testLogin() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD
      })
    });

    const data = await response.json();
    const cookies = response.headers.get('set-cookie');

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (cookies) {
      console.log(`\n✅ Session Cookie Received:`);
      console.log(`   ${cookies.substring(0, 100)}...`);
    }

    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      if (data.user) {
        console.log(`   User: ${data.user.username}`);
        console.log(`   Role: ${data.user.role}`);
        console.log(`   ID: ${data.user.id}`);
      }
      if (data.token) {
        console.log(`   Token: ${data.token.substring(0, 20)}...`);
      }
      return true;
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log(`   Error: ${data.message || data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('\n❌ CONNECTION ERROR');
    console.error(`   ${error.message}`);
    console.error('\n💡 Make sure the server is running:');
    console.error('   npm run dev');
    return false;
  }
}

testLogin().then(success => {
  process.exit(success ? 0 : 1);
});

