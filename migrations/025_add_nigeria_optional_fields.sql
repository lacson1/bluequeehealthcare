-- Migration: Add Nigeria-specific optional fields
-- All fields are optional to maintain backward compatibility

-- =====================================================
-- PATIENTS TABLE: Nigerian Address & Identification
-- =====================================================

-- Nigerian Address Structure (all optional)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS lga VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS town VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS landmark VARCHAR(200);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- Nigerian National Identification (all optional)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS nin_number VARCHAR(11);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bvn_number VARCHAR(11);

-- Secondary phone (common in Nigeria)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(20);

-- Add indexes for Nigerian fields (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_patients_state ON patients(state);
CREATE INDEX IF NOT EXISTS idx_patients_lga ON patients(lga);
CREATE INDEX IF NOT EXISTS idx_patients_nin ON patients(nin_number);
CREATE INDEX IF NOT EXISTS idx_patients_bvn ON patients(bvn_number);

-- Add comments for documentation
COMMENT ON COLUMN patients.state IS 'Nigerian state (36 states + FCT)';
COMMENT ON COLUMN patients.lga IS 'Local Government Area within the state';
COMMENT ON COLUMN patients.town IS 'Town or city name';
COMMENT ON COLUMN patients.street_address IS 'Full street address';
COMMENT ON COLUMN patients.landmark IS 'Nearby landmark for easier location';
COMMENT ON COLUMN patients.postal_code IS 'Nigerian postal code';
COMMENT ON COLUMN patients.nin_number IS 'National Identification Number (11 digits)';
COMMENT ON COLUMN patients.bvn_number IS 'Bank Verification Number (11 digits)';
COMMENT ON COLUMN patients.secondary_phone IS 'Secondary phone number';

-- =====================================================
-- PATIENT_INSURANCE TABLE: NHIS-Specific Fields
-- =====================================================

-- NHIS Flag
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS is_nhis BOOLEAN DEFAULT false;

-- NHIS Enrollee Information
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS nhis_enrollee_id VARCHAR(20);
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS nhis_category VARCHAR(30);
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS hmo_provider VARCHAR(100);
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS primary_healthcare_facility VARCHAR(200);

-- Principal Member (for dependants)
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS principal_member_name VARCHAR(100);
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS relationship_to_principal VARCHAR(20);

-- Employer Information (for formal sector NHIS)
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS employer_name VARCHAR(100);
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS employer_nhis_code VARCHAR(20);

-- Dependants
ALTER TABLE patient_insurance ADD COLUMN IF NOT EXISTS dependants_count INTEGER;

-- Add indexes for NHIS fields
CREATE INDEX IF NOT EXISTS idx_insurance_nhis ON patient_insurance(is_nhis);
CREATE INDEX IF NOT EXISTS idx_insurance_nhis_enrollee ON patient_insurance(nhis_enrollee_id);
CREATE INDEX IF NOT EXISTS idx_insurance_hmo ON patient_insurance(hmo_provider);

-- Add comments for documentation
COMMENT ON COLUMN patient_insurance.is_nhis IS 'Flag indicating if this is an NHIS policy';
COMMENT ON COLUMN patient_insurance.nhis_enrollee_id IS 'NHIS Enrollee ID (format: XXX-XXXXXXX)';
COMMENT ON COLUMN patient_insurance.nhis_category IS 'NHIS category: formal_sector, informal_sector, vulnerable_groups, armed_forces, students';
COMMENT ON COLUMN patient_insurance.hmo_provider IS 'HMO managing the NHIS (e.g., Hygeia, Leadway, Reliance)';
COMMENT ON COLUMN patient_insurance.primary_healthcare_facility IS 'Registered primary healthcare facility';
COMMENT ON COLUMN patient_insurance.principal_member_name IS 'Principal member name (if patient is a dependant)';
COMMENT ON COLUMN patient_insurance.relationship_to_principal IS 'Relationship: self, spouse, child, dependant';
COMMENT ON COLUMN patient_insurance.employer_name IS 'Employer name for formal sector NHIS';
COMMENT ON COLUMN patient_insurance.employer_nhis_code IS 'Employer NHIS registration code';
COMMENT ON COLUMN patient_insurance.dependants_count IS 'Number of dependants covered under this policy';

