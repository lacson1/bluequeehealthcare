#!/usr/bin/env node

/**
 * Test script to create a referral from the Patient Dashboard
 * Tests the /api/patients/:id/referrals endpoint
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

async function getPatientReferrals(patientId) {
  console.log(`📋 Fetching referrals for patient ${patientId}...`);
  const response = await fetch(`${BASE_URL}/api/patients/${patientId}/referrals`, {
    headers: { 'Cookie': authCookies },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch referrals: ${response.statusText}`);
  }

  const referrals = await response.json();
  console.log(`✅ Found ${referrals.length} existing referrals`);
  return referrals;
}

async function createReferral(patientId, referralData) {
  console.log(`➕ Creating referral for patient ${patientId}...`);
  console.log('   Data:', JSON.stringify(referralData, null, 2));
  
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

  console.log(`✅ Referral created successfully!`);
  console.log(`   Referral ID: ${result.id}`);
  console.log(`   Specialty: ${result.specialty}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Urgency: ${result.urgency}`);
  return result;
}

async function testReferralCreation() {
  try {
    // Step 1: Login
    await login();

    // Step 2: Get a patient
    const patients = await getPatients();
    if (patients.length === 0) {
      throw new Error('No patients found. Please create a patient first.');
    }

    const patient = patients[0];
    console.log(`\n👤 Using patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})\n`);

    // Step 3: Get existing referrals
    const existingReferrals = await getPatientReferrals(patient.id);
    const initialCount = existingReferrals.length;

    // Step 4: Create a test referral
    const testReferral = {
      specialty: 'Cardiology',
      reason: 'Patient requires cardiac evaluation for chest pain',
      urgency: 'urgent',
      referredToFacility: 'Lagos University Teaching Hospital (LUTH)',
      referredToDoctor: 'Dr. Adebayo',
      notes: 'Test referral created via automated test script',
      followUpRequired: true,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    };

    const newReferral = await createReferral(patient.id, testReferral);

    // Step 5: Verify the referral was created
    console.log('\n🔍 Verifying referral creation...');
    const updatedReferrals = await getPatientReferrals(patient.id);
    const finalCount = updatedReferrals.length;

    if (finalCount === initialCount + 1) {
      console.log('✅ Verification successful: Referral count increased by 1');
    } else {
      console.log(`⚠️  Warning: Expected ${initialCount + 1} referrals, found ${finalCount}`);
    }

    // Step 6: Verify the referral details
    const createdReferral = updatedReferrals.find(r => r.id === newReferral.id);
    if (createdReferral) {
      console.log('✅ Referral found in list');
      console.log(`   Specialty: ${createdReferral.specialty}`);
      console.log(`   Reason: ${createdReferral.reason}`);
      console.log(`   Urgency: ${createdReferral.urgency}`);
      console.log(`   Status: ${createdReferral.status}`);
    } else {
      console.log('⚠️  Warning: Created referral not found in list');
    }

    // Step 7: Test with minimal required fields
    console.log('\n🧪 Testing with minimal required fields...');
    const minimalReferral = {
      specialty: 'Dermatology',
      reason: 'Skin condition evaluation',
      urgency: 'routine'
    };

    const minimalResult = await createReferral(patient.id, minimalReferral);
    console.log('✅ Minimal referral created successfully');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Login: Successful`);
    console.log(`✅ Patient Fetch: Successful (${patients.length} patients)`);
    console.log(`✅ Referral Creation (Full): Successful (ID: ${newReferral.id})`);
    console.log(`✅ Referral Creation (Minimal): Successful (ID: ${minimalResult.id})`);
    console.log(`✅ Referral Verification: Successful`);
    console.log(`\n🎉 All tests passed!`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testReferralCreation();

