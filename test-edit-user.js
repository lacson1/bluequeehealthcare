#!/usr/bin/env node

/**
 * Test script for Edit User functionality
 * Tests the PATCH /api/users/:id endpoint
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  log(`${statusIcon} ${testName}`, statusColor);
  if (details) {
    log(`   ${details}`, 'reset');
  }
}

async function makeRequest(method, endpoint, data = null, cookies = '') {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: response.headers,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

async function testEditUser() {
  log('\n🧪 Testing Edit User Functionality', 'cyan');
  log('='.repeat(50), 'cyan');

  // Step 1: Login as admin
  log('\n1️⃣  Logging in as admin...', 'blue');
  const loginResponse = await makeRequest('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123',
  });

  if (!loginResponse.ok) {
    logTest('Admin Login', 'fail', `Failed to login: ${loginResponse.data.message || loginResponse.error}`);
    return;
  }

  const cookies = loginResponse.headers.get('set-cookie') || '';
  logTest('Admin Login', 'pass');

  // Step 2: Get list of users
  log('\n2️⃣  Fetching users list...', 'blue');
  const usersResponse = await makeRequest('GET', '/api/users', null, cookies);
  
  if (!usersResponse.ok || !Array.isArray(usersResponse.data)) {
    logTest('Get Users', 'fail', `Failed to fetch users: ${usersResponse.data.message || usersResponse.error}`);
    return;
  }

  const users = usersResponse.data;
  logTest('Get Users', 'pass', `Found ${users.length} users`);

  if (users.length === 0) {
    logTest('Edit User', 'fail', 'No users found to test with');
    return;
  }

  // Step 3: Select a test user (prefer non-admin to avoid issues)
  const testUser = users.find(u => u.role !== 'admin' && u.role !== 'superadmin') || users[0];
  log(`\n3️⃣  Testing with user: ${testUser.username} (ID: ${testUser.id})`, 'blue');

  // Step 4: Prepare update data
  const updateData = {
    firstName: testUser.firstName === 'Test' ? 'TestUpdated' : 'Test',
    lastName: testUser.lastName === 'User' ? 'UserUpdated' : 'User',
    email: `test${Date.now()}@example.com`,
    phone: '+2341234567890',
  };

  log(`\n4️⃣  Updating user with data:`, 'blue');
  console.log(JSON.stringify(updateData, null, 2));

  // Step 5: Update the user
  const updateResponse = await makeRequest(
    'PATCH',
    `/api/users/${testUser.id}`,
    updateData,
    cookies
  );

  if (!updateResponse.ok) {
    logTest('Update User', 'fail', `Status: ${updateResponse.status} - ${updateResponse.data.message || updateResponse.statusText}`);
    console.log('Response data:', JSON.stringify(updateResponse.data, null, 2));
    return;
  }

  logTest('Update User', 'pass', 'User updated successfully');
  console.log('Updated user data:', JSON.stringify(updateResponse.data, null, 2));

  // Step 6: Verify the update
  log('\n5️⃣  Verifying update...', 'blue');
  const verifyResponse = await makeRequest('GET', `/api/users/${testUser.id}`, null, cookies);
  
  if (verifyResponse.ok) {
    const updatedUser = verifyResponse.data;
    const fieldsMatch = 
      updatedUser.firstName === updateData.firstName &&
      updatedUser.lastName === updateData.lastName &&
      updatedUser.email === updateData.email &&
      updatedUser.phone === updateData.phone;

    if (fieldsMatch) {
      logTest('Verify Update', 'pass', 'All fields updated correctly');
    } else {
      logTest('Verify Update', 'fail', 'Some fields did not update correctly');
      console.log('Expected:', updateData);
      console.log('Actual:', {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
      });
    }
  } else {
    logTest('Verify Update', 'fail', 'Could not fetch updated user');
  }

  // Step 7: Test updating with roleId (RBAC)
  log('\n6️⃣  Testing RBAC roleId update...', 'blue');
  
  // First, get available roles
  const rolesResponse = await makeRequest('GET', '/api/access-control/roles', null, cookies);
  if (rolesResponse.ok && Array.isArray(rolesResponse.data) && rolesResponse.data.length > 0) {
    const testRole = rolesResponse.data[0];
    const roleUpdateData = {
      roleId: testRole.id,
    };

    log(`Updating user role to: ${testRole.name} (ID: ${testRole.id})`, 'blue');
    const roleUpdateResponse = await makeRequest(
      'PATCH',
      `/api/users/${testUser.id}`,
      roleUpdateData,
      cookies
    );

    if (roleUpdateResponse.ok) {
      logTest('Update User Role (RBAC)', 'pass', `Role updated to ${testRole.name}`);
    } else {
      logTest('Update User Role (RBAC)', 'fail', `Failed: ${roleUpdateResponse.data.message || roleUpdateResponse.statusText}`);
    }
  } else {
    logTest('Update User Role (RBAC)', 'skip', 'No roles available to test with');
  }

  log('\n' + '='.repeat(50), 'cyan');
  log('✅ Edit User Test Complete!', 'green');
}

// Run the test
testEditUser().catch((error) => {
  log(`\n❌ Test failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

