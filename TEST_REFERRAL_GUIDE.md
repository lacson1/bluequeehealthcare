# Testing Referral Functionality from Patient Dashboard

## Quick Manual Test

### Prerequisites
1. Make sure the server is running (`npm run dev` or `npm start`)
2. Make sure you're logged in as a user with appropriate permissions (doctor, nurse, or admin)

### Steps to Test

1. **Navigate to Patient Profile**
   - Go to `/patients` page
   - Click on any patient to open their profile
   - Or navigate directly to `/patients/:id` (replace `:id` with a valid patient ID)

2. **Open Referrals Tab**
   - In the patient profile, click on the **"Referrals"** tab
   - You should see:
     - An "Add Referral" button at the top right
     - Either an empty state (if no referrals) or a list of existing referrals

3. **Create a Referral**
   - Click the **"Add Referral"** button
   - Fill in the form:
     - **Specialty** (required): Select from dropdown (e.g., Cardiology, Dermatology)
     - **Reason for Referral** (required): Enter a reason (e.g., "Patient requires cardiac evaluation")
     - **Urgency**: Select routine, urgent, or non-urgent
     - **Referred To Doctor** (optional): Enter doctor name
     - **Referred To Facility** (optional): Enter facility name
     - **Appointment Date** (optional): Select a date
     - **Notes** (optional): Add any additional notes
     - **Follow-up Required**: Check if needed
     - **Follow-up Date**: Select if follow-up is required
   - Click **"Create Referral"**

4. **Verify Success**
   - You should see a success toast notification
   - The dialog should close
   - The new referral should appear in the referrals list
   - The referral should show:
     - Specialty
     - Status (defaults to "pending")
     - Urgency badge
     - Referral date
     - Referring doctor information

5. **Test Edge Cases**
   - Try creating a referral without required fields (should show validation errors)
   - Try creating multiple referrals for the same patient
   - Try different urgency levels
   - Try with and without optional fields

## Automated Test Script

Run the automated test script:

```bash
# Make sure server is running on localhost:5001
node test-patient-referral.js

# Or specify a different base URL
BASE_URL=http://localhost:5001 node test-patient-referral.js
```

### What the Script Tests

1. ✅ Login authentication
2. ✅ Fetching patients list
3. ✅ Fetching existing referrals
4. ✅ Creating a referral with all fields
5. ✅ Creating a referral with minimal required fields
6. ✅ Verifying referral was created
7. ✅ Verifying referral appears in list

### Expected Output

```
🔐 Logging in...
✅ Login successful
📋 Fetching patients...
✅ Found X patients

👤 Using patient: John Doe (ID: 4)

📋 Fetching referrals for patient 4...
✅ Found 0 existing referrals
➕ Creating referral for patient 4...
   Data: {...}
✅ Referral created successfully!
   Referral ID: 1
   Specialty: Cardiology
   Status: pending
   Urgency: urgent

🔍 Verifying referral creation...
✅ Verification successful: Referral count increased by 1
✅ Referral found in list

🧪 Testing with minimal required fields...
✅ Minimal referral created successfully

============================================================
📊 TEST SUMMARY
============================================================
✅ Login: Successful
✅ Patient Fetch: Successful
✅ Referral Creation (Full): Successful
✅ Referral Creation (Minimal): Successful
✅ Referral Verification: Successful

🎉 All tests passed!
============================================================
```

## Troubleshooting

### "Patient not found" Error
- Make sure you're using a valid patient ID
- Check that the patient exists in the database
- Verify you have access to the patient's organization

### "Add Referral" Button Not Visible
- Make sure you're on the Referrals tab
- Check browser console for errors
- Verify the patient data has loaded (check other tabs work)

### Referral Creation Fails
- Check browser console for error messages
- Verify you're logged in with appropriate permissions
- Check server logs for backend errors
- Ensure required fields are filled (specialty and reason)

### API Errors
- Check server is running
- Verify authentication cookies are set
- Check network tab in browser DevTools
- Review server logs for detailed error messages

## API Endpoints Tested

- `GET /api/patients/:id/referrals` - Fetch patient referrals
- `POST /api/patients/:id/referrals` - Create new referral

## Required Fields

- `specialty` (string) - Medical specialty
- `reason` (string) - Reason for referral

## Optional Fields

- `referredToDoctor` (string)
- `referredToFacility` (string)
- `urgency` (enum: "routine" | "urgent" | "non-urgent") - Defaults to "routine"
- `appointmentDate` (date string)
- `notes` (string)
- `followUpRequired` (boolean) - Defaults to false
- `followUpDate` (date string)

## Status Values

Referrals default to `pending` status. Other possible statuses:
- `pending` - Initial status
- `scheduled` - Appointment scheduled
- `completed` - Referral completed
- `cancelled` - Referral cancelled

