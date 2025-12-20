/**
 * Test script for telemedicine notification functionality
 * 
 * Usage: node test-telemedicine-notification.js
 * 
 * Prerequisites:
 * - Server must be running on http://localhost:5001
 * - You must have a valid auth token
 * - A telemedicine session must exist
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

// You'll need to replace these with actual values
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE';
const SESSION_ID = process.env.SESSION_ID || 1; // Replace with actual session ID

async function testNotification(type = 'email') {
  console.log(`\n🧪 Testing ${type.toUpperCase()} notification...`);
  console.log('='.repeat(50));

  try {
    const response = await fetch(`${BASE_URL}/api/telemedicine/sessions/${SESSION_ID}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({ type })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success! ${type.toUpperCase()} notification sent`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`❌ Failed to send ${type.toUpperCase()} notification`);
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error(`❌ Error testing ${type} notification:`, error.message);
    return false;
  }
}

async function getSessions() {
  console.log('\n📋 Fetching telemedicine sessions...');
  console.log('='.repeat(50));

  try {
    const response = await fetch(`${BASE_URL}/api/telemedicine/sessions`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch sessions:', response.status);
      return [];
    }

    const sessions = await response.json();
    console.log(`Found ${sessions.length} session(s)`);
    
    if (sessions.length > 0) {
      console.log('\nAvailable sessions:');
      sessions.forEach((session, index) => {
        console.log(`${index + 1}. Session ID: ${session.id}`);
        console.log(`   Patient: ${session.patientName}`);
        console.log(`   Doctor: ${session.doctorName}`);
        console.log(`   Scheduled: ${new Date(session.scheduledTime).toLocaleString()}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Type: ${session.type}`);
        console.log('');
      });
      return sessions;
    } else {
      console.log('No sessions found. Create a session first.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    return [];
  }
}

async function main() {
  console.log('🏥 Telemedicine Notification Test');
  console.log('='.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Session ID: ${SESSION_ID}`);

  // First, get available sessions
  const sessions = await getSessions();
  
  if (sessions.length === 0) {
    console.log('\n⚠️  No sessions available. Please create a telemedicine session first.');
    console.log('You can create one through the UI at http://localhost:5173/telemedicine');
    return;
  }

  // Use the first session if SESSION_ID wasn't provided
  const sessionId = SESSION_ID === 1 && sessions.length > 0 ? sessions[0].id : SESSION_ID;
  console.log(`\nUsing Session ID: ${sessionId}`);

  // Test email notification
  await testNotification('email');

  // Test SMS notification
  await testNotification('sms');

  // Test WhatsApp notification
  await testNotification('whatsapp');

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test completed!');
  console.log('\nNote: In development mode, notifications may be logged to console only.');
  console.log('Check server logs for notification details.');
}

// Run the tests
main().catch(console.error);

