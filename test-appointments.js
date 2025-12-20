/**
 * Appointment Testing Script (Node.js)
 * Run with: node test-appointments.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001/api';

// Test credentials (update these)
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return {
      ok: response.ok,
      status: response.status,
      data: json
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null
    };
  }
}

// Test functions
async function login() {
  console.log('🔐 Logging in...');
  const result = await apiRequest('POST', '/auth/login', TEST_CREDENTIALS);
  
  if (result.ok && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Login successful\n');
    return true;
  } else {
    console.error('❌ Login failed:', result.data);
    return false;
  }
}

async function getAllAppointments() {
  console.log('📅 Getting all appointments...');
  const result = await apiRequest('GET', '/appointments', null, authToken);
  
  if (result.ok) {
    console.log(`✅ Found ${Array.isArray(result.data) ? result.data.length : 'unknown'} appointments`);
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to get appointments:', result.data);
    return null;
  }
}

async function getAppointmentsByDate(date) {
  console.log(`📅 Getting appointments for date: ${date}...`);
  const result = await apiRequest('GET', `/appointments?date=${date}`, null, authToken);
  
  if (result.ok) {
    console.log(`✅ Found ${Array.isArray(result.data) ? result.data.length : 'unknown'} appointments`);
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to get appointments:', result.data);
    return null;
  }
}

async function getFirstPatient() {
  console.log('👤 Getting first patient...');
  const result = await apiRequest('GET', '/patients?limit=1', null, authToken);
  
  if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
    const patient = result.data[0];
    console.log(`✅ Found patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})\n`);
    return patient;
  } else {
    console.error('❌ No patients found');
    return null;
  }
}

async function getFirstDoctor() {
  console.log('👨‍⚕️ Getting first doctor...');
  const result = await apiRequest('GET', '/users?role=doctor&limit=1', null, authToken);
  
  if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
    const doctor = result.data[0];
    console.log(`✅ Found doctor: ${doctor.username} (ID: ${doctor.id})\n`);
    return doctor;
  } else {
    console.error('❌ No doctors found');
    return null;
  }
}

async function createAppointment(patientId, doctorId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointmentDate = tomorrow.toISOString().split('T')[0];
  const appointmentTime = '10:00';

  console.log(`📝 Creating appointment for ${appointmentDate} at ${appointmentTime}...`);
  
  const appointmentData = {
    patientId,
    doctorId,
    appointmentDate,
    appointmentTime,
    duration: 30,
    type: 'consultation',
    notes: 'Test appointment created by script'
  };

  const result = await apiRequest('POST', '/appointments', appointmentData, authToken);
  
  if (result.ok) {
    console.log('✅ Appointment created successfully');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to create appointment:', result.data);
    return null;
  }
}

async function updateAppointment(appointmentId) {
  console.log(`✏️ Updating appointment ${appointmentId}...`);
  
  const updateData = {
    notes: 'Updated notes from test script',
    status: 'confirmed'
  };

  const result = await apiRequest('PATCH', `/appointments/${appointmentId}`, updateData, authToken);
  
  if (result.ok) {
    console.log('✅ Appointment updated successfully');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to update appointment:', result.data);
    return null;
  }
}

async function getPatientAppointments(patientId) {
  console.log(`📋 Getting appointments for patient ${patientId}...`);
  const result = await apiRequest('GET', `/patients/${patientId}/appointments`, null, authToken);
  
  if (result.ok) {
    console.log(`✅ Found ${Array.isArray(result.data) ? result.data.length : 'unknown'} appointments`);
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to get patient appointments:', result.data);
    return null;
  }
}

async function startConsultation(appointmentId) {
  console.log(`🚀 Starting consultation for appointment ${appointmentId}...`);
  const result = await apiRequest('POST', `/appointments/${appointmentId}/start-consultation`, null, authToken);
  
  if (result.ok) {
    console.log('✅ Consultation started');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to start consultation:', result.data);
    return null;
  }
}

async function completeConsultation(appointmentId) {
  console.log(`✅ Completing consultation for appointment ${appointmentId}...`);
  const result = await apiRequest('POST', `/appointments/${appointmentId}/complete-consultation`, null, authToken);
  
  if (result.ok) {
    console.log('✅ Consultation completed');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to complete consultation:', result.data);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('=== Appointment Testing Script ===\n');

  // Check if fetch is available (Node.js 18+)
  if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ or install node-fetch');
    console.log('Install: npm install node-fetch');
    process.exit(1);
  }

  try {
    // Step 1: Login
    const loggedIn = await login();
    if (!loggedIn) {
      console.error('Cannot proceed without authentication');
      process.exit(1);
    }

    // Step 2: Get all appointments
    await getAllAppointments();

    // Step 3: Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    await getAppointmentsByDate(today);

    // Step 4: Get patient and doctor
    const patient = await getFirstPatient();
    const doctor = await getFirstDoctor();

    if (!patient || !doctor) {
      console.error('Cannot create appointment without patient and doctor');
      process.exit(1);
    }

    // Step 5: Create appointment
    const appointment = await createAppointment(patient.id, doctor.id);
    
    if (appointment) {
      // Step 6: Get patient appointments
      await getPatientAppointments(patient.id);

      // Step 7: Update appointment
      await updateAppointment(appointment.id);

      // Step 8: Start consultation
      await startConsultation(appointment.id);

      // Step 9: Complete consultation
      await completeConsultation(appointment.id);
    }

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

