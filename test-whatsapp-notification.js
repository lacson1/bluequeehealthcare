#!/usr/bin/env node

/**
 * Test script for WhatsApp notification functionality
 * Tests sending WhatsApp notifications for telemedicine sessions
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Create axios instance with cookie support
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store cookies from responses
let cookies = '';

// Add response interceptor to capture cookies
axiosInstance.interceptors.response.use((response) => {
  const setCookieHeaders = response.headers['set-cookie'];
  if (setCookieHeaders) {
    cookies = setCookieHeaders.map((cookie) => cookie.split(';')[0]).join('; ');
  }
  return response;
});

// Add request interceptor to send cookies
axiosInstance.interceptors.request.use((config) => {
  if (cookies) {
    config.headers['Cookie'] = cookies;
  }
  return config;
});

const API_BASE_URL = process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:5001';
const TEST_USERNAME = process.env.TEST_USERNAME || 'admin';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

function logTest(message) {
  log(`🧪 ${message}`, 'cyan');
}

let authToken = '';
let testPatientId = null;
let testSessionId = null;

async function login() {
  try {
    logInfo(`Logging in to ${API_BASE_URL}...`);
    const response = await axiosInstance.post(`${API_BASE_URL}/api/auth/login`, {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    }, {
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });

    if (response.status === 200) {
      // Handle new response format: {success: true, data: {user: {...}}, message: "Login successful"}
      // The token is stored in session/cookie, so we need to use session-based auth
      if (response.data.token) {
        authToken = response.data.token;
      } else if (response.data.success) {
        // Session-based auth - token is in cookie
        authToken = 'session-based'; // Use session cookie
        logInfo('Using session-based authentication');
      }
      logSuccess('Login successful');
      return true;
    } else {
      logError('Login failed: No token received');
      logError(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError(`❌ Cannot connect to server at ${API_BASE_URL}`);
      logError('   Make sure the server is running!');
      logInfo('   Start server with: npm run dev');
    } else if (error.response) {
      logError(`Login failed: ${error.response.status}`);
      logError(`  ${error.response.data?.message || JSON.stringify(error.response.data)}`);
    } else {
      logError(`Login failed: ${error.message}`);
    }
    return false;
  }
}

async function getOrCreateTestPatient() {
  try {
    logInfo('Checking for test patient...');
    const response = await axiosInstance.get(`${API_BASE_URL}/api/patients`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Look for a test patient with phone number
    const testPatient = response.data.find(
      (p) => p.firstName === 'WhatsApp' && p.lastName === 'Test Patient' && p.phone
    );

    if (testPatient) {
      testPatientId = testPatient.id;
      logSuccess(`Found test patient (ID: ${testPatientId}, Phone: ${testPatient.phone})`);
      return testPatient;
    }

    // Create a new test patient with phone number
    logInfo('Creating new test patient with phone number...');
    const createResponse = await axiosInstance.post(
      `${API_BASE_URL}/api/patients`,
      {
        firstName: 'WhatsApp',
        lastName: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '+1234567890', // Test phone number - replace with real number for actual testing
        email: 'whatsapp.test@example.com',
      }
    );

    testPatientId = createResponse.data.id;
    logSuccess(`Created test patient (ID: ${testPatientId})`);
    logWarning(`⚠️  Using test phone number: ${createResponse.data.phone || '+1234567890'}`);
    logWarning(`⚠️  Replace with real WhatsApp number for actual testing`);
    return createResponse.data;
  } catch (error) {
    logError(`Failed to get/create test patient: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function createTestSession(patient) {
  try {
    logInfo('Creating test telemedicine session...');

    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 1); // Schedule 1 hour from now

    const sessionData = {
      patientId: patient.id,
      type: 'video',
      scheduledTime: scheduledTime.toISOString(),
      status: 'scheduled',
    };

    const response = await axiosInstance.post(
      `${API_BASE_URL}/api/telemedicine/sessions`,
      sessionData
    );

    testSessionId = response.data.id;
    logSuccess(`Created test session (ID: ${testSessionId})`);
    logInfo(`  Patient: ${patient.firstName} ${patient.lastName}`);
    logInfo(`  Phone: ${patient.phone || 'Not set'}`);
    logInfo(`  Scheduled: ${new Date(response.data.scheduledTime).toLocaleString()}`);
    return response.data;
  } catch (error) {
    logError(`Failed to create session: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.details) {
      logError(`Validation errors: ${JSON.stringify(error.response.data.details)}`);
    }
    throw error;
  }
}

async function testWhatsAppNotification(sessionId, expectedResult = 'success') {
  try {
    logTest(`Testing WhatsApp notification for session ${sessionId}...`);

    const response = await axiosInstance.post(
      `${API_BASE_URL}/api/telemedicine/sessions/${sessionId}/send-notification`,
      { type: 'whatsapp' },
      {
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess('WhatsApp notification sent successfully!');
      logInfo(`  Type: ${response.data.type}`);
      logInfo(`  Recipient: ${response.data.recipient}`);
      logInfo(`  Message ID: ${response.data.messageId}`);
      
      if (response.data.messageId === 'logged-only') {
        logWarning('⚠️  Notification was logged only (Twilio not configured)');
        logInfo('   Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to send actual messages');
      } else {
        logSuccess('✅ Actual WhatsApp message sent via Twilio!');
      }
      
      return { success: true, data: response.data };
    } else if (response.status === 400) {
      logError('Validation error:');
      logError(`  ${response.data.message}`);
      if (response.data.hasPhone === false) {
        logWarning('  Patient does not have a phone number');
      }
      if (response.data.phoneNumber) {
        logInfo(`  Phone number: ${response.data.phoneNumber}`);
      }
      return { success: false, error: response.data.message, data: response.data };
    } else if (response.status === 500) {
      logError('Failed to send WhatsApp notification:');
      logError(`  ${response.data.message || response.data.error}`);
      
      if (response.data.troubleshooting) {
        logInfo('\n📋 Troubleshooting tips:');
        Object.entries(response.data.troubleshooting).forEach(([key, value]) => {
          logInfo(`  • ${key}: ${value}`);
        });
      }
      
      return { success: false, error: response.data.message || response.data.error, data: response.data };
    } else {
      logError(`Unexpected response: ${response.status}`);
      logError(JSON.stringify(response.data, null, 2));
      return { success: false, error: 'Unexpected response', data: response.data };
    }
  } catch (error) {
    if (error.response) {
      logError(`API Error: ${error.response.status}`);
      logError(`  ${error.response.data?.message || JSON.stringify(error.response.data)}`);
      return { success: false, error: error.response.data?.message, data: error.response.data };
    } else {
      logError(`Network Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function testPhoneNumberValidation() {
  logTest('Testing phone number validation...');
  
  // This would require updating patient phone number
  // For now, just log what to check
  logInfo('To test phone number validation:');
  logInfo('  1. Check patient phone number format in database');
  logInfo('  2. Phone should include country code: +1234567890');
  logInfo('  3. Phone should not have spaces or special characters');
}

async function checkTwilioConfiguration() {
  logTest('Checking Twilio configuration...');
  
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (twilioAccountSid && twilioAuthToken) {
    logSuccess('Twilio credentials found');
    logInfo(`  Account SID: ${twilioAccountSid.substring(0, 10)}...`);
    logInfo(`  Auth Token: ${twilioAuthToken.substring(0, 10)}...`);
    logInfo(`  WhatsApp From: ${twilioWhatsAppFrom || 'Not set (will use sandbox)'}`);
    return true;
  } else {
    logWarning('Twilio credentials not found');
    logInfo('  Set these environment variables:');
    logInfo('    TWILIO_ACCOUNT_SID=your_account_sid');
    logInfo('    TWILIO_AUTH_TOKEN=your_auth_token');
    logInfo('    TWILIO_WHATSAPP_FROM=whatsapp:+14155238886');
    logWarning('  Notifications will be logged only (not actually sent)');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('WhatsApp Notification Test Suite', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  try {
    // Step 1: Check Twilio configuration
    const hasTwilio = await checkTwilioConfiguration();
    console.log('');

    // Step 2: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      logError('Cannot proceed without authentication');
      process.exit(1);
    }
    console.log('');

    // Step 3: Get or create test patient
    const patient = await getOrCreateTestPatient();
    console.log('');

    // Step 4: Validate phone number format
    if (patient.phone) {
      if (patient.phone.startsWith('+')) {
        logSuccess(`Phone number format is correct: ${patient.phone}`);
      } else {
        logWarning(`Phone number missing country code: ${patient.phone}`);
        logWarning('  Update to include country code (e.g., +1234567890)');
      }
    } else {
      logError('Patient does not have a phone number');
      logInfo('  Update patient record to include phone number');
    }
    console.log('');

    // Step 5: Create test session
    const session = await createTestSession(patient);
    console.log('');

    // Step 6: Test WhatsApp notification
    const result = await testWhatsAppNotification(session.id);
    console.log('');

    // Step 7: Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('Test Summary', 'cyan');
    log('='.repeat(60), 'cyan');
    
    if (result.success) {
      logSuccess('✅ WhatsApp notification test PASSED');
      if (result.data.messageId === 'logged-only') {
        logWarning('⚠️  Note: Message was logged only (Twilio not configured)');
        logInfo('   Configure Twilio to send actual WhatsApp messages');
      } else {
        logSuccess('✅ Actual WhatsApp message was sent!');
      }
    } else {
      logError('❌ WhatsApp notification test FAILED');
      logError(`   Error: ${result.error}`);
      
      log('\n📋 Next Steps:', 'yellow');
      if (result.error?.includes('phone number')) {
        logInfo('1. Update patient phone number to include country code');
        logInfo('2. Format: +[country code][number] (e.g., +1234567890)');
      } else if (result.error?.includes('credentials') || result.error?.includes('Twilio')) {
        logInfo('1. Set TWILIO_ACCOUNT_SID environment variable');
        logInfo('2. Set TWILIO_AUTH_TOKEN environment variable');
        logInfo('3. Set TWILIO_WHATSAPP_FROM (optional, uses sandbox if not set)');
      } else if (result.error?.includes('sandbox')) {
        logInfo('1. For Twilio sandbox, recipient must join first');
        logInfo('2. Send join code to Twilio WhatsApp number');
        logInfo('3. Or apply for WhatsApp Business API for production');
      } else {
        logInfo('1. Check server logs for detailed error information');
        logInfo('2. Verify Twilio account status and balance');
        logInfo('3. Check phone number is registered on WhatsApp');
      }
    }

    log('\n' + '='.repeat(60) + '\n', 'cyan');
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    if (error.response) {
      logError(`API Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

