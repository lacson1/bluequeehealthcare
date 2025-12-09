# Prescription Manual Medication Entry Fix

## Problem
Users couldn't create prescriptions with manually entered medication names. The error was:

```
500: {"message":"Failed to create prescription","error":"insert or update on table \"prescriptions\" violates foreign key constraint \"prescriptions_medication_id_medicines_id_fk\""}
```

## Root Cause
The `prescriptions` table had a **non-nullable** foreign key constraint on `medication_id` that referenced the `medicines` table. When users manually entered a medication name (not selecting from the database), the frontend correctly sent `medicationId: null`, but the database rejected it because:

1. The foreign key constraint required `medication_id` to either:
   - Be a valid ID from the `medicines` table, OR
   - Be NULL (but the column wasn't nullable)

2. The schema didn't allow `medication_id` to be NULL

## The Fix

### 1. Schema Update
Updated `/shared/schema.ts` to clarify that:
- `medicationId` is **optional** (nullable) - allows manual entries
- `medicationName` is **required** (not null) - stores either DB name or manual entry

```typescript
export const prescriptions = pgTable("prescriptions", {
  // ... other fields
  medicationId: integer("medication_id").references(() => medicines.id), // Optional
  medicationName: text("medication_name").notNull(), // Required
  // ... other fields
});
```

### 2. Database Migration
Created migration `006_fix_prescription_medication_nullable.sql`:

```sql
-- Make medication_id nullable
ALTER TABLE prescriptions 
  ALTER COLUMN medication_id DROP NOT NULL;

-- Make medication_name not null
UPDATE prescriptions 
  SET medication_name = COALESCE(medication_name, '')
  WHERE medication_name IS NULL;

ALTER TABLE prescriptions 
  ALTER COLUMN medication_name SET NOT NULL;
```

## How It Works Now

### Case 1: Medicine from Database
```json
{
  "medicationId": 123,           // Valid FK to medicines table
  "medicationName": "Paracetamol" // Name from medicines table
}
```

### Case 2: Manual Entry
```json
{
  "medicationId": null,                    // No FK reference
  "medicationName": "Custom Aspirin 500mg" // Manually entered name
}
```

## Testing Results

✅ **Manual Medication Entry**
```bash
POST /api/patients/1/prescriptions
{
  "medicationId": null,
  "medicationName": "Custom Aspirin 500mg",
  ...
}
# Result: Success - prescription created with id=2
```

✅ **Prescription Retrieval**
```bash
GET /api/patients/1/prescriptions
# Returns: Prescription with medicationId=null and medicationName="Custom Aspirin 500mg"
```

## Files Modified
1. `/shared/schema.ts` - Updated prescriptions schema
2. `/server/migrations/006_fix_prescription_medication_nullable.sql` - Database migration
3. Database columns verified:
   - `medication_id`: NOW nullable (is_nullable = YES)
   - `medication_name`: NOW not null (is_nullable = NO)

## Design Rationale

This design supports both workflows:

1. **Structured Data** - When medication exists in the medicines database, link via FK
2. **Flexibility** - When medication isn't in database, allow manual entry

This is common in healthcare systems where:
- Standard medications use the formulary (`medicines` table)
- Custom/compound medications are entered manually
- External prescriptions are recorded as-is

## Frontend Flow
The frontend (`prescription-modal.tsx`) already handles this correctly:

```typescript
const prescriptionData: InsertPrescription = {
  ...data,
  patientId: selectedPatientId,
  medicationId: selectedMedicine?.id || null, // null for manual entries
  medicationName: selectedMedicine?.name || manualMedicationName || "",
};
```

The fix was purely on the backend schema/database side.

