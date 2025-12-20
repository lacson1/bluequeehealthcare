#!/usr/bin/env node

/**
 * Test script for Forgot Password feature
 * Tests the complete password reset flow
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testForgotPassword() {
  log('\n🔐 Testing Forgot Password Feature\n', 'cyan');
  
  // Get username from command line or use default
  const username = process.argv[2] || 'admin';
  const email = process.argv[3] || null;
  
  logInfo(`Testing with username: ${username}`);
  if (email) {
    logInfo(`Using email: ${email}`);
  }
  log('');

  try {
    // Step 1: Request password reset
    log('Step 1: Requesting password reset...', 'cyan');
    const resetRequest = {
      ...(email ? { email } : { username }),
    };

    const resetResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resetRequest),
    });

    const resetData = await resetResponse.json();
    
    if (!resetResponse.ok) {
      logError(`Failed to request password reset: ${resetData.error?.message || resetData.message}`);
      return;
    }

    logSuccess('Password reset request sent successfully');
    logInfo(`Response: ${resetData.data?.message || resetData.message}`);
    log('');

    // Step 2: Get reset token from database (for testing)
    logWarning('Note: In production, the reset token would be sent via email.');
    logWarning('For testing, you need to get the token from the database:');
    log('');
    log('Run this SQL query to get the reset token:', 'yellow');
    log(`SELECT id, username, email, password_reset_token, password_reset_expires`);
    log(`FROM users WHERE username = '${username}' OR email = '${email || username}';`);
    log('');

    // Step 3: Verify token endpoint
    log('Step 2: Testing token verification endpoint...', 'cyan');
    logInfo('To test token verification, you need a valid token from the database.');
    logInfo('Example: GET /api/auth/verify-reset-token/YOUR_TOKEN');
    log('');

    // Step 4: Test reset password (if token provided)
    const token = process.argv[4];
    if (token) {
      log('Step 3: Testing password reset with provided token...', 'cyan');
      const newPassword = 'TestPassword123!';
      
      const resetPasswordResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword,
        }),
      });

      const resetPasswordData = await resetPasswordResponse.json();
      
      if (!resetPasswordResponse.ok) {
        logError(`Failed to reset password: ${resetPasswordData.error?.message || resetPasswordData.message}`);
        return;
      }

      logSuccess('Password reset successfully!');
      logInfo(`Response: ${resetPasswordData.data?.message || resetPasswordData.message}`);
      log('');
      logWarning(`New password: ${newPassword}`);
      logWarning('Please change this password after testing!');
    } else {
      logInfo('To test password reset, provide a token as the 4th argument:');
      log(`node test-forgot-password.js ${username} ${email || ''} YOUR_TOKEN`);
    }

    log('\n📋 Test Summary:', 'cyan');
    logSuccess('✅ Forgot password request endpoint works');
    logInfo('ℹ️  Check server logs for reset URL (if email not configured)');
    logInfo('ℹ️  Check database for reset token');
    
    if (token) {
      logSuccess('✅ Password reset endpoint works');
    } else {
      logWarning('⚠️  Password reset not tested (no token provided)');
    }

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testForgotPassword()
  .then(() => {
    log('\n✨ Test completed!\n', 'green');
    process.exit(0);
  })
  .catch((error) => {
    logError(`\n💥 Test failed: ${error.message}\n`);
    process.exit(1);
  });

