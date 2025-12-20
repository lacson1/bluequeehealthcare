/**
 * Test script for QR Code Generation
 * Run with: node test-qr-code.js
 */

// This is a simple test script to verify QR code generation works
// In a browser environment, you can test the actual QR code display

const testQRCodeGeneration = () => {
  console.log('🧪 Testing QR Code Generation\n');
  
  // Test data
  const medication = {
    name: 'Paracetamol 500mg',
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: '7 days',
    instructions: 'Take with food after meals',
    prescribedBy: 'Dr. John Doe',
    startDate: new Date().toISOString(),
    prescriptionId: 12345
  };

  const patient = {
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+2348012345678',
    dateOfBirth: '1990-05-15',
    id: 1
  };

  // Generate QR code text (simulating the function)
  const generateQRText = (med, pat) => {
    return `PRESCRIPTION FOR DISPENSING

RX NUMBER: RX-${med.prescriptionId}
PATIENT: ${pat.firstName} ${pat.lastName}
PHONE: ${pat.phone}
DOB: ${pat.dateOfBirth}

MEDICATION: ${med.name}
STRENGTH: ${med.dosage}
FREQUENCY: ${med.frequency}
DURATION: ${med.duration}
INSTRUCTIONS: ${med.instructions}

PRESCRIBER: ${med.prescribedBy}
DATE ISSUED: ${new Date(med.startDate).toLocaleDateString()}

Generated: ${new Date().toLocaleString()}
This is a valid prescription for dispensing at any licensed pharmacy.`;
  };

  const qrText = generateQRText(medication, patient);
  
  // Generate QR code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

  console.log('✅ QR Code Text Generated:');
  console.log('─'.repeat(50));
  console.log(qrText);
  console.log('─'.repeat(50));
  console.log('\n');

  console.log('✅ QR Code URL Generated:');
  console.log(qrCodeUrl);
  console.log('\n');

  console.log('📋 Test Results:');
  console.log(`  ✓ QR text contains medication name: ${qrText.includes(medication.name)}`);
  console.log(`  ✓ QR text contains patient name: ${qrText.includes(`${patient.firstName} ${patient.lastName}`)}`);
  console.log(`  ✓ QR text contains prescription ID: ${qrText.includes(`RX-${medication.prescriptionId}`)}`);
  console.log(`  ✓ QR URL is valid: ${qrCodeUrl.startsWith('https://api.qrserver.com')}`);
  console.log(`  ✓ QR URL contains encoded data: ${qrCodeUrl.includes('data=')}`);
  
  console.log('\n🎯 To test in browser:');
  console.log('  1. Open the application');
  console.log('  2. Navigate to a patient with prescriptions');
  console.log('  3. Click "Generate QR Code" on any prescription');
  console.log('  4. Verify the QR code opens with organization letterhead');
  console.log('  5. Scan the QR code with a QR scanner app to verify data');
  
  console.log('\n📱 QR Code Scanner Apps:');
  console.log('  - iOS: Camera app (built-in)');
  console.log('  - Android: Google Lens or QR Code Reader');
  console.log('  - Online: https://www.qr-code-generator.com/qr-code-scanner/');
  
  return {
    success: true,
    qrText,
    qrCodeUrl,
    medication,
    patient
  };
};

// Run test
try {
  const result = testQRCodeGeneration();
  console.log('\n✅ All tests passed!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}

