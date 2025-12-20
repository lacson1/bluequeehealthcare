#!/usr/bin/env node

/**
 * Integration Test for Medication QR Code Generation
 * 
 * This script tests the QR code generation functionality by:
 * 1. Testing QR text generation
 * 2. Testing QR code URL generation
 * 3. Testing QR JSON data generation
 * 4. Validating data integrity
 * 
 * Run with: node test-medication-qrcode-integration.mjs
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test data
const testMedication = {
  name: 'Paracetamol 500mg',
  dosage: '500mg',
  frequency: 'Twice daily',
  duration: '7 days',
  instructions: 'Take with food after meals',
  prescribedBy: 'Dr. John Doe',
  startDate: new Date().toISOString(),
  prescriptionId: 12345
};

const testPatient = {
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+2348012345678',
  dateOfBirth: '1990-05-15',
  id: 1,
  title: 'Mrs.'
};

// Simulate the QR text generation function
function generateMedicationQRText(medication, patient) {
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : 'Patient';

  const patientPhone = patient?.phone || '';
  const patientDOB = patient?.dateOfBirth || '';

  return `PRESCRIPTION FOR DISPENSING

RX NUMBER: ${medication.prescriptionId ? `RX-${medication.prescriptionId}` : `RX-${Date.now()}`}
PATIENT: ${patientName}
${patientDOB ? `DOB: ${patientDOB}` : ''}
${patientPhone ? `PHONE: ${patientPhone}` : ''}

MEDICATION: ${medication.name}
STRENGTH: ${medication.dosage || 'As prescribed'}
FREQUENCY: ${medication.frequency || 'As directed'}
DURATION: ${medication.duration || 'As needed'}
INSTRUCTIONS: ${medication.instructions || 'Take as directed'}

${medication.prescribedBy ? `PRESCRIBER: ${medication.prescribedBy}` : ''}
DATE ISSUED: ${new Date(medication.startDate).toLocaleDateString()}
${medication.endDate ? `EXPIRES: ${new Date(medication.endDate).toLocaleDateString()}` : ''}

Generated: ${new Date().toLocaleString()}
This is a valid prescription for dispensing at any licensed pharmacy.`;
}

// Simulate the QR JSON data generation function
function generateMedicationQRData(medication, patient) {
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : 'Patient';

  const qrData = {
    type: 'MEDICATION_PRESCRIPTION',
    prescriptionId: medication.prescriptionId || null,
    medication: {
      name: medication.name,
      dosage: medication.dosage || 'As prescribed',
      frequency: medication.frequency || 'As directed',
      duration: medication.duration || 'As needed',
      instructions: medication.instructions || 'Take as directed',
    },
    patient: patient && patient.id
      ? {
          name: patientName,
          id: patient.id,
          phone: patient.phone || 'Not provided',
          dateOfBirth: patient.dateOfBirth || 'Not provided',
        }
      : { name: patientName },
    prescriber: medication.prescribedBy
      ? { name: medication.prescribedBy }
      : null,
    dates: {
      startDate: medication.startDate || new Date().toISOString(),
      endDate: medication.endDate || null,
    },
    generatedAt: new Date().toISOString(),
  };

  return JSON.stringify(qrData, null, 2);
}

// Test functions
function testQRTextGeneration() {
  console.log('\n🧪 Test 1: QR Text Generation');
  console.log('─'.repeat(50));
  
  const qrText = generateMedicationQRText(testMedication, testPatient);
  
  const tests = [
    { name: 'Contains prescription header', test: qrText.includes('PRESCRIPTION FOR DISPENSING') },
    { name: 'Contains RX number', test: qrText.includes('RX-12345') },
    { name: 'Contains patient name', test: qrText.includes('Jane Smith') },
    { name: 'Contains medication name', test: qrText.includes('Paracetamol 500mg') },
    { name: 'Contains dosage', test: qrText.includes('500mg') },
    { name: 'Contains frequency', test: qrText.includes('Twice daily') },
    { name: 'Contains duration', test: qrText.includes('7 days') },
    { name: 'Contains instructions', test: qrText.includes('Take with food') },
    { name: 'Contains prescriber', test: qrText.includes('Dr. John Doe') },
    { name: 'Contains patient phone', test: qrText.includes('+2348012345678') },
    { name: 'Contains patient DOB', test: qrText.includes('1990-05-15') },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ name, test }) => {
    if (test) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  console.log(`  QR Text Length: ${qrText.length} characters`);
  
  return { passed, failed, qrText };
}

function testQRCodeURLGeneration() {
  console.log('\n🧪 Test 2: QR Code URL Generation');
  console.log('─'.repeat(50));
  
  const qrText = generateMedicationQRText(testMedication, testPatient);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
  
  const tests = [
    { name: 'URL is valid', test: qrCodeUrl.startsWith('https://') },
    { name: 'Contains API endpoint', test: qrCodeUrl.includes('api.qrserver.com') },
    { name: 'Contains size parameter', test: qrCodeUrl.includes('size=300x300') },
    { name: 'Contains encoded data', test: qrCodeUrl.includes('data=') },
    { name: 'URL length is reasonable', test: qrCodeUrl.length < 2000 },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ name, test }) => {
    if (test) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  console.log(`  QR Code URL: ${qrCodeUrl.substring(0, 100)}...`);
  
  return { passed, failed, qrCodeUrl };
}

function testQRJSONGeneration() {
  console.log('\n🧪 Test 3: QR JSON Data Generation');
  console.log('─'.repeat(50));
  
  const qrJSON = generateMedicationQRData(testMedication, testPatient);
  let qrData;
  
  try {
    qrData = JSON.parse(qrJSON);
  } catch (error) {
    console.log(`  ❌ Invalid JSON: ${error.message}`);
    return { passed: 0, failed: 1, qrData: null };
  }
  
  const tests = [
    { name: 'Valid JSON format', test: qrData !== null },
    { name: 'Contains type field', test: qrData.type === 'MEDICATION_PRESCRIPTION' },
    { name: 'Contains prescription ID', test: qrData.prescriptionId === 12345 },
    { name: 'Contains medication object', test: qrData.medication !== undefined },
    { name: 'Medication name matches', test: qrData.medication.name === 'Paracetamol 500mg' },
    { name: 'Contains patient object', test: qrData.patient !== undefined },
    { name: 'Patient name matches', test: qrData.patient.name === 'Jane Smith' },
    { name: 'Patient ID matches', test: qrData.patient.id === 1 },
    { name: 'Contains prescriber', test: qrData.prescriber !== null },
    { name: 'Prescriber name matches', test: qrData.prescriber.name === 'Dr. John Doe' },
    { name: 'Contains dates object', test: qrData.dates !== undefined },
    { name: 'Contains generatedAt timestamp', test: qrData.generatedAt !== undefined },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ name, test }) => {
    if (test) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  console.log(`  JSON Length: ${qrJSON.length} characters`);
  
  return { passed, failed, qrData };
}

function testMinimalData() {
  console.log('\n🧪 Test 4: Minimal Data Handling');
  console.log('─'.repeat(50));
  
  const minimalMedication = {
    name: 'Aspirin',
    prescriptionId: 999
  };
  
  const qrText = generateMedicationQRText(minimalMedication);
  const qrJSON = generateMedicationQRData(minimalMedication);
  
  const tests = [
    { name: 'QR text generated with minimal data', test: qrText.includes('Aspirin') },
    { name: 'QR text contains defaults', test: qrText.includes('As prescribed') },
    { name: 'QR JSON generated with minimal data', test: qrJSON.includes('Aspirin') },
    { name: 'QR JSON is valid', test: JSON.parse(qrJSON) !== null },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ name, test }) => {
    if (test) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);
  
  return { passed, failed };
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Medication QR Code Generation - Integration Tests');
  console.log('═══════════════════════════════════════════════════════════');
  
  const results = {
    qrText: testQRTextGeneration(),
    qrUrl: testQRCodeURLGeneration(),
    qrJSON: testQRJSONGeneration(),
    minimal: testMinimalData(),
  };
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════════');
  
  const totalPassed = 
    results.qrText.passed +
    results.qrUrl.passed +
    results.qrJSON.passed +
    results.minimal.passed;
  
  const totalFailed = 
    results.qrText.failed +
    results.qrUrl.failed +
    results.qrJSON.failed +
    results.minimal.failed;
  
  console.log(`\n  Total Tests: ${totalPassed + totalFailed}`);
  console.log(`  ✅ Passed: ${totalPassed}`);
  console.log(`  ❌ Failed: ${totalFailed}`);
  console.log(`  Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  if (totalFailed === 0) {
    console.log('\n  🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n  ⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

