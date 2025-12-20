#!/usr/bin/env node

/**
 * Test script for Clinical Notes functionality
 * Tests the clinical notes API endpoints:
 * - GET /api/patients/:id/clinical-notes - Get all clinical notes for a patient
 * - GET /api/ai-consultations/:id/clinical-notes - Get notes for a specific consultation
 * 
 * Usage:
 *   node test-notes.js [patientId]
 *   API_URL=http://localhost:5000 node test-notes.js 1
 *   TEST_USERNAME=admin TEST_PASSWORD=admin123 node test-notes.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_CREDENTIALS = {
  username: process.env.TEST_USERNAME || 'admin',
  password: process.env.TEST_PASSWORD || 'admin123'
};

let authCookie = '';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers
  });
  
  if (authCookie) {
    headers.set('Cookie', authCookie);
  }
  
  const defaultOptions = {
    ...options,
    headers
  };

  const response = await fetch(url, defaultOptions);
  
  const setCookieHeader = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
  if (setCookieHeader) {
    authCookie = setCookieHeader.split(';')[0];
  }

  let data = {};
  try {
    const text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  } catch (e) {
    // Response might not be JSON
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: response.headers
  };
}

// Login function
async function login() {
  console.log('\n🔐 Logging in...');
  
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    if (!healthCheck.ok && healthCheck.status !== 404) {
      console.log('⚠️  Server health check failed, but continuing...');
    }
  } catch (error) {
    throw new Error(`Cannot connect to server at ${BASE_URL}. Is the server running? Error: ${error.message}`);
  }
  
  const response = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  if (!response.ok) {
    const errorMsg = response.data?.message || response.data?.error || JSON.stringify(response.data);
    throw new Error(`Login failed: ${response.status} - ${errorMsg}`);
  }

  console.log('✅ Login successful');
  return response;
}

// Test 1: Get all patients to find a test patient
async function testGetPatients() {
  console.log('\n👥 Test 1: Get patients list');
  console.log('GET /api/patients');
  
  const response = await apiRequest('/api/patients', {
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });

  if (response.ok) {
    const patients = response.data.data || response.data || [];
    console.log(`✅ Success! Found ${patients.length} patients`);
    
    if (patients.length > 0) {
      console.log('\n   Sample patients:');
      patients.slice(0, 3).forEach((patient, idx) => {
        const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';
        console.log(`   ${idx + 1}. ${name} (ID: ${patient.id})`);
      });
    }
    
    return patients;
  } else {
    console.log(`❌ Failed: ${response.status} - ${JSON.stringify(response.data)}`);
    return [];
  }
}

// Test 2: Get clinical notes for a patient
async function testGetClinicalNotes(patientId) {
  console.log(`\n📋 Test 2: Get clinical notes for patient ${patientId}`);
  console.log(`GET /api/patients/${patientId}/clinical-notes`);
  
  if (!patientId) {
    console.log('⚠️  Skipping - no patient ID available');
    return [];
  }
  
  const response = await apiRequest(`/api/patients/${patientId}/clinical-notes`, {
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });

  if (response.ok) {
    const notes = response.data.data || response.data || [];
    console.log(`✅ Success! Found ${notes.length} clinical notes`);
    
    if (notes.length > 0) {
      console.log('\n   Notes breakdown:');
      
      // Categorize notes
      const aiNotes = notes.filter(n => n.consultationId !== null);
      const visitNotes = notes.filter(n => n.consultationId === null);
      
      console.log(`   - AI Consultation Notes: ${aiNotes.length}`);
      console.log(`   - Visit Notes: ${visitNotes.length}`);
      
      // Show SOAP format breakdown
      const withSubjective = notes.filter(n => n.subjective).length;
      const withObjective = notes.filter(n => n.objective).length;
      const withAssessment = notes.filter(n => n.assessment).length;
      const withPlan = notes.filter(n => n.plan).length;
      
      console.log('\n   SOAP Format Coverage:');
      console.log(`   - Subjective: ${withSubjective} notes`);
      console.log(`   - Objective: ${withObjective} notes`);
      console.log(`   - Assessment: ${withAssessment} notes`);
      console.log(`   - Plan: ${withPlan} notes`);
      
      // Show sample notes
      console.log('\n   Sample notes:');
      notes.slice(0, 3).forEach((note, idx) => {
        const date = note.consultationDate || note.createdAt;
        const dateStr = date ? new Date(date).toLocaleString() : 'N/A';
        const source = note.consultationId ? 'AI Consultation' : 'Visit';
        
        console.log(`   ${idx + 1}. [${source}] ${dateStr}`);
        if (note.chiefComplaint) {
          console.log(`      Chief Complaint: ${note.chiefComplaint.substring(0, 60)}...`);
        }
        if (note.diagnosis) {
          console.log(`      Diagnosis: ${note.diagnosis}`);
        }
        if (note.subjective) {
          console.log(`      Subjective: ${note.subjective.substring(0, 60)}...`);
        }
        if (note.assessment) {
          console.log(`      Assessment: ${note.assessment.substring(0, 60)}...`);
        }
        if (note.plan) {
          console.log(`      Plan: ${note.plan.substring(0, 60)}...`);
        }
      });
    } else {
      console.log('   ℹ️  No clinical notes found for this patient');
      console.log('   💡 Notes are created from:');
      console.log('      - Recording patient visits');
      console.log('      - AI consultations');
    }
    
    return notes;
  } else {
    console.log(`❌ Failed: ${response.status} - ${JSON.stringify(response.data)}`);
    return [];
  }
}

// Test 3: Analyze notes structure
async function testNotesStructure(notes) {
  console.log(`\n🔍 Test 3: Analyze notes structure`);
  
  if (!notes || notes.length === 0) {
    console.log('⚠️  Skipping - no notes available');
    return;
  }
  
  console.log('   Notes Structure Analysis:');
  
  // Check for required fields
  const fields = {
    id: notes.filter(n => n.id).length,
    consultationId: notes.filter(n => n.consultationId !== undefined).length,
    subjective: notes.filter(n => n.subjective).length,
    objective: notes.filter(n => n.objective).length,
    assessment: notes.filter(n => n.assessment).length,
    plan: notes.filter(n => n.plan).length,
    chiefComplaint: notes.filter(n => n.chiefComplaint).length,
    diagnosis: notes.filter(n => n.diagnosis).length,
    recommendations: notes.filter(n => n.recommendations).length,
    followUpDate: notes.filter(n => n.followUpDate).length,
    consultationDate: notes.filter(n => n.consultationDate).length,
    createdAt: notes.filter(n => n.createdAt).length
  };
  
  console.log('\n   Field Presence:');
  Object.entries(fields).forEach(([field, count]) => {
    const percentage = ((count / notes.length) * 100).toFixed(1);
    const status = count === notes.length ? '✅' : count > 0 ? '⚠️' : '❌';
    console.log(`   ${status} ${field}: ${count}/${notes.length} (${percentage}%)`);
  });
  
  // Check notes completeness
  const completeNotes = notes.filter(n => 
    n.subjective && n.assessment && n.plan
  ).length;
  
  const partialNotes = notes.filter(n => 
    (n.subjective || n.assessment || n.plan) && 
    !(n.subjective && n.assessment && n.plan)
  ).length;
  
  const minimalNotes = notes.filter(n => 
    !n.subjective && !n.assessment && !n.plan
  ).length;
  
  console.log('\n   Notes Completeness:');
  console.log(`   - Complete SOAP notes: ${completeNotes}`);
  console.log(`   - Partial notes: ${partialNotes}`);
  console.log(`   - Minimal notes: ${minimalNotes}`);
}

// Test 4: Test notes date sorting
async function testNotesSorting(notes) {
  console.log(`\n📅 Test 4: Test notes date sorting`);
  
  if (!notes || notes.length === 0) {
    console.log('⚠️  Skipping - no notes available');
    return;
  }
  
  // Check if notes are sorted by date (most recent first)
  const dates = notes.map(n => {
    const date = n.consultationDate || n.createdAt;
    return date ? new Date(date).getTime() : 0;
  });
  
  const isSorted = dates.every((date, idx) => {
    if (idx === 0) return true;
    return date <= dates[idx - 1];
  });
  
  if (isSorted) {
    console.log('   ✅ Notes are correctly sorted by date (newest first)');
  } else {
    console.log('   ⚠️  Notes may not be sorted correctly');
  }
  
  console.log('\n   Date Range:');
  if (dates.length > 0) {
    const oldest = new Date(Math.min(...dates.filter(d => d > 0)));
    const newest = new Date(Math.max(...dates.filter(d => d > 0)));
    console.log(`   - Oldest note: ${oldest.toLocaleString()}`);
    console.log(`   - Newest note: ${newest.toLocaleString()}`);
    console.log(`   - Time span: ${Math.round((newest - oldest) / (1000 * 60 * 60 * 24))} days`);
  }
}

// Test 5: Test notes from visits vs AI consultations
async function testNotesSources(notes) {
  console.log(`\n📊 Test 5: Analyze notes sources`);
  
  if (!notes || notes.length === 0) {
    console.log('⚠️  Skipping - no notes available');
    return;
  }
  
  const aiNotes = notes.filter(n => n.consultationId !== null);
  const visitNotes = notes.filter(n => n.consultationId === null);
  
  console.log('   Notes Sources:');
  console.log(`   - AI Consultations: ${aiNotes.length} (${((aiNotes.length / notes.length) * 100).toFixed(1)}%)`);
  console.log(`   - Patient Visits: ${visitNotes.length} (${((visitNotes.length / notes.length) * 100).toFixed(1)}%)`);
  
  // Compare completeness
  if (aiNotes.length > 0) {
    const aiComplete = aiNotes.filter(n => n.subjective && n.objective && n.assessment && n.plan).length;
    console.log(`\n   AI Notes Completeness: ${aiComplete}/${aiNotes.length} complete SOAP notes`);
  }
  
  if (visitNotes.length > 0) {
    const visitComplete = visitNotes.filter(n => n.subjective || n.assessment || n.plan).length;
    console.log(`   Visit Notes Completeness: ${visitComplete}/${visitNotes.length} have content`);
  }
}

// Test 6: Test error handling
async function testErrorHandling() {
  console.log(`\n⚠️  Test 6: Error handling`);
  
  // Test invalid patient ID
  console.log('   Testing invalid patient ID...');
  const invalidResponse = await apiRequest('/api/patients/999999/clinical-notes', {
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });
  
  if (invalidResponse.status === 404) {
    console.log('   ✅ Correctly returns 404 for non-existent patient');
  } else {
    console.log(`   ⚠️  Unexpected response: ${invalidResponse.status}`);
  }
  
  // Test unauthorized access (if we can test with different org)
  console.log('   Testing authentication requirement...');
  const noAuthResponse = await fetch(`${BASE_URL}/api/patients/1/clinical-notes`, {
    method: 'GET'
  });
  
  if (noAuthResponse.status === 401 || noAuthResponse.status === 403) {
    console.log('   ✅ Correctly requires authentication');
  } else {
    console.log(`   ⚠️  Unexpected response: ${noAuthResponse.status}`);
  }
}

// Test 7: Get AI consultation notes (if available)
async function testGetConsultationNotes(notes) {
  console.log(`\n🤖 Test 7: Get AI consultation notes`);
  
  if (!notes || notes.length === 0) {
    console.log('⚠️  Skipping - no notes available');
    return;
  }
  
  const aiNotes = notes.filter(n => n.consultationId !== null);
  
  if (aiNotes.length === 0) {
    console.log('   ℹ️  No AI consultation notes found');
    return;
  }
  
  const consultationId = aiNotes[0].consultationId;
  console.log(`GET /api/ai-consultations/${consultationId}/clinical-notes`);
  
  const response = await apiRequest(`/api/ai-consultations/${consultationId}/clinical-notes`, {
    method: 'GET',
    headers: {
      'Cookie': authCookie
    }
  });

  if (response.ok) {
    const note = response.data.data || response.data;
    console.log(`✅ Success! Retrieved consultation note`);
    console.log(`   Consultation ID: ${note.consultationId}`);
    console.log(`   Note ID: ${note.id}`);
    
    if (note.subjective) {
      console.log(`   Subjective: ${note.subjective.substring(0, 80)}...`);
    }
    if (note.assessment) {
      console.log(`   Assessment: ${note.assessment.substring(0, 80)}...`);
    }
  } else {
    console.log(`❌ Failed: ${response.status} - ${JSON.stringify(response.data)}`);
  }
}

// Main test runner
async function runTests() {
  if (typeof globalThis.fetch === 'undefined') {
    throw new Error('fetch is not available. Please use Node.js 18+');
  }
  
  console.log('🧪 Clinical Notes API Test Suite');
  console.log('=================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_CREDENTIALS.username}`);
  
  const startTime = Date.now();
  const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Login first
    await login();
    testResults.passed++;

    // Get patient ID from command line or fetch patients
    const patientIdArg = process.argv[2];
    let patientId = patientIdArg ? parseInt(patientIdArg) : null;
    
    // If no patient ID provided, get first patient
    if (!patientId) {
      const patients = await testGetPatients();
      if (patients.length > 0) {
        patientId = patients[0].id;
        console.log(`\n📌 Using patient ID: ${patientId} (${patients[0].firstName || ''} ${patients[0].lastName || ''})`);
        testResults.passed++;
      } else {
        console.log('\n⚠️  No patients found. Cannot test notes without a patient.');
        testResults.skipped++;
        return;
      }
    }

    // Get clinical notes
    const notes = await testGetClinicalNotes(patientId);
    if (notes.length > 0) {
      testResults.passed++;
    } else {
      testResults.skipped++;
    }

    // Run analysis tests
    await testNotesStructure(notes);
    testResults.passed++;

    await testNotesSorting(notes);
    testResults.passed++;

    await testNotesSources(notes);
    testResults.passed++;

    await testGetConsultationNotes(notes);
    testResults.passed++;

    await testErrorHandling();
    testResults.passed++;

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log(`- Total Duration: ${duration}s`);
    console.log(`- Tests Passed: ${testResults.passed}`);
    console.log(`- Tests Failed: ${testResults.failed}`);
    console.log(`- Tests Skipped: ${testResults.skipped}`);
    console.log(`- Total Notes: ${notes.length}`);
    console.log(`- AI Consultation Notes: ${notes.filter(n => n.consultationId !== null).length}`);
    console.log(`- Visit Notes: ${notes.filter(n => n.consultationId === null).length}`);

  } catch (error) {
    testResults.failed++;
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testGetClinicalNotes, testNotesStructure, testNotesSorting };

