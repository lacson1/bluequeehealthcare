#!/usr/bin/env node

/**
 * Script to create a referral for a test patient
 * This will find the first available patient or create a test patient, then create a referral
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

let authCookies = '';

async function login() {
  console.log('🔐 Logging in...');
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
  authCookies = cookies || '';
  console.log('✅ Login successful');
  return cookies;
}

async function getPatients() {
  console.log('📋 Fetching patients...');
  const response = await fetch(`${BASE_URL}/api/patients`, {
    headers: { 'Cookie': authCookies },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }

  const patients = await response.json();
  console.log(`✅ Found ${patients.length} patients`);
  return patients;
}

async function createTestPatient() {
  console.log('👤 Creating test patient...');
  const testPatient = {
    firstName: 'Test',
    lastName: 'Patient',
    dateOfBirth: '1990-01-15',
    gender: 'Male',
    phone: `+123456789${Math.floor(Math.random() * 1000)}`,
    email: `test.patient.${Date.now()}@example.com`,
    address: '123 Test Street'
  };

  const response = await fetch(`${BASE_URL}/api/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    },
    credentials: 'include',
    body: JSON.stringify(testPatient)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create patient: ${response.status} - ${errorText}`);
  }

  const patient = await response.json();
  console.log(`✅ Created test patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
  return patient;
}

async function getPatientReferrals(patientId) {
  const response = await fetch(`${BASE_URL}/api/patients/${patientId}/referrals`, {
    headers: { 'Cookie': authCookies },
    credentials: 'include'
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

async function createReferral(patientId, referralData) {
  console.log(`\n➕ Creating referral for patient ${patientId}...`);
  console.log('   Referral Details:');
  console.log(`   - Specialty: ${referralData.specialty}`);
  console.log(`   - Reason: ${referralData.reason}`);
  console.log(`   - Urgency: ${referralData.urgency}`);
  if (referralData.referredToFacility) {
    console.log(`   - Facility: ${referralData.referredToFacility}`);
  }
  if (referralData.referredToDoctor) {
    console.log(`   - Doctor: ${referralData.referredToDoctor}`);
  }
  
  const response = await fetch(`${BASE_URL}/api/patients/${patientId}/referrals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    },
    credentials: 'include',
    body: JSON.stringify(referralData)
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to create referral: ${response.status} - ${result.message || responseText}`);
  }

  console.log(`\n✅ Referral created successfully!`);
  console.log(`   Referral ID: ${result.id}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Referral Date: ${result.referralDate}`);
  
  return result;
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('🏥 Creating Referral for Test Patient');
    console.log('='.repeat(60));
    console.log(`Server: ${BASE_URL}\n`);

    // Step 1: Login
    await login();

    // Step 2: Get or create a patient
    let patients = await getPatients();
    let patient;

    if (patients.length === 0) {
      console.log('\n⚠️  No patients found. Creating a test patient...');
      patient = await createTestPatient();
    } else {
      // Use the first patient
      patient = patients[0];
      console.log(`\n👤 Using patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
    }

    // Step 3: Check existing referrals
    const existingReferrals = await getPatientReferrals(patient.id);
    console.log(`\n📋 Current referrals: ${existingReferrals.length}`);

    // Step 4: Create a referral
    const referralData = {
      specialty: 'Cardiology',
      reason: 'Patient requires cardiac evaluation for chest pain and shortness of breath. ECG shows abnormal findings.',
      urgency: 'urgent',
      referredToFacility: 'Lagos University Teaching Hospital (LUTH)',
      referredToDoctor: 'Dr. Adebayo',
      notes: 'Patient has been experiencing chest pain for the past 3 days. Initial ECG shows ST-segment changes. Requires urgent cardiology consultation.',
      followUpRequired: true,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    };

    const newReferral = await createReferral(patient.id, referralData);

    // Step 5: Verify
    console.log('\n🔍 Verifying referral...');
    const updatedReferrals = await getPatientReferrals(patient.id);
    console.log(`✅ Total referrals now: ${updatedReferrals.length}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
    console.log(`✅ Referral Created: ID ${newReferral.id}`);
    console.log(`✅ Specialty: ${newReferral.specialty}`);
    console.log(`✅ Status: ${newReferral.status}`);
    console.log(`✅ Urgency: ${newReferral.urgency}`);
    console.log(`\n🌐 View in browser: ${BASE_URL}/patients/${patient.id}?tab=referrals`);
    console.log('='.repeat(60));
    console.log('\n🎉 Referral created successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main();

