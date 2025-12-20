#!/usr/bin/env node

/**
 * Comprehensive Telemedicine Notification Test
 * Tests email, SMS, and WhatsApp notifications for telemedicine sessions
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
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
let cookies = '';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle cookies and tokens
axiosInstance.interceptors.response.use((response) => {
  const setCookieHeaders = response.headers['set-cookie'];
  if (setCookieHeaders) {
    cookies = setCookieHeaders.map((cookie) => cookie.split(';')[0]).join('; ');
  }
  return response;
});

axiosInstance.interceptors.request.use((config) => {
  if (cookies) {
    config.headers['Cookie'] = cookies;
  }
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

async function login() {
  try {
    logTest('Logging in...');
    const response = await axiosInstance.post('/api/auth/login', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    });

    if (response.data.token) {
      authToken = response.data.token;
      logSuccess('Login successful (token-based)');
    } else if (response.data.success) {
      logSuccess('Login successful (session-based)');
    } else {
      logError('Login failed - unexpected response');
      return false;
    }
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function getSessions() {
  try {
    logTest('Fetching telemedicine sessions...');
    const response = await axiosInstance.get('/api/telemedicine/sessions', {
      params: { limit: 100 },
    });

    const sessions = response.data.data || response.data || [];
    logSuccess(`Found ${sessions.length} session(s)`);
    return sessions;
  } catch (error) {
    logError(`Error fetching sessions: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

async function getPatients() {
  try {
    logTest('Fetching patients...');
    const response = await axiosInstance.get('/api/patients', {
      params: { limit: 50 },
    });

    const patients = response.data.data || response.data || [];
    logSuccess(`Found ${patients.length} patient(s)`);
    return patients;
  } catch (error) {
    logError(`Error fetching patients: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

async function createSession(patientId, doctorId) {
  try {
    logTest('Creating test telemedicine session...');
    
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 1);
    
    const response = await axiosInstance.post('/api/telemedicine/sessions', {
      patientId: patientId,
      doctorId: doctorId,
      type: 'video',
      scheduledTime: scheduledTime.toISOString(),
      status: 'scheduled',
    });

    const session = response.data;
    logSuccess(`Created session ID: ${session.id}`);
    logInfo(`   Scheduled: ${new Date(session.scheduledTime).toLocaleString()}`);
    logInfo(`   Type: ${session.type}`);
    return session;
  } catch (error) {
    logError(`Error creating session: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function testNotification(sessionId, type) {
  try {
    logTest(`Testing ${type.toUpperCase()} notification for session ${sessionId}...`);
    
    const response = await axiosInstance.post(
      `/api/telemedicine/sessions/${sessionId}/send-notification`,
      { type },
      {
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess(`${type.toUpperCase()} notification sent successfully!`);
      logInfo(`   Recipient: ${response.data.recipient || 'N/A'}`);
      logInfo(`   Message ID: ${response.data.messageId || 'N/A'}`);
      
      if (response.data.messageId === 'logged-only') {
        logWarning('⚠️  Message was logged only (no provider configured)');
        if (type === 'whatsapp') {
          logInfo('   Configure GREEN_API_ID and GREEN_API_TOKEN for free WhatsApp');
          logInfo('   Or configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for paid service');
        } else if (type === 'email') {
          logInfo('   Configure SENDGRID_API_KEY to send actual emails');
        }
      } else {
        logSuccess(`✅ Actual ${type.toUpperCase()} message was sent!`);
      }
      
      return { success: true, data: response.data };
    } else if (response.status === 400) {
      logError(`Validation error: ${response.data.message}`);
      if (response.data.hasEmail === false) {
        logWarning('   Patient does not have an email address');
      }
      if (response.data.hasPhone === false) {
        logWarning('   Patient does not have a phone number');
      }
      return { success: false, error: response.data.message };
    } else if (response.status === 500) {
      logError(`Server error: ${response.data.message || response.data.error}`);
      if (response.data.details) {
        logInfo(`   Details: ${response.data.details}`);
      }
      return { success: false, error: response.data.message || response.data.error };
    } else {
      logError(`Unexpected status: ${response.status}`);
      return { success: false, error: `Status ${response.status}` };
    }
  } catch (error) {
    logError(`Error: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkConfiguration() {
  logTest('Checking configuration...');
  console.log('');
  
  const greenApiId = process.env.GREEN_API_ID;
  const greenApiToken = process.env.GREEN_API_TOKEN;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  
  logInfo('WhatsApp Providers:');
  if (greenApiId && greenApiToken) {
    logSuccess('   ✅ Green API configured (FREE)');
  } else {
    logWarning('   ⚠️  Green API not configured');
  }
  
  if (twilioSid && twilioToken) {
    logSuccess('   ✅ Twilio configured (PAID)');
  } else {
    logWarning('   ⚠️  Twilio not configured');
  }
  
  if (!greenApiId && !twilioSid) {
    logWarning('   ⚠️  No WhatsApp provider configured - messages will be logged only');
  }
  
  console.log('');
  logInfo('Email Provider:');
  if (sendgridKey) {
    logSuccess('   ✅ SendGrid configured');
  } else {
    logWarning('   ⚠️  SendGrid not configured - emails will be logged only');
  }
  
  console.log('');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log('Telemedicine Notification Test Suite', 'cyan');
  console.log('='.repeat(60) + '\n');

  // Check configuration
  await checkConfiguration();

  // Step 1: Login
  if (!(await login())) {
    process.exit(1);
  }
  console.log('');

  // Step 2: Get sessions
  const sessions = await getSessions();
  console.log('');

  let session = null;

  // Step 3: Use existing session or create new one
  if (sessions.length > 0) {
    session = sessions[0];
    logSuccess(`Using existing session: ID ${session.id}`);
    logInfo(`   Patient: ${session.patientName || 'Unknown'}`);
    logInfo(`   Doctor: ${session.doctorName || 'Unknown'}`);
    logInfo(`   Scheduled: ${session.scheduledTime ? new Date(session.scheduledTime).toLocaleString() : 'Not set'}`);
  } else {
    logWarning('No existing sessions found. Creating new session...');
    
    // Get patients
    const patients = await getPatients();
    if (patients.length === 0) {
      logError('No patients found. Please create a patient first.');
      process.exit(1);
    }
    
    // Get current user (doctor)
    const userResponse = await axiosInstance.get('/api/auth/me');
    const doctorId = userResponse.data.id || userResponse.data.user?.id;
    
    if (!doctorId) {
      logError('Could not get current user ID');
      process.exit(1);
    }
    
    // Find patient with contact info
    const patient = patients.find(p => p.phone || p.email) || patients[0];
    
    session = await createSession(patient.id, doctorId);
    if (!session) {
      logError('Failed to create session');
      process.exit(1);
    }
  }
  console.log('');

  // Step 4: Test notifications
  log('Testing Notifications', 'cyan');
  console.log('='.repeat(60));
  console.log('');

  const results = {
    email: null,
    sms: null,
    whatsapp: null,
  };

  // Test Email
  log('📧 Email Notification', 'magenta');
  results.email = await testNotification(session.id, 'email');
  console.log('');

  // Test SMS
  log('📱 SMS Notification', 'magenta');
  results.sms = await testNotification(session.id, 'sms');
  console.log('');

  // Test WhatsApp
  log('💬 WhatsApp Notification', 'magenta');
  results.whatsapp = await testNotification(session.id, 'whatsapp');
  console.log('');

  // Summary
  console.log('='.repeat(60));
  log('Test Summary', 'cyan');
  console.log('='.repeat(60));
  console.log('');
  
  logInfo(`Session ID: ${session.id}`);
  logInfo(`Patient: ${session.patientName || 'Unknown'}`);
  console.log('');
  
  logInfo('Results:');
  log(`   Email:   ${results.email?.success ? '✅ PASSED' : '❌ FAILED'}`);
  log(`   SMS:     ${results.sms?.success ? '✅ PASSED' : '❌ FAILED'}`);
  log(`   WhatsApp: ${results.whatsapp?.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');

  // Detailed results
  if (results.email?.data?.messageId === 'logged-only') {
    logWarning('Email: Logged only (SendGrid not configured)');
  }
  if (results.sms?.data?.messageId === 'logged-only') {
    logWarning('SMS: Logged only (SMS provider not configured)');
  }
  if (results.whatsapp?.data?.messageId === 'logged-only') {
    logWarning('WhatsApp: Logged only (Green API or Twilio not configured)');
  }

  // Errors
  if (results.email?.error) {
    logError(`Email Error: ${results.email.error}`);
  }
  if (results.sms?.error) {
    logError(`SMS Error: ${results.sms.error}`);
  }
  if (results.whatsapp?.error) {
    logError(`WhatsApp Error: ${results.whatsapp.error}`);
  }

  console.log('');
  log('Test completed!', 'cyan');
  console.log('');
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
