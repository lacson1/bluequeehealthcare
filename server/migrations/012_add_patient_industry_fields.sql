-- Migration: Add industry-standard patient identification fields
-- These fields align with EHR/EMR best practices (Epic, Cerner, Athenahealth standards)

-- Add blood type field
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5);

-- Add language and interpreter fields
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50) DEFAULT 'English';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS interpreter_needed BOOLEAN DEFAULT false;

-- Add Primary Care Provider reference
ALTER TABLE patients ADD COLUMN IF NOT EXISTS primary_care_provider_id INTEGER REFERENCES users(id);

-- Add Emergency Contact fields
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(50);

-- Add Code Status (DNR/DNI) - critical for acute care settings
-- Values: 'full', 'dnr', 'dni', 'dnr_dni', 'comfort'
ALTER TABLE patients ADD COLUMN IF NOT EXISTS code_status VARCHAR(20) DEFAULT 'full';

-- Add additional identifiers
ALTER TABLE patients ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_id VARCHAR(50);

-- Create index for PCP lookups
CREATE INDEX IF NOT EXISTS idx_patients_pcp ON patients(primary_care_provider_id);

-- Add comments for documentation
COMMENT ON COLUMN patients.blood_type IS 'Patient blood type: A+, A-, B+, B-, AB+, AB-, O+, O-';
COMMENT ON COLUMN patients.code_status IS 'Code status for emergency care: full, dnr (Do Not Resuscitate), dni (Do Not Intubate), dnr_dni, comfort';
COMMENT ON COLUMN patients.primary_care_provider_id IS 'Reference to the assigned primary care provider (doctor)';

