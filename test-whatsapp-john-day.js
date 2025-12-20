#!/usr/bin/env node

/**
 * Test WhatsApp notification for patient "John Day"
 * This script finds the patient, creates/uses a session, and sends WhatsApp
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

// Handle cookies
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

async function findPatient(name) {
  try {
    logTest(`Searching for patient: ${name}...`);
    
    // Try to find patient by searching
    const response = await axiosInstance.get('/api/patients', {
      params: {
        search: name,
        limit: 50,
      },
    });

    const patients = response.data.data || response.data || [];
    
    // Search for "john day" (case insensitive)
    const searchTerms = name.toLowerCase().split(' ');
    const found = patients.find(patient => {
      const firstName = (patient.firstName || '').toLowerCase();
      const lastName = (patient.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      
      return searchTerms.every(term => 
        firstName.includes(term) || 
        lastName.includes(term) || 
        fullName.includes(term)
      );
    });

    if (found) {
      logSuccess(`Found patient: ${found.firstName} ${found.lastName} (ID: ${found.id})`);
      logInfo(`   Phone: ${found.phone || 'Not set'}`);
      logInfo(`   Email: ${found.email || 'Not set'}`);
      return found;
    } else {
      logWarning(`Patient "${name}" not found. Available patients:`);
      patients.slice(0, 5).forEach(p => {
        logInfo(`   - ${p.firstName} ${p.lastName} (ID: ${p.id})`);
      });
      return null;
    }
  } catch (error) {
    logError(`Error finding patient: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function findOrCreateSession(patientId) {
  try {
    logTest('Finding or creating telemedicine session...');
    
    // Try to find existing session
    const sessionsResponse = await axiosInstance.get('/api/telemedicine/sessions', {
      params: {
        limit: 100,
      },
    });

    const sessions = sessionsResponse.data.data || sessionsResponse.data || [];
    const existingSession = sessions.find(s => s.patientId === patientId && s.status === 'scheduled');
    
    if (existingSession) {
      logSuccess(`Found existing session: ID ${existingSession.id}`);
      logInfo(`   Scheduled: ${existingSession.scheduledTime}`);
      logInfo(`   Type: ${existingSession.type}`);
      return existingSession;
    }

    // Create new session
    logInfo('No existing session found. Creating new session...');
    
    // Get current user (doctor) ID
    const userResponse = await axiosInstance.get('/api/auth/me');
    const doctorId = userResponse.data.id || userResponse.data.user?.id;
    
    if (!doctorId) {
      logError('Could not get current user ID');
      return null;
    }

    // Schedule for 1 hour from now
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 1);
    
    const sessionResponse = await axiosInstance.post('/api/telemedicine/sessions', {
      patientId: patientId,
      doctorId: doctorId,
      type: 'video',
      scheduledTime: scheduledTime.toISOString(),
      status: 'scheduled',
    });

    const newSession = sessionResponse.data;
    logSuccess(`Created new session: ID ${newSession.id}`);
    logInfo(`   Scheduled: ${newSession.scheduledTime}`);
    return newSession;
  } catch (error) {
    logError(`Error with session: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function sendWhatsAppNotification(sessionId) {
  try {
    logTest(`Sending WhatsApp notification for session ${sessionId}...`);
    
    const response = await axiosInstance.post(
      `/api/telemedicine/sessions/${sessionId}/send-notification`,
      { type: 'whatsapp' }
    );

    if (response.data.success) {
      logSuccess('WhatsApp notification sent successfully!');
      logInfo(`   Type: ${response.data.type}`);
      logInfo(`   Recipient: ${response.data.recipient}`);
      logInfo(`   Message ID: ${response.data.messageId}`);
      
      if (response.data.messageId === 'logged-only') {
        logWarning('⚠️  Message was logged only (no WhatsApp provider configured)');
        logInfo('   Configure GREEN_API_ID and GREEN_API_TOKEN for free WhatsApp');
        logInfo('   Or configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for paid service');
      } else {
        logSuccess('✅ Actual WhatsApp message was sent!');
      }
      
      return { success: true, data: response.data };
    } else {
      logError(`Failed: ${response.data.message || response.data.error}`);
      return { success: false, error: response.data.message || response.data.error };
    }
  } catch (error) {
    logError(`Error sending notification: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log('WhatsApp Notification Test for John Day', 'cyan');
  console.log('='.repeat(60) + '\n');

  // Step 1: Login
  if (!(await login())) {
    process.exit(1);
  }
  console.log('');

  // Step 2: Find patient
  let patient = await findPatient('john day');
  
  // If not found, try to get any patient with a phone number
  if (!patient) {
    logWarning('Patient "john day" not found. Searching for any patient with phone number...');
    try {
      const response = await axiosInstance.get('/api/patients', {
        params: { limit: 100 },
      });
      const patients = response.data.data || response.data || [];
      patient = patients.find(p => p.phone && p.phone.trim());
      
      if (patient) {
        logSuccess(`Using patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
        logInfo(`   Phone: ${patient.phone}`);
      }
    } catch (error) {
      logError(`Error fetching patients: ${error.message}`);
    }
  }
  
  if (!patient) {
    logError('Cannot proceed without patient');
    logInfo('Please create a patient with a phone number first');
    process.exit(1);
  }
  console.log('');

  // Step 3: Check phone number
  if (!patient.phone) {
    logError('Patient does not have a phone number!');
    logInfo('Please update the patient record to include a phone number');
    logInfo(`   Format: +[country code][number] (e.g., +1234567890)`);
    process.exit(1);
  }

  if (!patient.phone.startsWith('+')) {
    logWarning(`Phone number missing country code: ${patient.phone}`);
    logInfo('   Update to include country code (e.g., +1234567890)');
  } else {
    logSuccess(`Phone number format is correct: ${patient.phone}`);
  }
  console.log('');

  // Step 4: Find or create session
  const session = await findOrCreateSession(patient.id);
  if (!session) {
    logError('Cannot proceed without session');
    process.exit(1);
  }
  console.log('');

  // Step 5: Send WhatsApp notification
  const result = await sendWhatsAppNotification(session.id);
  console.log('');

  // Summary
  console.log('='.repeat(60));
  log('Test Summary', 'cyan');
  console.log('='.repeat(60));
  
  if (result.success) {
    logSuccess('✅ WhatsApp notification test PASSED');
    if (result.data.messageId === 'logged-only') {
      logWarning('⚠️  Note: Message was logged only');
      logInfo('   Configure WhatsApp provider to send actual messages');
    } else {
      logSuccess('✅ Actual WhatsApp message was sent!');
    }
  } else {
    logError('❌ WhatsApp notification test FAILED');
    logError(`   Error: ${result.error}`);
  }
  
  console.log('\n');
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

