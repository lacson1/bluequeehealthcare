#!/usr/bin/env node

/**
 * Super Admin Control Center Test Suite
 * Tests all major Super Admin functionality including:
 * - Organization Management
 * - User Management
 * - System Controls
 * - Security Features
 * - Data Management
 * - Analytics
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const SUPERADMIN_USERNAME = process.argv[2] || 'superadmin';
const SUPERADMIN_PASSWORD = process.argv[3] || 'super123';

let sessionCookie = '';
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  testResults.total++;
  if (status === 'pass') {
    testResults.passed++;
    log(`✅ PASSED: ${name}`, 'green');
  } else if (status === 'fail') {
    testResults.failed++;
    log(`❌ FAILED: ${name}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  } else {
    testResults.skipped++;
    log(`⏭️  SKIPPED: ${name}`, 'yellow');
  }
}

import http from 'http';
import https from 'https';
import { URL } from 'url';

async function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`);
      const client = url.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
          ...headers
        }
      };

      if (data) {
        const body = JSON.stringify(data);
        requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
      }

      const req = client.request(requestOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          let parsedData = {};
          try {
            parsedData = responseData ? JSON.parse(responseData) : {};
          } catch (e) {
            // Not JSON, keep as string
            parsedData = { raw: responseData };
          }

          const setCookieHeader = res.headers['set-cookie'];
          const responseHeaders = {
            get: (name) => {
              const lowerName = name.toLowerCase();
              if (lowerName === 'set-cookie') {
                if (Array.isArray(setCookieHeader)) {
                  return setCookieHeader.join('; ');
                }
                return setCookieHeader || null;
              }
              return res.headers[lowerName] || null;
            }
          };

          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsedData,
            headers: responseHeaders
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          ok: false,
          status: 0,
          error: error.message,
          data: {}
        });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    } catch (error) {
      resolve({
        ok: false,
        status: 0,
        error: error.message,
        data: {}
      });
    }
  });
}

// Test 1: Authentication
async function testAuthentication() {
  log('\n🔐 Testing Authentication...', 'cyan');
  
  const response = await makeRequest('POST', '/api/auth/login', {
    username: SUPERADMIN_USERNAME,
    password: SUPERADMIN_PASSWORD
  });

  // Debug: log response details
  if (!response.ok) {
    log(`   Debug: Status ${response.status}, Data: ${JSON.stringify(response.data)}`, 'yellow');
  }

  if (response.ok && (response.data.user || response.data.message === 'Login successful')) {
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      // Extract cookie from Set-Cookie header
      // Format: clinic.session.id=value; Path=/; Expires=...
      const cookieMatch = cookies.match(/clinic\.session\.id=([^;]+)/);
      if (cookieMatch) {
        sessionCookie = `clinic.session.id=${cookieMatch[1]}`;
        const userInfo = response.data.user || { username: SUPERADMIN_USERNAME, role: 'superadmin' };
        logTest('Super Admin Login', 'pass', `Logged in as ${userInfo.username} (${userInfo.role})`);
        return true;
      } else {
        // Try generic extraction
        const genericMatch = cookies.match(/([^=;]+)=([^;]+)/);
        if (genericMatch) {
          sessionCookie = `${genericMatch[1]}=${genericMatch[2]}`;
          const userInfo = response.data.user || { username: SUPERADMIN_USERNAME, role: 'superadmin' };
          logTest('Super Admin Login', 'pass', `Logged in as ${userInfo.username} (${userInfo.role})`);
          return true;
        }
      }
    }
    
    // If login was successful but no cookie, check if token-based auth is used
    if (response.data.token || response.data.message === 'Login successful') {
      logTest('Super Admin Login', 'pass', `Login successful - Using token-based auth`);
      return true;
    }
    
    logTest('Super Admin Login - Cookie Extraction', 'fail', `No session cookie found. Response: ${JSON.stringify(response.data)}`);
    return false;
  } else {
    logTest('Super Admin Login', 'fail', response.data.error || response.data.message || `Status: ${response.status} - Login failed`);
    return false;
  }
}

// Test 2: Organization Management
async function testOrganizationManagement() {
  log('\n🏢 Testing Organization Management...', 'cyan');
  
  // Get all organizations
  const getOrgs = await makeRequest('GET', '/api/superadmin/organizations');
  if (getOrgs.ok && Array.isArray(getOrgs.data)) {
    logTest('Get All Organizations', 'pass', `Found ${getOrgs.data.length} organizations`);
  } else {
    logTest('Get All Organizations', 'fail', getOrgs.data.error || 'Failed to fetch organizations');
  }

  // Create test organization
  const testOrg = {
    name: `Test Org ${Date.now()}`,
    address: '123 Test Street',
    phone: '123-456-7890',
    email: `test${Date.now()}@example.com`
  };

  const createOrg = await makeRequest('POST', '/api/superadmin/organizations', testOrg);
  if (createOrg.ok && createOrg.data.id) {
    logTest('Create Organization', 'pass', `Created org ID: ${createOrg.data.id}`);
    const orgId = createOrg.data.id;

    // Update organization status
    const updateStatus = await makeRequest('PATCH', `/api/superadmin/organizations/${orgId}/status`, {
      status: 'suspended',
      reason: 'Test suspension'
    });
    if (updateStatus.ok) {
      logTest('Update Organization Status', 'pass');
    } else {
      logTest('Update Organization Status', 'fail', updateStatus.data.error);
    }

    // Update organization details
    const updateOrg = await makeRequest('PATCH', `/api/superadmin/organizations/${orgId}`, {
      name: `${testOrg.name} (Updated)`
    });
    if (updateOrg.ok) {
      logTest('Update Organization Details', 'pass');
    } else {
      logTest('Update Organization Details', 'fail', updateOrg.data.error);
    }
  } else {
    logTest('Create Organization', 'fail', createOrg.data.error || 'Failed to create organization');
  }
}

// Test 3: User Management
async function testUserManagement() {
  log('\n👥 Testing User Management...', 'cyan');
  
  // Get all users
  const getUsers = await makeRequest('GET', '/api/superadmin/users');
  if (getUsers.ok && Array.isArray(getUsers.data)) {
    logTest('Get All Users', 'pass', `Found ${getUsers.data.length} users`);
    
    if (getUsers.data.length > 0) {
      const testUser = getUsers.data[0];
      const userId = testUser.id;

      // Lock user account
      const lockUser = await makeRequest('PATCH', `/api/superadmin/users/${userId}/status`, {
        status: 'locked',
        reason: 'Test lock'
      });
      if (lockUser.ok) {
        logTest('Lock User Account', 'pass');
        
        // Unlock user account
        const unlockUser = await makeRequest('PATCH', `/api/superadmin/users/${userId}/status`, {
          status: 'active',
          reason: 'Test unlock'
        });
        if (unlockUser.ok) {
          logTest('Unlock User Account', 'pass');
        } else {
          logTest('Unlock User Account', 'fail', unlockUser.data.error);
        }
      } else {
        logTest('Lock User Account', 'fail', lockUser.data.error);
      }

      // Test user impersonation
      const impersonate = await makeRequest('POST', `/api/superadmin/users/${userId}/impersonate`);
      if (impersonate.ok) {
        logTest('Impersonate User', 'pass');
      } else {
        logTest('Impersonate User', 'fail', impersonate.data.error || 'Impersonation not implemented');
      }
    }
  } else {
    logTest('Get All Users', 'fail', getUsers.data.error || 'Failed to fetch users');
  }
}

// Test 4: System Controls
async function testSystemControls() {
  log('\n⚙️  Testing System Controls...', 'cyan');
  
  // Maintenance mode
  const maintenance = await makeRequest('POST', '/api/superadmin/system/maintenance', {
    enabled: true,
    message: 'System maintenance test',
    estimatedDuration: '30 minutes'
  });
  if (maintenance.ok) {
    logTest('Enable Maintenance Mode', 'pass');
    
    // Disable maintenance mode
    const disableMaintenance = await makeRequest('POST', '/api/superadmin/system/maintenance', {
      enabled: false,
      message: '',
      estimatedDuration: ''
    });
    if (disableMaintenance.ok) {
      logTest('Disable Maintenance Mode', 'pass');
    } else {
      logTest('Disable Maintenance Mode', 'fail', disableMaintenance.data.error);
    }
  } else {
    logTest('Enable Maintenance Mode', 'fail', maintenance.data.error);
  }

  // System status
  const systemStatus = await makeRequest('GET', '/api/superadmin/system/status');
  if (systemStatus.ok) {
    logTest('Get System Status', 'pass');
  } else {
    logTest('Get System Status', 'fail', systemStatus.data.error);
  }

  // System stats
  const systemStats = await makeRequest('GET', '/api/superadmin/system-stats');
  if (systemStats.ok) {
    logTest('Get System Stats', 'pass');
  } else {
    logTest('Get System Stats', 'fail', systemStats.data.error);
  }
}

// Test 5: Feature Management
async function testFeatureManagement() {
  log('\n🎛️  Testing Feature Management...', 'cyan');
  
  // Get all features
  const getFeatures = await makeRequest('GET', '/api/superadmin/features');
  if (getFeatures.ok && Array.isArray(getFeatures.data)) {
    logTest('Get All Features', 'pass', `Found ${getFeatures.data.length} features`);
    
    if (getFeatures.data.length > 0) {
      const feature = getFeatures.data[0];
      const featureId = feature.id || feature.name;

      // Toggle feature
      const toggleFeature = await makeRequest('PATCH', `/api/superadmin/features/${featureId}`, {
        enabled: !feature.enabled
      });
      if (toggleFeature.ok) {
        logTest('Toggle Feature', 'pass');
        
        // Toggle back
        await makeRequest('PATCH', `/api/superadmin/features/${featureId}`, {
          enabled: feature.enabled
        });
      } else {
        logTest('Toggle Feature', 'fail', toggleFeature.data.error);
      }
    }
  } else {
    logTest('Get All Features', 'fail', getFeatures.data.error || 'Failed to fetch features');
  }
}

// Test 6: Analytics
async function testAnalytics() {
  log('\n📊 Testing Analytics...', 'cyan');
  
  // Get analytics
  const analytics = await makeRequest('GET', '/api/superadmin/analytics');
  if (analytics.ok) {
    logTest('Get System Analytics', 'pass');
  } else {
    logTest('Get System Analytics', 'fail', analytics.data.error);
  }

  // Get system health
  const systemHealth = await makeRequest('GET', '/api/superadmin/analytics/system-health');
  if (systemHealth.ok) {
    logTest('Get System Health', 'pass');
  } else {
    logTest('Get System Health', 'fail', systemHealth.data.error);
  }

  // Get comprehensive analytics
  const comprehensive = await makeRequest('GET', '/api/superadmin/analytics/comprehensive');
  if (comprehensive.ok) {
    logTest('Get Comprehensive Analytics', 'pass');
  } else {
    logTest('Get Comprehensive Analytics', 'fail', comprehensive.data.error);
  }
}

// Test 7: Security Features
async function testSecurityFeatures() {
  log('\n🔒 Testing Security Features...', 'cyan');
  
  // Get security policies
  const policies = await makeRequest('GET', '/api/superadmin/security/policies');
  if (policies.ok) {
    logTest('Get Security Policies', 'pass');
  } else {
    logTest('Get Security Policies', 'fail', policies.data.error);
  }

  // Get active sessions
  const sessions = await makeRequest('GET', '/api/superadmin/sessions');
  if (sessions.ok && Array.isArray(sessions.data)) {
    logTest('Get Active Sessions', 'pass', `Found ${sessions.data.length} sessions`);
  } else {
    logTest('Get Active Sessions', 'fail', sessions.data.error || 'Failed to fetch sessions');
  }

  // Get audit logs
  const auditLogs = await makeRequest('GET', '/api/superadmin/audit/logs');
  if (auditLogs.ok && Array.isArray(auditLogs.data)) {
    logTest('Get Audit Logs', 'pass', `Found ${auditLogs.data.length} log entries`);
  } else {
    logTest('Get Audit Logs', 'fail', auditLogs.data.error || 'Failed to fetch audit logs');
  }
}

// Test 8: Data Management
async function testDataManagement() {
  log('\n💾 Testing Data Management...', 'cyan');
  
  // Create backup
  const backup = await makeRequest('POST', '/api/superadmin/data/backup', {
    type: 'full',
    description: 'Test backup'
  });
  if (backup.ok) {
    logTest('Create System Backup', 'pass');
  } else {
    logTest('Create System Backup', 'fail', backup.data.error || 'Backup creation not fully implemented');
  }

  // Export data
  const exportData = await makeRequest('GET', '/api/superadmin/data/export?type=full');
  if (exportData.ok || exportData.status === 202) {
    logTest('Export System Data', 'pass');
  } else {
    logTest('Export System Data', 'fail', exportData.data.error || 'Export not fully implemented');
  }
}

// Test 9: Global Policies
async function testGlobalPolicies() {
  log('\n🌐 Testing Global Policies...', 'cyan');
  
  // Get global policies
  const getPolicies = await makeRequest('GET', '/api/superadmin/policies/global');
  if (getPolicies.ok) {
    logTest('Get Global Policies', 'pass');
    
    // Update global policies
    const updatePolicies = await makeRequest('PATCH', '/api/superadmin/policies/global', {
      allowPatientSelfRegistration: true,
      requireEmailVerification: false
    });
    if (updatePolicies.ok) {
      logTest('Update Global Policies', 'pass');
    } else {
      logTest('Update Global Policies', 'fail', updatePolicies.data.error);
    }
  } else {
    logTest('Get Global Policies', 'fail', getPolicies.data.error);
  }
}

// Test 10: Activity Monitoring
async function testActivityMonitoring() {
  log('\n📈 Testing Activity Monitoring...', 'cyan');
  
  // Get activity logs
  const activity = await makeRequest('GET', '/api/superadmin/activity');
  if (activity.ok && Array.isArray(activity.data)) {
    logTest('Get Activity Logs', 'pass', `Found ${activity.data.length} activities`);
  } else {
    logTest('Get Activity Logs', 'fail', activity.data.error || 'Failed to fetch activities');
  }

  // Get activity stats
  const activityStats = await makeRequest('GET', '/api/superadmin/activity/stats');
  if (activityStats.ok) {
    logTest('Get Activity Statistics', 'pass');
  } else {
    logTest('Get Activity Statistics', 'fail', activityStats.data.error);
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 Super Admin Control Center Test Suite', 'blue');
  log('='.repeat(60), 'blue');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log(`Username: ${SUPERADMIN_USERNAME}`, 'cyan');
  log('');

  // Test authentication first
  const authenticated = await testAuthentication();
  if (!authenticated) {
    log('\n❌ Authentication failed. Cannot proceed with tests.', 'red');
    process.exit(1);
  }

  // Run all test suites
  await testOrganizationManagement();
  await testUserManagement();
  await testSystemControls();
  await testFeatureManagement();
  await testAnalytics();
  await testSecurityFeatures();
  await testDataManagement();
  await testGlobalPolicies();
  await testActivityMonitoring();

  // Print summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⏭️  Skipped: ${testResults.skipped}`, 'yellow');
  log(`📈 Total: ${testResults.total}`, 'cyan');
  log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'cyan');
  log('');

  if (testResults.failed === 0) {
    log('🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

