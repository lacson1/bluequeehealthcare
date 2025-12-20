/**
 * Doctor Consultation Workflow Test Script
 * Simulates a doctor seeing a patient and recording a consultation
 * Run with: node test-doctor-consultation.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001/api';

// Test credentials (update these if needed)
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let cookies = [];
let currentUser = null;

// Helper function to extract cookies from response headers
function extractCookies(response) {
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    // Handle single cookie or multiple cookies
    const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    cookieStrings.forEach(cookieStr => {
      const cookieNameValue = cookieStr.split(';')[0].trim();
      if (cookieNameValue) {
        // Remove existing cookie with same name if present
        const cookieName = cookieNameValue.split('=')[0];
        cookies = cookies.filter(c => !c.startsWith(cookieName + '='));
        cookies.push(cookieNameValue);
      }
    });
  }
}

// Helper function to make API requests with session cookies
async function apiRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies.length > 0 && { 'Cookie': cookies.join('; ') })
    },
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(url, options);
    
    // Extract and store cookies for session-based auth
    extractCookies(response);
    
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

// ========== AUTHENTICATION ==========
async function login() {
  console.log('🔐 Logging in as doctor...');
  const result = await apiRequest('POST', '/auth/login', TEST_CREDENTIALS);
  
  if (result.ok && result.data?.data?.user) {
    // Handle wrapped response (sendSuccess format)
    currentUser = result.data.data.user;
    console.log(`✅ Login successful as ${currentUser?.username} (Role: ${currentUser?.role})`);
    console.log(`   User ID: ${currentUser?.id}, Organization ID: ${currentUser?.organizationId}`);
    console.log(`   Session cookies stored for subsequent requests\n`);
    return true;
  } else if (result.ok && result.data?.user) {
    // Handle direct user response
    currentUser = result.data.user;
    console.log(`✅ Login successful as ${currentUser?.username} (Role: ${currentUser?.role})`);
    console.log(`   User ID: ${currentUser?.id}, Organization ID: ${currentUser?.organizationId}`);
    console.log(`   Session cookies stored for subsequent requests\n`);
    return true;
  } else {
    console.error('❌ Login failed:', result.data);
    console.error(`   Status: ${result.status}`);
    return false;
  }
}

// ========== PATIENT MANAGEMENT ==========
async function getFirstPatient() {
  console.log('👤 Getting first available patient...');
  const result = await apiRequest('GET', '/patients?limit=1');
  
  if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
    const patient = result.data[0];
    console.log(`✅ Found patient: ${patient.firstName} ${patient.lastName}`);
    console.log(`   Patient ID: ${patient.id}`);
    console.log(`   DOB: ${patient.dateOfBirth || 'N/A'}`);
    console.log(`   Gender: ${patient.gender || 'N/A'}\n`);
    return patient;
  } else {
    console.error('❌ No patients found:', result.data);
    return null;
  }
}

async function getPatientVisits(patientId) {
  console.log(`📋 Getting visit history for patient ${patientId}...`);
  const result = await apiRequest('GET', `/patients/${patientId}/visits`);
  
  if (result.ok) {
    const visits = Array.isArray(result.data) ? result.data : [];
    console.log(`✅ Found ${visits.length} previous visit(s)`);
    if (visits.length > 0) {
      console.log(`   Most recent: ${visits[0].visitDate || 'N/A'}\n`);
    } else {
      console.log('   No previous visits\n');
    }
    return visits;
  } else {
    console.error('❌ Failed to get visits:', result.data);
    return [];
  }
}

// ========== CONSULTATION WORKFLOW ==========
async function recordConsultation(patientId) {
  console.log('🩺 Recording consultation...');
  console.log('   Simulating doctor consultation workflow...\n');

  // Step 1: Chief Complaint & History
  console.log('📝 Step 1: Chief Complaint & History');
  const chiefComplaint = "Persistent cough and chest pain for 5 days";
  const historyOfPresentIllness = "Patient reports onset of dry cough 5 days ago, progressively worsening. Associated with chest pain on deep inspiration. No fever. No shortness of breath at rest.";
  console.log(`   Chief Complaint: ${chiefComplaint}`);
  console.log(`   History: ${historyOfPresentIllness}\n`);

  // Step 2: Vital Signs
  console.log('❤️ Step 2: Vital Signs');
  const vitals = {
    bloodPressure: "120/80",
    heartRate: "88",
    temperature: "37.2",
    weight: "75",
    height: "175",
    respiratoryRate: "18",
    oxygenSaturation: "98"
  };
  console.log(`   BP: ${vitals.bloodPressure} mmHg`);
  console.log(`   HR: ${vitals.heartRate} bpm`);
  console.log(`   Temp: ${vitals.temperature}°C`);
  console.log(`   Weight: ${vitals.weight} kg, Height: ${vitals.height} cm`);
  console.log(`   RR: ${vitals.respiratoryRate}/min, SpO2: ${vitals.oxygenSaturation}%\n`);

  // Step 3: Physical Examination
  console.log('🔍 Step 3: Physical Examination');
  const examination = {
    generalAppearance: "Patient appears well, comfortable at rest",
    cardiovascularSystem: "Regular rhythm, no murmurs, no peripheral edema",
    respiratorySystem: "Mild expiratory wheeze bilaterally, no crepitations",
    gastrointestinalSystem: "Soft, non-tender abdomen, normal bowel sounds",
    neurologicalSystem: "Alert and oriented, cranial nerves intact",
    musculoskeletalSystem: "No joint swelling or tenderness"
  };
  console.log(`   General: ${examination.generalAppearance}`);
  console.log(`   CVS: ${examination.cardiovascularSystem}`);
  console.log(`   Respiratory: ${examination.respiratorySystem}\n`);

  // Step 4: Assessment & Diagnosis
  console.log('📋 Step 4: Assessment & Diagnosis');
  const diagnosis = "Acute Bronchitis";
  const secondaryDiagnoses = "Mild reactive airway disease";
  const assessment = "Patient presents with acute onset respiratory symptoms consistent with acute bronchitis. No signs of pneumonia. Vital signs stable.";
  const treatmentPlan = "1. Symptomatic treatment with cough suppressants\n2. Bronchodilator if needed\n3. Rest and hydration\n4. Follow-up if symptoms worsen";
  console.log(`   Primary Diagnosis: ${diagnosis}`);
  console.log(`   Secondary: ${secondaryDiagnoses}`);
  console.log(`   Assessment: ${assessment}`);
  console.log(`   Treatment Plan: ${treatmentPlan}\n`);

  // Step 5: Medications
  console.log('💊 Step 5: Medications');
  const medications = [
    "Dextromethorphan 15mg - 10ml TDS for 5 days",
    "Salbutamol inhaler 100mcg - 2 puffs PRN"
  ];
  console.log(`   Prescribed ${medications.length} medication(s):`);
  medications.forEach((med, idx) => {
    console.log(`   ${idx + 1}. ${med}`);
  });
  console.log('');

  // Step 6: Follow-up
  console.log('📅 Step 6: Follow-up');
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 7);
  const followUpDateStr = followUpDate.toISOString().split('T')[0];
  const followUpInstructions = "Return if symptoms worsen, fever develops, or difficulty breathing";
  console.log(`   Follow-up Date: ${followUpDateStr}`);
  console.log(`   Instructions: ${followUpInstructions}\n`);

  // Build visit data
  const visitData = {
    visitType: "consultation",
    chiefComplaint: chiefComplaint,
    historyOfPresentIllness: historyOfPresentIllness,
    bloodPressure: vitals.bloodPressure,
    heartRate: vitals.heartRate,
    temperature: vitals.temperature,
    weight: vitals.weight,
    height: vitals.height,
    respiratoryRate: vitals.respiratoryRate,
    oxygenSaturation: vitals.oxygenSaturation,
    generalAppearance: examination.generalAppearance,
    cardiovascularSystem: examination.cardiovascularSystem,
    respiratorySystem: examination.respiratorySystem,
    gastrointestinalSystem: examination.gastrointestinalSystem,
    neurologicalSystem: examination.neurologicalSystem,
    musculoskeletalSystem: examination.musculoskeletalSystem,
    assessment: assessment,
    diagnosis: diagnosis,
    secondaryDiagnoses: secondaryDiagnoses,
    treatmentPlan: treatmentPlan,
    medications: medications.join(", "),
    patientInstructions: "Rest, stay hydrated, avoid smoking and irritants",
    followUpDate: followUpDateStr,
    followUpInstructions: followUpInstructions,
    additionalNotes: "Patient advised on smoking cessation. Family history of asthma noted.",
    notes: JSON.stringify({
      historyOfPresentIllness: historyOfPresentIllness,
      vitalSigns: {
        respiratoryRate: vitals.respiratoryRate,
        oxygenSaturation: vitals.oxygenSaturation,
      },
      physicalExamination: {
        generalAppearance: examination.generalAppearance,
        cardiovascularSystem: examination.cardiovascularSystem,
        respiratorySystem: examination.respiratorySystem,
        gastrointestinalSystem: examination.gastrointestinalSystem,
        neurologicalSystem: examination.neurologicalSystem,
        musculoskeletalSystem: examination.musculoskeletalSystem,
      },
      assessment: assessment,
      secondaryDiagnoses: secondaryDiagnoses,
      medications: medications.join(", "),
      patientInstructions: "Rest, stay hydrated, avoid smoking and irritants",
      followUpDate: followUpDateStr,
      followUpInstructions: followUpInstructions,
      additionalNotes: "Patient advised on smoking cessation. Family history of asthma noted.",
    })
  };

  // Submit visit
  console.log('💾 Submitting consultation record...');
  const result = await apiRequest('POST', `/patients/${patientId}/visits`, visitData);
  
  if (result.ok) {
    console.log('✅ Consultation recorded successfully!');
    console.log(`   Visit ID: ${result.data.id}`);
    console.log(`   Visit Date: ${result.data.visitDate || new Date().toISOString().split('T')[0]}`);
    console.log(`   Status: ${result.data.status || 'completed'}\n`);
    return result.data;
  } else {
    console.error('❌ Failed to record consultation:', result.data);
    console.error(`   Status: ${result.status}`);
    if (result.data?.message) {
      console.error(`   Error: ${result.data.message}`);
    }
    if (result.data?.error) {
      console.error(`   Details: ${result.data.error}`);
    }
    return null;
  }
}

async function getVisitDetails(visitId) {
  console.log(`📄 Retrieving visit details for visit ${visitId}...`);
  // Note: This endpoint may vary - adjust based on your API
  const result = await apiRequest('GET', `/visits/${visitId}`);
  
  if (result.ok) {
    console.log('✅ Visit details retrieved:');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.log('⚠️  Could not retrieve visit details (endpoint may not exist)');
    console.log('');
    return null;
  }
}

// ========== APPOINTMENT WORKFLOW (Optional) ==========
async function getTodayAppointments() {
  console.log('📅 Checking today\'s appointments...');
  const today = new Date().toISOString().split('T')[0];
  const result = await apiRequest('GET', `/appointments?date=${today}`);
  
  if (result.ok) {
    const appointments = Array.isArray(result.data) ? result.data : [];
    console.log(`✅ Found ${appointments.length} appointment(s) for today`);
    if (appointments.length > 0) {
      appointments.forEach((apt, idx) => {
        console.log(`   ${idx + 1}. Patient ID: ${apt.patientId}, Time: ${apt.appointmentTime}, Status: ${apt.status}`);
      });
    }
    console.log('');
    return appointments;
  } else {
    console.log('⚠️  Could not retrieve appointments');
    console.log('');
    return [];
  }
}

async function startConsultationFromAppointment(appointmentId) {
  console.log(`🚀 Starting consultation from appointment ${appointmentId}...`);
  const result = await apiRequest('POST', `/appointments/${appointmentId}/start-consultation`);
  
  if (result.ok) {
    console.log('✅ Consultation started from appointment');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('');
    return result.data;
  } else {
    console.error('❌ Failed to start consultation:', result.data);
    return null;
  }
}

// ========== MAIN TEST RUNNER ==========
async function runDoctorConsultationTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   DOCTOR CONSULTATION WORKFLOW TEST');
  console.log('═══════════════════════════════════════════════════════\n');

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
      console.error('❌ Cannot proceed without authentication');
      process.exit(1);
    }

    // Step 2: Get a patient
    const patient = await getFirstPatient();
    if (!patient) {
      console.error('❌ Cannot proceed without a patient');
      process.exit(1);
    }

    // Step 3: Check patient's visit history
    await getPatientVisits(patient.id);

    // Step 4: Check today's appointments (optional)
    const appointments = await getTodayAppointments();
    
    // Step 5: If there's an appointment, start consultation from it
    if (appointments.length > 0 && appointments[0].status === 'scheduled') {
      console.log('📋 Found scheduled appointment, starting consultation...\n');
      await startConsultationFromAppointment(appointments[0].id);
    }

    // Step 6: Record a new consultation
    console.log('═══════════════════════════════════════════════════════');
    console.log('   RECORDING NEW CONSULTATION');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const visit = await recordConsultation(patient.id);
    
    if (visit) {
      // Step 7: Verify visit was created
      console.log('✅ Consultation workflow completed successfully!');
      console.log(`\n📊 Summary:`);
      console.log(`   Patient: ${patient.firstName} ${patient.lastName}`);
      console.log(`   Visit ID: ${visit.id}`);
      console.log(`   Diagnosis: ${visit.diagnosis || 'N/A'}`);
      console.log(`   Doctor: ${currentUser?.username || 'N/A'}`);
      console.log(`   Organization: ${currentUser?.organizationId || 'N/A'}\n`);
      
      // Step 8: Try to retrieve visit details
      if (visit.id) {
        await getVisitDetails(visit.id);
      }
    } else {
      console.error('❌ Consultation recording failed');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('   ✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runDoctorConsultationTest();

