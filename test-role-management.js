#!/usr/bin/env node

/**
 * Role Management Test Script
 * 
 * This script tests all role management functionality including:
 * - Creating roles
 * - Updating role permissions
 * - Assigning roles to users
 * - Deleting roles
 * - Permission checks
 * 
 * Usage: node test-role-management.js [admin-username] [admin-password]
 */

import 'dotenv/config';
import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
let authToken = null;
let sessionCookie = null;
let testUserId = null;
let testRoleId = null;
let testPermissionIds = [];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Axios instance with cookie support
const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to make authenticated requests
async function apiRequest(method, endpoint, data = null, useAuth = true) {
  try {
    const config = {
      method,
      url: endpoint,
      ...(data && { data }),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add session cookie if available
    if (useAuth && sessionCookie) {
      config.headers['Cookie'] = sessionCookie;
    }

    // Add JWT token if available
    if (useAuth && authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await axiosInstance(config);
    
    // Extract cookies from response if present
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader && Array.isArray(setCookieHeader)) {
      // Extract the session cookie
      const sessionCookieHeader = setCookieHeader.find(c => c.includes('clinic.session.id'));
      if (sessionCookieHeader) {
        sessionCookie = sessionCookieHeader.split(';')[0]; // Get just the cookie value
      }
    }
    
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    const errorData = error.response?.data || error.message;
    const status = error.response?.status || 500;
    
    return {
      success: false,
      error: errorData,
      status: status,
    };
  }
}

// Test 1: Login as admin
async function testLogin(username, password) {
  logTest('Admin Login');
  
  try {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password,
    });

    // Extract session cookie from response
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader && Array.isArray(setCookieHeader)) {
      const sessionCookieHeader = setCookieHeader.find(c => c.includes('clinic.session.id'));
      if (sessionCookieHeader) {
        sessionCookie = sessionCookieHeader.split(';')[0]; // Get just the cookie value
        logInfo(`Session cookie extracted: ${sessionCookie.substring(0, 50)}...`);
      }
    }

    if (response.data?.data?.user) {
      const user = response.data.data.user;
      logSuccess(`Logged in as ${username} (${user.role})`);
      logInfo(`User ID: ${user.id}, Organization: ${user.organization?.name || 'N/A'}`);
      return true;
    } else {
      logError(`Login response missing user data`);
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 2: Get all permissions
async function testGetPermissions() {
  logTest('Get All Permissions');
  
  const result = await apiRequest('GET', '/access-control/permissions');
  
  if (result.success && result.data.grouped) {
    const permissions = result.data.all || [];
    logSuccess(`Retrieved ${permissions.length} permissions`);
    
    // Store first few permission IDs for testing
    testPermissionIds = permissions.slice(0, 5).map(p => p.id);
    logInfo(`Using permission IDs: ${testPermissionIds.join(', ')}`);
    
    // Log permission categories
    const categories = Object.keys(result.data.grouped);
    logInfo(`Permission categories: ${categories.join(', ')}`);
    
    return true;
  } else {
    logError(`Failed to get permissions: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 3: Get all roles
async function testGetRoles() {
  logTest('Get All Roles');
  
  const result = await apiRequest('GET', '/access-control/roles');
  
  if (result.success && Array.isArray(result.data)) {
    logSuccess(`Retrieved ${result.data.length} roles`);
    
    result.data.forEach(role => {
      logInfo(`  - ${role.name} (ID: ${role.id}, Users: ${role.userCount}, Permissions: ${role.permissions?.length || 0})`);
    });
    
    return true;
  } else {
    logError(`Failed to get roles: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 4: Create a new role
async function testCreateRole() {
  logTest('Create New Role');
  
  const roleData = {
    name: `test_role_${Date.now()}`,
    description: 'Test role created by automated test script',
    permissionIds: testPermissionIds,
  };
  
  const result = await apiRequest('POST', '/access-control/roles', roleData);
  
  if (result.success && result.data.id) {
    testRoleId = result.data.id;
    logSuccess(`Created role: ${roleData.name} (ID: ${testRoleId})`);
    logInfo(`Assigned ${testPermissionIds.length} permissions`);
    return true;
  } else {
    logError(`Failed to create role: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 5: Get single role
async function testGetSingleRole() {
  logTest('Get Single Role');
  
  if (!testRoleId) {
    logError('No test role ID available');
    return false;
  }
  
  const result = await apiRequest('GET', `/access-control/roles/${testRoleId}`);
  
  if (result.success && result.data.id) {
    logSuccess(`Retrieved role: ${result.data.name}`);
    logInfo(`  Description: ${result.data.description}`);
    logInfo(`  User Count: ${result.data.userCount}`);
    logInfo(`  Permissions: ${result.data.permissions?.length || 0}`);
    
    if (result.data.permissions && result.data.permissions.length > 0) {
      logInfo(`  Sample permissions: ${result.data.permissions.slice(0, 3).map(p => p.name).join(', ')}`);
    }
    
    return true;
  } else {
    logError(`Failed to get role: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 6: Update role permissions
async function testUpdateRolePermissions() {
  logTest('Update Role Permissions');
  
  if (!testRoleId) {
    logError('No test role ID available');
    return false;
  }
  
  // Get all permissions first
  const permResult = await apiRequest('GET', '/access-control/permissions');
  if (!permResult.success) {
    logError('Failed to get permissions for update test');
    return false;
  }
  
  // Use different permissions for update
  const allPerms = permResult.data.all || [];
  const newPermissionIds = allPerms.slice(5, 10).map(p => p.id);
  
  const result = await apiRequest('PUT', `/access-control/roles/${testRoleId}/permissions`, {
    permissionIds: newPermissionIds,
  });
  
  if (result.success) {
    logSuccess(`Updated role permissions`);
    logInfo(`New permission count: ${newPermissionIds.length}`);
    
    // Verify the update
    const verifyResult = await apiRequest('GET', `/access-control/roles/${testRoleId}`);
    if (verifyResult.success) {
      const actualCount = verifyResult.data.permissions?.length || 0;
      if (actualCount === newPermissionIds.length) {
        logSuccess(`Permissions verified: ${actualCount} permissions assigned`);
      } else {
        logError(`Permission count mismatch: expected ${newPermissionIds.length}, got ${actualCount}`);
      }
    }
    
    return true;
  } else {
    logError(`Failed to update permissions: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 7: Get a test user
async function testGetTestUser() {
  logTest('Get Test User');
  
  // Get staff list
  const result = await apiRequest('GET', '/access-control/staff');
  
  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    // Find a user that's not an admin (to test role assignment)
    const testUser = result.data.find(u => 
      u.role !== 'admin' && u.role !== 'superadmin' && u.role !== 'super_admin'
    ) || result.data[0];
    
    testUserId = testUser.id;
    logSuccess(`Found test user: ${testUser.username} (ID: ${testUserId})`);
    logInfo(`Current role: ${testUser.role || 'None'} (roleId: ${testUser.roleId || 'None'})`);
    
    return true;
  } else {
    logError(`Failed to get users: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 8: Assign role to user
async function testAssignRoleToUser() {
  logTest('Assign Role to User');
  
  if (!testUserId || !testRoleId) {
    logError('Missing test user ID or role ID');
    return false;
  }
  
  const result = await apiRequest('PUT', `/access-control/users/${testUserId}/role`, {
    roleId: testRoleId,
  });
  
  if (result.success) {
    logSuccess(`Assigned role ${testRoleId} to user ${testUserId}`);
    
    // Verify the assignment
    const verifyResult = await apiRequest('GET', `/access-control/users/${testUserId}/permissions`);
    if (verifyResult.success) {
      const permissions = verifyResult.data || [];
      logInfo(`User now has ${permissions.length} permissions`);
      if (permissions.length > 0) {
        logInfo(`Sample permissions: ${permissions.slice(0, 3).map(p => p.name).join(', ')}`);
      }
    }
    
    return true;
  } else {
    logError(`Failed to assign role: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 9: Get user permissions
async function testGetUserPermissions() {
  logTest('Get User Permissions');
  
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }
  
  const result = await apiRequest('GET', `/access-control/users/${testUserId}/permissions`);
  
  if (result.success && Array.isArray(result.data)) {
    logSuccess(`User has ${result.data.length} permissions`);
    
    if (result.data.length > 0) {
      logInfo('Sample permissions:');
      result.data.slice(0, 5).forEach(perm => {
        logInfo(`  - ${perm.name}: ${perm.description}`);
      });
    } else {
      logInfo('User has no permissions assigned');
    }
    
    return true;
  } else {
    logError(`Failed to get user permissions: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 10: Try to delete role with assigned users (should fail)
async function testDeleteRoleWithUsers() {
  logTest('Try Delete Role with Assigned Users (Should Fail)');
  
  if (!testRoleId) {
    logError('No test role ID available');
    return false;
  }
  
  const result = await apiRequest('DELETE', `/access-control/roles/${testRoleId}`);
  
  if (!result.success && result.status === 400) {
    logSuccess(`Correctly prevented deletion: ${result.error?.message || 'Role has assigned users'}`);
    return true;
  } else if (result.success) {
    logError('Role was deleted even though it has assigned users!');
    testRoleId = null; // Role was deleted
    return false;
  } else {
    logError(`Unexpected error: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 11: Remove role from user
async function testRemoveRoleFromUser() {
  logTest('Remove Role from User');
  
  if (!testUserId) {
    logError('No test user ID available');
    return false;
  }
  
  const result = await apiRequest('PUT', `/access-control/users/${testUserId}/role`, {
    roleId: null,
  });
  
  if (result.success) {
    logSuccess(`Removed role from user ${testUserId}`);
    return true;
  } else {
    logError(`Failed to remove role: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 12: Delete role (should succeed now)
async function testDeleteRole() {
  logTest('Delete Role');
  
  if (!testRoleId) {
    logError('No test role ID available');
    return false;
  }
  
  const result = await apiRequest('DELETE', `/access-control/roles/${testRoleId}`);
  
  if (result.success) {
    logSuccess(`Deleted role ${testRoleId}`);
    testRoleId = null;
    return true;
  } else {
    logError(`Failed to delete role: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
}

// Test 13: Test unauthorized access
async function testUnauthorizedAccess() {
  logTest('Test Unauthorized Access (Permission Checks)');
  
  // Create a new axios instance without cookies to test unauthorized access
  const unauthorizedAxios = axios.create({
    baseURL: API_BASE,
    withCredentials: false, // No cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  try {
    const response = await unauthorizedAxios.post('/access-control/roles', {
      name: 'unauthorized_test',
      description: 'Should fail',
      permissionIds: [],
    });
    
    logError(`Security issue: Unauthorized request was allowed!`);
    return false;
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 401 || status === 403) {
      logSuccess(`Correctly blocked unauthorized access (Status: ${status})`);
      return true;
    } else {
      logError(`Unexpected error status: ${status}`);
      return false;
    }
  }
}

// Test 14: Bulk assign roles
async function testBulkAssignRoles() {
  logTest('Bulk Assign Roles');
  
  // Get multiple users
  const staffResult = await apiRequest('GET', '/access-control/staff');
  if (!staffResult.success || !Array.isArray(staffResult.data) || staffResult.data.length < 2) {
    logInfo('Skipping bulk assign test - need at least 2 users');
    return true;
  }
  
  // Create a test role for bulk assignment
  const createResult = await apiRequest('POST', '/access-control/roles', {
    name: `bulk_test_role_${Date.now()}`,
    description: 'Test role for bulk assignment',
    permissionIds: testPermissionIds.slice(0, 2),
  });
  
  if (!createResult.success) {
    logError('Failed to create role for bulk test');
    return false;
  }
  
  const bulkTestRoleId = createResult.data.id;
  const userIds = staffResult.data.slice(0, 2).map(u => u.id);
  
  const result = await apiRequest('POST', '/access-control/bulk-assign-roles', {
    userIds,
    roleId: bulkTestRoleId,
  });
  
  if (result.success) {
    logSuccess(`Bulk assigned role to ${userIds.length} users`);
    
    // Clean up - remove role from users and delete role
    await apiRequest('POST', '/access-control/bulk-assign-roles', {
      userIds,
      roleId: null,
    });
    await apiRequest('DELETE', `/access-control/roles/${bulkTestRoleId}`);
    
    return true;
  } else {
    logError(`Failed to bulk assign roles: ${result.error?.message || 'Unknown error'}`);
    // Clean up
    await apiRequest('DELETE', `/access-control/roles/${bulkTestRoleId}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚀 Role Management Test Suite', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Get credentials from command line or use defaults
  const args = process.argv.slice(2);
  const username = args[0] || 'admin';
  const password = args[1] || 'admin';
  
  logInfo(`Using credentials: ${username}`);
  logInfo(`API Base URL: ${API_BASE}\n`);
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };
  
  try {
    // Run tests in sequence
    const tests = [
      { name: 'Login', fn: () => testLogin(username, password) },
      { name: 'Get Permissions', fn: testGetPermissions },
      { name: 'Get Roles', fn: testGetRoles },
      { name: 'Create Role', fn: testCreateRole },
      { name: 'Get Single Role', fn: testGetSingleRole },
      { name: 'Update Role Permissions', fn: testUpdateRolePermissions },
      { name: 'Get Test User', fn: testGetTestUser },
      { name: 'Assign Role to User', fn: testAssignRoleToUser },
      { name: 'Get User Permissions', fn: testGetUserPermissions },
      { name: 'Try Delete Role with Users', fn: testDeleteRoleWithUsers },
      { name: 'Remove Role from User', fn: testRemoveRoleFromUser },
      { name: 'Delete Role', fn: testDeleteRole },
      { name: 'Test Unauthorized Access', fn: testUnauthorizedAccess },
      { name: 'Bulk Assign Roles', fn: testBulkAssignRoles },
    ];
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result === true) {
          results.passed++;
        } else if (result === false) {
          results.failed++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        logError(`Test "${test.name}" threw an error: ${error.message}`);
        results.failed++;
      }
    }
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 Test Summary', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`⏭️  Skipped: ${results.skipped}`, 'yellow');
    log(`📈 Total: ${results.passed + results.failed + results.skipped}`, 'blue');
    
    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
    
    if (results.failed === 0) {
      log('\n🎉 All tests passed!', 'green');
      process.exit(0);
    } else {
      log(`\n⚠️  ${results.failed} test(s) failed`, 'red');
      process.exit(1);
    }
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();

