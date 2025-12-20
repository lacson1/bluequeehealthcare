# How to Use Notes in Patient Profile

## Overview

The **Notes** tab in the patient profile displays clinical notes in SOAP format (Subjective, Objective, Assessment, Plan). Notes are automatically created from two sources:

1. **AI Consultations** - Clinical notes from AI-assisted consultations
2. **Visits** - Clinical notes converted from recorded patient visits

## Accessing Notes

### Step 1: Navigate to Patient Profile
1. Go to the **Patients** page
2. Click on a patient's name or profile
3. You'll see the patient profile page

### Step 2: Open the Notes Tab
1. Look for the tab navigation at the top of the patient profile
2. Click on the **"Notes"** tab (with a BookOpen icon)
3. The Notes tab will display all clinical notes for that patient

## Understanding Notes Format

Clinical notes are displayed in **SOAP format**:

### S - Subjective
- Patient's story in their own words
- Chief complaint
- History of present illness
- Patient-reported symptoms

### O - Objective
- Physical examination findings
- Vital signs
- Observable clinical data
- Test results

### A - Assessment
- Diagnosis or differential diagnoses
- Clinical assessment
- Problem identification

### P - Plan
- Treatment plan
- Medications prescribed
- Follow-up instructions
- Recommendations

## How Notes Are Created

### Method 1: Recording a Visit
When you record a patient visit, it automatically creates clinical notes:

1. **Click the "+" button** (Floating Action Menu) on the patient profile
2. Select **"Record Visit"**
3. Fill in the visit form:
   - **Chief Complaint** → Becomes "Subjective" in notes
   - **Diagnosis** → Becomes "Assessment" in notes
   - **Treatment Plan** → Becomes "Plan" in notes
   - **Additional Notes** → Included in notes
4. **Save the visit** - Notes are automatically created

### Method 2: AI Consultations
AI consultations automatically generate detailed clinical notes:

1. Navigate to **AI Consultations** page
2. Start a new consultation for the patient
3. The AI generates comprehensive SOAP notes
4. Notes appear in the patient's Notes tab

## Viewing Notes

### Notes Display
- Each note is shown as a **card** with:
  - Date of consultation/visit
  - SOAP sections (Subjective, Objective, Assessment, Plan)
  - Additional information (chief complaint, diagnosis, recommendations)
  - Follow-up date (if applicable)

### Notes Information
Each note card shows:
- **Date**: When the note was created
- **Subjective**: Patient's reported symptoms
- **Objective**: Clinical findings
- **Assessment**: Diagnosis
- **Plan**: Treatment plan
- **Chief Complaint**: Main reason for visit
- **Diagnosis**: Medical diagnosis
- **Recommendations**: Clinical recommendations
- **Follow-up Instructions**: Next steps for patient
- **Follow-up Date**: When to return

## Notes Sources

### From Visits
- Visit notes are converted to clinical note format
- Includes: complaint, diagnosis, treatment
- Automatically linked to the visit date

### From AI Consultations
- Comprehensive SOAP notes
- May include:
  - Differential diagnoses
  - ICD codes
  - Suggested lab tests
  - Clinical warnings
  - Confidence scores

## Tips for Using Notes

### 1. Recording Visits Creates Notes
- Always record visits to maintain clinical notes
- The more detailed your visit recording, the better the notes

### 2. Notes Are Read-Only
- Notes are automatically generated
- You cannot directly edit notes in the Notes tab
- To update notes, record a new visit or consultation

### 3. Notes Are Chronological
- Notes are sorted by date (most recent first)
- Each note shows the date it was created

### 4. Notes Include Full Context
- Notes capture the complete clinical picture
- Include all relevant information when recording visits

## Example Workflow

### Creating Notes Through a Visit:

1. **Open Patient Profile** → Click on patient name
2. **Click "+" button** → Select "Record Visit"
3. **Fill Visit Form**:
   ```
   Chief Complaint: "Patient reports chest pain for 2 days"
   Diagnosis: "Chest pain, rule out cardiac"
   Treatment Plan: "ECG ordered, follow-up in 1 week"
   Additional Notes: "Patient advised to rest"
   ```
4. **Save Visit** → Notes automatically created
5. **View Notes** → Go to Notes tab to see the new note

## Notes Tab Features

### Empty State
- If no notes exist, you'll see:
  - "No Notes" message
  - Description: "No clinical notes available for this patient"
  - Suggestion to record a visit

### Loading State
- Shows skeleton loaders while fetching notes
- Notes load automatically when tab is opened

### Note Cards
- Each note is a clickable card
- Hover effect for better UX
- Organized by date (newest first)

## API Endpoint

Notes are fetched from:
```
GET /api/patients/:id/clinical-notes
```

This endpoint returns:
- AI consultation notes (from `clinical_notes` table)
- Visit notes (converted from `visits` table)
- Combined and sorted by date

## Permissions

To view notes, you need:
- Role: `doctor`, `nurse`, `admin`, or `pharmacist`
- Access to the patient's organization
- Authenticated session

## Troubleshooting

### No Notes Showing?
1. **Check if visits were recorded** - Notes come from visits
2. **Verify patient ID** - Make sure you're viewing the correct patient
3. **Check permissions** - Ensure you have the right role
4. **Refresh the page** - Notes may need to reload

### Notes Not Updating?
1. **Record a new visit** - This creates new notes
2. **Check visit form** - Make sure all fields are filled
3. **Verify API connection** - Check browser console for errors

### Missing Information in Notes?
1. **Fill all visit fields** - More details = better notes
2. **Use AI consultations** - They generate comprehensive notes
3. **Add additional notes** - Use the "Additional Notes" field in visits

## Related Features

- **Visits Tab**: View all patient visits
- **Consultation History**: See AI consultation notes
- **Visit Recording**: Create new notes through visits
- **AI Consultations**: Generate detailed clinical notes

## Summary

**To use Notes:**
1. ✅ Navigate to patient profile
2. ✅ Click the "Notes" tab
3. ✅ View all clinical notes in SOAP format
4. ✅ Create notes by recording visits or AI consultations
5. ✅ Notes are automatically generated and organized by date

**Remember:** Notes are read-only in the Notes tab. To create or update notes, record a new visit or start an AI consultation.

