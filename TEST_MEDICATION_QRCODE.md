# Medication QR Code Testing Guide

This guide explains how to test the medication QR code generation functionality.

## Test Files Created

1. **`test-medication-qrcode.html`** - Interactive browser-based test page
2. **`test-medication-qrcode-integration.mjs`** - Node.js integration test script
3. **`test-qr-code.js`** - Simple command-line test (existing)

## Quick Test Methods

### Method 1: Browser Test Page (Recommended)

1. Open `test-medication-qrcode.html` in your browser
2. Fill in or modify the test data (medication and patient information)
3. Click the test buttons:
   - **Generate QR Text** - Shows the text that will be encoded in the QR code
   - **Generate QR Code Image** - Displays the actual QR code image
   - **Generate QR JSON Data** - Shows the JSON structure
   - **Download QR JSON** - Downloads the JSON file
   - **Test All Functions** - Runs all tests at once

4. Verify:
   - QR text contains all medication and patient information
   - QR code image is generated and visible
   - QR code can be scanned with a QR scanner app
   - JSON data is valid and complete

### Method 2: Integration Test Script

Run the Node.js integration test:

```bash
node test-medication-qrcode-integration.mjs
```

This will:
- Test QR text generation
- Test QR code URL generation
- Test QR JSON data generation
- Test minimal data handling
- Provide a detailed test report

### Method 3: In-App Testing

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Navigate to a patient** with prescriptions:
   - Go to the patient list
   - Select a patient with active medications

3. **Generate QR Code**:
   - Open the Medications tab
   - Find a prescription in the list
   - Click the menu (three dots) on the prescription
   - Click "Generate QR Code"

4. **Verify**:
   - A new window opens with the QR code
   - The QR code includes organization letterhead (if available)
   - The QR code displays medication information
   - The QR code can be scanned

5. **Scan the QR Code**:
   - Use a QR scanner app on your phone
   - Verify the scanned data matches the prescription
   - Check that all medication details are present

## What to Test

### ✅ Core Functionality

- [ ] QR code text generation with all medication details
- [ ] QR code image generation and display
- [ ] QR code JSON data structure
- [ ] QR code scanning and data verification
- [ ] Organization letterhead inclusion (when available)
- [ ] Fallback behavior when organization is missing

### ✅ Data Validation

- [ ] All medication fields are included (name, dosage, frequency, duration, instructions)
- [ ] Patient information is correct (name, phone, DOB, ID)
- [ ] Prescription ID is included
- [ ] Prescriber information is included
- [ ] Dates are formatted correctly
- [ ] Default values are used when fields are missing

### ✅ Edge Cases

- [ ] Minimal data (only medication name)
- [ ] Missing patient information
- [ ] Missing organization data
- [ ] Special characters in medication names
- [ ] Long medication instructions
- [ ] Multiple prescriptions

### ✅ User Experience

- [ ] QR code opens in new window
- [ ] Print dialog appears (if autoPrint is enabled)
- [ ] Toast notifications are shown
- [ ] Error messages are clear and helpful
- [ ] Loading states are appropriate

## QR Code Scanner Apps

To verify QR codes work correctly, use one of these:

- **iOS**: Built-in Camera app
- **Android**: Google Lens or QR Code Reader
- **Online**: https://www.qr-code-generator.com/qr-code-scanner/
- **Desktop**: ZXing Decoder Online

## Expected QR Code Content

When scanned, the QR code should contain:

```
PRESCRIPTION FOR DISPENSING

RX NUMBER: RX-12345
PATIENT: Jane Smith
DOB: 1990-05-15
PHONE: +2348012345678

MEDICATION: Paracetamol 500mg
STRENGTH: 500mg
FREQUENCY: Twice daily
DURATION: 7 days
INSTRUCTIONS: Take with food after meals

PRESCRIBER: Dr. John Doe
DATE ISSUED: [current date]

Generated: [timestamp]
This is a valid prescription for dispensing at any licensed pharmacy.
```

## Troubleshooting

### QR Code Not Generating

1. Check browser console for errors
2. Verify organization data is available (if required)
3. Check network connection (QR code API requires internet)
4. Verify prescription data is complete

### QR Code Not Scanning

1. Ensure QR code image is clear and not pixelated
2. Check that QR code contains valid data
3. Try different QR scanner apps
4. Verify the QR code URL is accessible

### Organization Letterhead Missing

1. Check if user has `organizationId` assigned
2. Verify organization data can be fetched from API
3. Check browser console for organization fetch errors
4. The QR code should still work without letterhead (uses default)

## Test Results

After running tests, you should see:

- ✅ All QR text generation tests pass
- ✅ QR code URL is valid and accessible
- ✅ QR JSON data is valid
- ✅ QR code can be scanned successfully
- ✅ All medication and patient data is present

## Next Steps

1. Run the integration test: `node test-medication-qrcode-integration.mjs`
2. Open the HTML test page in browser
3. Test in the actual application
4. Scan QR codes with a mobile device
5. Verify data integrity

## Notes

- QR codes are generated using the public API: `https://api.qrserver.com/v1/create-qr-code/`
- QR codes include all prescription data in a human-readable format
- QR codes can be printed and scanned by pharmacies
- Organization letterhead is optional but recommended for professional appearance

