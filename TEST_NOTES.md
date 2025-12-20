# Clinical Notes Testing Guide

## Overview

This guide explains how to test the Clinical Notes functionality in the patient profile. Notes are automatically created from patient visits and AI consultations.

## Test Script

The test script `test-notes.js` tests the following:

### 1. GET /api/patients/:id/clinical-notes
- **Purpose**: Retrieve all clinical notes for a patient
- **Tests**:
  - Fetches notes from AI consultations and visits
  - Categorizes notes by source
  - Analyzes SOAP format coverage
  - Displays sample notes

### 2. GET /api/ai-consultations/:id/clinical-notes
- **Purpose**: Get notes for a specific AI consultation
- **Tests**:
  - Retrieves consultation-specific notes
  - Validates note structure
  - Verifies note content

### 3. Notes Structure Analysis
- **Tests**:
  - Field presence and completeness
  - SOAP format coverage
  - Notes completeness scoring

### 4. Notes Sorting
- **Tests**:
  - Verifies notes are sorted by date (newest first)
  - Calculates date range
  - Validates chronological order

### 5. Notes Sources Analysis
- **Tests**:
  - Compares AI consultation notes vs visit notes
  - Analyzes completeness by source
  - Provides source statistics

### 6. Error Handling
- **Tests**:
  - Invalid patient ID (404 response)
  - Authentication requirements
  - Permission validation

## Usage

### Prerequisites

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Ensure you have test credentials**:
   - Default: `admin` / `admin123`
   - Or set environment variables:
     ```bash
     export TEST_USERNAME=your_username
     export TEST_PASSWORD=your_password
     ```

### Running the Tests

```bash
# Basic usage (uses first available patient)
node test-notes.js

# Test specific patient
node test-notes.js 1

# With custom API URL
API_URL=http://localhost:5000 node test-notes.js

# With custom credentials
TEST_USERNAME=admin TEST_PASSWORD=admin123 node test-notes.js 1

# All options
API_URL=http://localhost:5000 TEST_USERNAME=admin TEST_PASSWORD=admin123 node test-notes.js 1
```

## Expected Output

```
🧪 Clinical Notes API Test Suite
=================================
Base URL: http://localhost:5000
Test User: admin

🔐 Logging in...
✅ Login successful

👥 Test 1: Get patients list
GET /api/patients
✅ Success! Found 15 patients

   Sample patients:
   1. John Doe (ID: 1)
   2. Jane Smith (ID: 2)
   3. Bob Johnson (ID: 3)

📌 Using patient ID: 1 (John Doe)

📋 Test 2: Get clinical notes for patient 1
GET /api/patients/1/clinical-notes
✅ Success! Found 8 clinical notes

   Notes breakdown:
   - AI Consultation Notes: 3
   - Visit Notes: 5

   SOAP Format Coverage:
   - Subjective: 7 notes
   - Objective: 3 notes
   - Assessment: 8 notes
   - Plan: 6 notes

   Sample notes:
   1. [AI Consultation] 12/15/2024, 10:30:00 AM
      Chief Complaint: Patient reports chest pain for 2 days
      Diagnosis: Chest pain, rule out cardiac
      Subjective: Patient is a 45-year-old male presenting with...
      Assessment: Differential diagnoses include...
      Plan: ECG ordered, follow-up in 1 week

🔍 Test 3: Analyze notes structure
   Notes Structure Analysis:

   Field Presence:
   ✅ id: 8/8 (100.0%)
   ✅ consultationId: 8/8 (100.0%)
   ⚠️  subjective: 7/8 (87.5%)
   ⚠️  objective: 3/8 (37.5%)
   ✅ assessment: 8/8 (100.0%)
   ⚠️  plan: 6/8 (75.0%)
   ✅ chiefComplaint: 8/8 (100.0%)
   ✅ diagnosis: 8/8 (100.0%)
   ⚠️  recommendations: 2/8 (25.0%)
   ⚠️  followUpDate: 4/8 (50.0%)
   ✅ consultationDate: 8/8 (100.0%)
   ✅ createdAt: 8/8 (100.0%)

   Notes Completeness:
   - Complete SOAP notes: 3
   - Partial notes: 4
   - Minimal notes: 1

📅 Test 4: Test notes date sorting
   ✅ Notes are correctly sorted by date (newest first)

   Date Range:
   - Oldest note: 11/1/2024, 9:00:00 AM
   - Newest note: 12/15/2024, 10:30:00 AM
   - Time span: 44 days

📊 Test 5: Analyze notes sources
   Notes Sources:
   - AI Consultations: 3 (37.5%)
   - Patient Visits: 5 (62.5%)

   AI Notes Completeness: 3/3 complete SOAP notes
   Visit Notes Completeness: 5/5 have content

🤖 Test 7: Get AI consultation notes
GET /api/ai-consultations/123/clinical-notes
✅ Success! Retrieved consultation note
   Consultation ID: 123
   Note ID: 456
   Subjective: Patient is a 45-year-old male presenting with chest pain...
   Assessment: Differential diagnoses include cardiac causes...

⚠️  Test 6: Error handling
   Testing invalid patient ID...
   ✅ Correctly returns 404 for non-existent patient
   Testing authentication requirement...
   ✅ Correctly requires authentication

==================================================
✅ All tests completed!
==================================================

📊 Test Summary:
- Total Duration: 1.23s
- Tests Passed: 7
- Tests Failed: 0
- Tests Skipped: 0
- Total Notes: 8
- AI Consultation Notes: 3
- Visit Notes: 5
```

## API Endpoints Reference

### GET /api/patients/:id/clinical-notes
Returns all clinical notes for a patient (from AI consultations and visits).

**Response:**
```json
[
  {
    "id": 1,
    "consultationId": 123,
    "subjective": "Patient reports chest pain for 2 days",
    "objective": "BP: 140/90, HR: 88 bpm, Temp: 98.6°F",
    "assessment": "Chest pain, rule out cardiac",
    "plan": "ECG ordered, follow-up in 1 week",
    "chiefComplaint": "Chest pain",
    "diagnosis": "Chest pain, rule out cardiac",
    "recommendations": "Monitor symptoms, return if worsens",
    "followUpDate": "2024-12-22",
    "consultationDate": "2024-12-15T10:30:00Z",
    "createdAt": "2024-12-15T10:30:00Z",
    "updatedAt": "2024-12-15T10:30:00Z"
  }
]
```

### GET /api/ai-consultations/:id/clinical-notes
Returns clinical notes for a specific AI consultation.

**Response:**
```json
{
  "id": 1,
  "consultationId": 123,
  "subjective": "Patient's reported symptoms...",
  "objective": "Clinical findings...",
  "assessment": "Diagnosis...",
  "plan": "Treatment plan...",
  ...
}
```

## Notes Structure

### SOAP Format
- **S (Subjective)**: Patient's story, symptoms, chief complaint
- **O (Objective)**: Clinical findings, vital signs, test results
- **A (Assessment)**: Diagnosis, clinical assessment
- **P (Plan)**: Treatment plan, medications, follow-up

### Notes Sources

1. **AI Consultations**:
   - Comprehensive SOAP notes
   - May include differential diagnoses, ICD codes
   - Usually more complete

2. **Patient Visits**:
   - Converted from visit records
   - Includes: complaint, diagnosis, treatment
   - May be less structured

## Creating Test Notes

### Method 1: Record a Visit
```bash
# Via UI:
1. Open patient profile
2. Click "+" button
3. Select "Record Visit"
4. Fill in visit form
5. Save - notes are automatically created
```

### Method 2: AI Consultation
```bash
# Via UI:
1. Go to AI Consultations
2. Start new consultation
3. AI generates comprehensive notes
4. Notes appear in patient's Notes tab
```

## Troubleshooting

### No Notes Found
- **Solution**: Record a visit or start an AI consultation
- Notes are created automatically from these actions

### Notes Not Showing
- **Check**: Patient ID is correct
- **Check**: User has proper role (doctor, nurse, admin, pharmacist)
- **Check**: Patient belongs to user's organization

### Incomplete Notes
- **AI Consultations**: Usually generate complete SOAP notes
- **Visits**: Fill in all fields (complaint, diagnosis, treatment) for better notes

## Related Features

- **Visits Tab**: View all patient visits (source of visit notes)
- **AI Consultations**: Generate detailed clinical notes
- **Visit Recording**: Create notes through visit forms
- **Notes Tab**: View all notes in patient profile

## Summary

**To test Notes:**
1. ✅ Start the server
2. ✅ Run: `node test-notes.js [patientId]`
3. ✅ View test results and statistics
4. ✅ Notes are automatically created from visits and AI consultations

**Remember:** Notes are read-only in the Notes tab. To create notes, record a visit or start an AI consultation.

