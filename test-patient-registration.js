#!/usr/bin/env node

/**
 * Test script to test patient registration functionality
 * Tests the /api/patients POST endpoint
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

let authCookies = '';

async function login(username = 'admin', password = 'admin123') {
  console.log(`🔐 Logging in as ${username}...`);
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${response.status} - ${errorText}`);
  }

  const cookies = response.headers.get('set-cookie');
  authCookies = cookies || '';
  console.log('✅ Login successful\n');
  return cookies;
}

async function registerPatient(patientData) {
  console.log('👤 Registering patient...');
  console.log('   Data:', JSON.stringify(patientData, null, 2));
  
  const response = await fetch(`${BASE_URL}/api/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    },
    credentials: 'include',
    body: JSON.stringify(patientData)
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${responseText}`);
  }

  if (!response.ok) {
    console.log(`❌ Registration failed: ${response.status}`);
    console.log(`   Error: ${result.message || responseText}`);
    return { success: false, error: result, status: response.status };
  }

  console.log(`✅ Patient registered successfully!`);
  console.log(`   Patient ID: ${result.id}`);
  console.log(`   Name: ${result.firstName} ${result.lastName}`);
  console.log(`   Phone: ${result.phone}`);
  console.log(`   DOB: ${result.dateOfBirth}`);
  console.log(`   Gender: ${result.gender}`);
  console.log(`   Organization ID: ${result.organizationId}\n`);
  return { success: true, patient: result };
}

async function getPatients() {
  console.log('📋 Fetching all patients...');
  const response = await fetch(`${BASE_URL}/api/patients`, {
    headers: { 'Cookie': authCookies },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }

  const patients = await response.json();
  console.log(`✅ Found ${patients.length} total patients\n`);
  return patients;
}

async function testPatientRegistration() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   PATIENT REGISTRATION TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Login
    await login();

    // Step 2: Test 1 - Register a patient with all required fields
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Register patient with required fields only');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const timestamp = Date.now();
    const testPatient1 = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-05-15',
      gender: 'male',
      phone: `+123456789${timestamp % 10000}` // Unique phone number
    };
    const result1 = await registerPatient(testPatient1);
    
    if (!result1.success) {
      console.log('❌ TEST 1 FAILED\n');
    } else {
      console.log('✅ TEST 1 PASSED\n');
    }

    // Step 3: Test 2 - Register a patient with all fields
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Register patient with all fields');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const testPatient2 = {
      title: 'Mrs.',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1985-08-20',
      gender: 'female',
      phone: `+198765432${timestamp % 10000}`,
      email: `jane.smith.${timestamp}@example.com`,
      address: '456 Oak Avenue, Springfield, IL 62701',
      allergies: 'Penicillin, Shellfish',
      medicalHistory: 'Hypertension, Type 2 Diabetes'
    };
    const result2 = await registerPatient(testPatient2);
    
    if (!result2.success) {
      console.log('❌ TEST 2 FAILED\n');
    } else {
      console.log('✅ TEST 2 PASSED\n');
    }

    // Step 4: Test 3 - Try to register duplicate phone number (should fail)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: Attempt duplicate phone number (should fail)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    let result3 = null;
    if (result1.success) {
      const duplicatePatient = {
        firstName: 'Duplicate',
        lastName: 'Test',
        dateOfBirth: '1995-01-01',
        gender: 'other',
        phone: result1.patient.phone // Use same phone as test 1
      };
      result3 = await registerPatient(duplicatePatient);
      
      if (result3.success) {
        console.log('❌ TEST 3 FAILED - Duplicate phone was accepted (should be rejected)\n');
      } else if (result3.status === 400 && result3.error?.message?.includes('phone')) {
        console.log('✅ TEST 3 PASSED - Duplicate phone correctly rejected\n');
      } else {
        console.log('⚠️  TEST 3 PARTIAL - Duplicate rejected but with unexpected error\n');
      }
    } else {
      console.log('⚠️  TEST 3 SKIPPED - Test 1 failed, cannot test duplicate\n');
    }

    // Step 5: Test 4 - Try to register with missing required fields (should fail)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: Attempt registration with missing required fields');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const incompletePatient = {
      firstName: 'Incomplete',
      lastName: 'Test',
      // Missing dateOfBirth, gender, phone
    };
    const result4 = await registerPatient(incompletePatient);
    
    if (result4.success) {
      console.log('❌ TEST 4 FAILED - Incomplete data was accepted (should be rejected)\n');
    } else if (result4.status === 400) {
      console.log('✅ TEST 4 PASSED - Incomplete data correctly rejected\n');
    } else {
      console.log('⚠️  TEST 4 PARTIAL - Incomplete data rejected but with unexpected status\n');
    }

    // Step 6: Verify patients were created
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 5: Verify patients in database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const allPatients = await getPatients();
    
    if (result1.success) {
      const found1 = allPatients.find(p => p.id === result1.patient.id);
      if (found1) {
        console.log(`✅ Patient 1 found in database: ${found1.firstName} ${found1.lastName}`);
      } else {
        console.log(`❌ Patient 1 NOT found in database`);
      }
    }
    
    if (result2.success) {
      const found2 = allPatients.find(p => p.id === result2.patient.id);
      if (found2) {
        console.log(`✅ Patient 2 found in database: ${found2.firstName} ${found2.lastName}`);
      } else {
        console.log(`❌ Patient 2 NOT found in database`);
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    const test3Passed = result3 ? (result1.success && !result3.success) : false;
    const passed = [
      result1.success ? '✅' : '❌',
      result2.success ? '✅' : '❌',
      test3Passed ? '✅' : (result3 ? '❌' : '⚠️'),
      !result4.success ? '✅' : '❌'
    ];
    console.log(`Test 1 (Required fields): ${passed[0]}`);
    console.log(`Test 2 (All fields): ${passed[1]}`);
    console.log(`Test 3 (Duplicate prevention): ${passed[2]}`);
    console.log(`Test 4 (Validation): ${passed[3]}`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ Patient registration tests completed!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testPatientRegistration()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

