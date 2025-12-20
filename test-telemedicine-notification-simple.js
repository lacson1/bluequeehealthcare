#!/usr/bin/env node

/**
 * Simple test script for telemedicine notification functionality
 * 
 * Usage: 
 *   node test-telemedicine-notification-simple.js
 *   SESSION_ID=123 node test-telemedicine-notification-simple.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const USERNAME = process.env.TEST_USERNAME || 'admin';
const PASSWORD = process.env.TEST_PASSWORD || 'admin123';
const SESSION_ID = process.env.SESSION_ID || null;

let authToken = '';

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
      credentials: 'include' // Include cookies for session-based auth
    });

    const data = await response.json();
    
    // Handle both token-based and session-based auth
    if (response.ok) {
      if (data.token) {
        authToken = data.token;
      } else if (data.success) {
        // Session-based auth - use cookie
        authToken = 'session'; // Flag for session auth
      }
      console.log('✅ Login successful\n');
      return true;
    } else {
      console.error('❌ Login failed:', data.message || data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('   Make sure server is running on', BASE_URL);
    return false;
  }
}

async function getSessions() {
  console.log('📋 Fetching telemedicine sessions...\n');
  try {
    const headers = {};
    if (authToken && authToken !== 'session') {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${BASE_URL}/api/telemedicine/sessions`, {
      headers,
      credentials: 'include' // Include cookies for session-based auth
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch sessions:', response.status);
      return [];
    }

    const sessions = await response.json();
    console.log(`Found ${sessions.length} session(s):\n`);
    
    sessions.forEach((session, i) => {
      console.log(`${i + 1}. Session ID: ${session.id}`);
      console.log(`   Patient: ${session.patientName || 'Unknown'}`);
      console.log(`   Doctor: ${session.doctorName || 'Unknown'}`);
      console.log(`   Scheduled: ${new Date(session.scheduledTime).toLocaleString()}`);
      console.log(`   Status: ${session.status}, Type: ${session.type}\n`);
    });
    
    return sessions;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function testNotification(sessionId, type) {
  console.log(`\n🧪 Testing ${type.toUpperCase()} notification for session ${sessionId}...`);
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken && authToken !== 'session') {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${BASE_URL}/api/telemedicine/sessions/${sessionId}/send-notification`, {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies for session-based auth
      body: JSON.stringify({ type })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${type.toUpperCase()} notification sent successfully!`);
      console.log(`   Recipient: ${data.recipient || 'N/A'}`);
      console.log(`   Message ID: ${data.messageId || 'N/A'}\n`);
      return true;
    } else {
      console.log(`❌ Failed to send ${type.toUpperCase()} notification`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.message || data.error || 'Unknown error'}`);
      if (data.hasEmail === false) {
        console.log('   ⚠️  Patient does not have an email address');
      }
      if (data.hasPhone === false) {
        console.log('   ⚠️  Patient does not have a phone number');
      }
      console.log('');
      return false;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🏥 Telemedicine Notification Test');
  console.log('='.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Username: ${USERNAME}\n`);

  // Login
  if (!await login()) {
    process.exit(1);
  }

  // Get sessions
  const sessions = await getSessions();
  
  if (sessions.length === 0) {
    console.log('⚠️  No sessions found. Please create a session first.');
    console.log('   You can create one at: http://localhost:5173/telemedicine\n');
    process.exit(0);
  }

  // Determine which session to test
  const sessionId = SESSION_ID 
    ? parseInt(SESSION_ID) 
    : sessions[0].id;

  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    console.error(`❌ Session ${sessionId} not found`);
    process.exit(1);
  }

  console.log(`\n📝 Testing notifications for:`);
  console.log(`   Session ID: ${session.id}`);
  console.log(`   Patient: ${session.patientName}`);
  console.log(`   Doctor: ${session.doctorName}`);
  console.log('='.repeat(50));

  // Test all notification types
  const results = {
    email: await testNotification(sessionId, 'email'),
    sms: await testNotification(sessionId, 'sms'),
    whatsapp: await testNotification(sessionId, 'whatsapp')
  };

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   Email: ${results.email ? '✅' : '❌'}`);
  console.log(`   SMS: ${results.sms ? '✅' : '❌'}`);
  console.log(`   WhatsApp: ${results.whatsapp ? '✅' : '❌'}`);
  console.log('\n💡 Note: In development mode, notifications may be logged to console only.');
  console.log('   Check server logs for notification details.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

