#!/usr/bin/env node

/**
 * Test script to book an appointment for a patient named John
 */

const BASE_URL = 'http://localhost:5001';

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function getPatients(cookies) {
  const response = await fetch(`${BASE_URL}/api/patients`, {
    headers: { 'Cookie': cookies },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }

  return response.json();
}

async function findOrCreateJohn(cookies) {
  const patients = await getPatients(cookies);
  
  // Look for John
  let john = patients.find(p => 
    p.firstName?.toLowerCase().includes('john') || 
    p.lastName?.toLowerCase().includes('john')
  );

  if (!john) {
    // Create John if he doesn't exist
    console.log('Creating patient John...');
    const response = await fetch(`${BASE_URL}/api/patients`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      credentials: 'include',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-15',
        gender: 'male',
        phoneNumber: '+1234567890',
        email: 'john.doe@example.com',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create patient: ${error}`);
    }

    john = await response.json();
    console.log(`✅ Created patient: ${john.firstName} ${john.lastName} (ID: ${john.id})`);
  } else {
    console.log(`✅ Found existing patient: ${john.firstName} ${john.lastName} (ID: ${john.id})`);
  }

  return john;
}

async function getDoctors(cookies) {
  const response = await fetch(`${BASE_URL}/api/users/doctors`, {
    headers: { 'Cookie': cookies },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch doctors: ${response.statusText}`);
  }

  return response.json();
}

async function bookAppointment(cookies, patientId, doctorId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointmentDate = tomorrow.toISOString().split('T')[0];
  const appointmentTime = '10:00';

  console.log(`\n📅 Booking appointment:`);
  console.log(`   Patient ID: ${patientId}`);
  console.log(`   Doctor ID: ${doctorId}`);
  console.log(`   Date: ${appointmentDate}`);
  console.log(`   Time: ${appointmentTime}`);

  const response = await fetch(`${BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    credentials: 'include',
    body: JSON.stringify({
      patientId: patientId,
      doctorId: doctorId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      duration: 30,
      type: 'consultation',
      status: 'scheduled',
      priority: 'medium',
      notes: 'Test appointment for John'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to book appointment: ${error}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log('🔐 Logging in...');
    const cookies = await login();
    console.log('✅ Logged in successfully\n');

    console.log('👤 Finding or creating patient John...');
    const john = await findOrCreateJohn(cookies);

    console.log('\n👨‍⚕️ Finding available doctors...');
    const doctors = await getDoctors(cookies);
    
    if (!doctors || doctors.length === 0) {
      throw new Error('No doctors found. Please ensure doctors are seeded in the database.');
    }

    const doctor = doctors[0];
    console.log(`✅ Using doctor: ${doctor.username || doctor.firstName || 'Doctor'} (ID: ${doctor.id})`);

    console.log('\n📝 Booking appointment...');
    const appointment = await bookAppointment(cookies, john.id, doctor.id);

    console.log('\n✅ Appointment booked successfully!');
    console.log(`   Appointment ID: ${appointment.id}`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   Date: ${appointment.appointmentDate}`);
    console.log(`   Time: ${appointment.appointmentTime}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

