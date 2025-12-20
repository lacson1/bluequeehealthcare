# Guide: Removing Patients from Database

## ⚠️ Important Warning

**Deleting patients is a permanent action!** Patients have many related records (visits, prescriptions, lab results, etc.). Make sure you understand the implications before deleting.

## Methods to Remove Patients

### Method 1: Using the Script (Recommended)

I've created a script `remove-patients.js` that safely handles patient deletion.

#### List All Patients
```bash
node remove-patients.js --list
```

#### Preview What Will Be Deleted (Dry Run)
```bash
# Preview deletion for a single patient
node remove-patients.js --dry-run 1

# Preview deletion for multiple patients
node remove-patients.js --dry-run 1 2 3
```

#### Delete a Single Patient
```bash
# Delete patient with ID 1 (will fail if patient has related records)
node remove-patients.js 1

# Delete patient with ID 1 and ALL related records (cascade delete)
node remove-patients.js --cascade 1
```

#### Delete Multiple Patients
```bash
# Delete multiple patients (will fail if any have related records)
node remove-patients.js 1 2 3

# Delete multiple patients with cascade
node remove-patients.js --cascade 1 2 3
```

### Method 2: Direct SQL (Advanced)

If you prefer to use SQL directly:

#### Check Related Records First
```sql
-- See what related records exist for a patient
SELECT 
  'visits' as table_name, COUNT(*) as count 
FROM visits 
WHERE patient_id = 1
UNION ALL
SELECT 'lab_results', COUNT(*) FROM lab_results WHERE patient_id = 1
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions WHERE patient_id = 1
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments WHERE patient_id = 1;
-- ... add more tables as needed
```

#### Delete Patient (Without Related Records)
```sql
-- This will fail if there are foreign key constraints
DELETE FROM patients WHERE id = 1;
```

#### Delete Patient with All Related Records (Cascade)
```sql
BEGIN;

-- Delete related records first
DELETE FROM visits WHERE patient_id = 1;
DELETE FROM lab_results WHERE patient_id = 1;
DELETE FROM prescriptions WHERE patient_id = 1;
DELETE FROM patient_referrals WHERE patient_id = 1;
DELETE FROM appointments WHERE patient_id = 1;
-- ... delete from all related tables

-- Then delete the patient
DELETE FROM patients WHERE id = 1;

COMMIT;
```

### Method 3: Via API (If Endpoint Exists)

Currently, there's no DELETE endpoint for patients in the API. You would need to add one or use the script/SQL methods above.

## Related Tables

When you delete a patient, these related tables may have records that reference the patient:

- `visits` - Patient visits/consultations
- `lab_results` - Laboratory test results
- `prescriptions` - Medication prescriptions
- `patient_referrals` - Referrals to specialists
- `appointments` - Scheduled appointments
- `comments` - Clinical notes
- `consultation_records` - Consultation records
- `pharmacy_activities` - Pharmacy interactions
- `medication_reviews` - Medication reviews
- `vaccinations` - Vaccination records
- `patient_allergies` - Allergy records
- `patient_medical_history` - Medical history
- `discharge_letters` - Discharge letters
- `messages` - Patient messages
- `lab_orders` - Lab test orders
- `medical_documents` - Medical documents
- `patient_procedures` - Procedures
- `patient_consents` - Consent forms
- `patient_insurance` - Insurance information
- `safety_alerts` - Safety alerts
- `invoices` - Billing invoices
- `payments` - Payment records
- `insurance_claims` - Insurance claims
- `telemedicine_sessions` - Telemedicine sessions
- `ai_consultations` - AI consultations
- `vital_signs` - Vital signs measurements
- `patient_imaging` - Imaging records

## Best Practices

1. **Always preview first**: Use `--dry-run` to see what will be deleted
2. **Backup first**: Consider backing up your database before bulk deletions
3. **Use cascade carefully**: Only use `--cascade` when you're absolutely sure you want to delete all related records
4. **Test on a single patient**: Test the deletion process on one patient before deleting multiple
5. **Consider archiving**: Instead of deleting, consider implementing an archive/soft-delete feature

## Example Workflow

```bash
# 1. List all patients to find the ones you want to delete
node remove-patients.js --list

# 2. Preview what will be deleted for patient ID 5
node remove-patients.js --dry-run 5

# 3. If patient has no related records, delete normally
node remove-patients.js 5

# 4. If patient has related records and you want to delete everything
node remove-patients.js --cascade 5
```

## Troubleshooting

### Error: "Cannot delete patients with related records"
- The patient has related records (visits, prescriptions, etc.)
- Use `--cascade` flag to delete patient and all related records
- Or manually delete related records first

### Error: "Patient not found"
- The patient ID doesn't exist
- Use `--list` to see all available patient IDs

### Error: "Foreign key constraint violation"
- There are foreign key constraints preventing deletion
- Use cascade delete or delete related records first

## Safety Features

The script includes:
- ✅ Preview mode (`--dry-run`) to see what will be deleted
- ✅ Confirmation prompt before deletion
- ✅ Transaction support (rollback on error)
- ✅ Related records count display
- ✅ Multiple patient deletion support

