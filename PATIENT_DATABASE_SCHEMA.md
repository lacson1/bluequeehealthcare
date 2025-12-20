# Patient Database Schema

## Table: `patients`

### Primary Key
- `id` - SERIAL PRIMARY KEY (auto-incrementing integer)

### Required Fields
- `first_name` - TEXT NOT NULL - Patient's first name
- `last_name` - TEXT NOT NULL - Patient's last name  
- `date_of_birth` - DATE NOT NULL - Date of birth
- `gender` - TEXT NOT NULL - Gender
- `phone` - TEXT NOT NULL - Phone number
- `created_at` - TIMESTAMP NOT NULL - Record creation timestamp

### Optional Personal Information
- `title` - VARCHAR(10) - Title (Mr., Mrs., Ms., Dr., Prof., etc.)
- `email` - TEXT - Email address
- `address` - TEXT - Physical address

### Nigeria-Specific Address (All Optional)
- `state` - VARCHAR(50) - Nigerian state (36 states + FCT)
- `lga` - VARCHAR(100) - Local Government Area
- `town` - VARCHAR(100) - Town or city
- `street_address` - VARCHAR(255) - Full street address
- `landmark` - VARCHAR(200) - Nearby landmark for easier location
- `postal_code` - VARCHAR(10) - Nigerian postal code

### Nigeria-Specific Identification (All Optional)
- `nin_number` - VARCHAR(11) - National Identification Number (11 digits)
- `bvn_number` - VARCHAR(11) - Bank Verification Number (11 digits)
- `secondary_phone` - VARCHAR(20) - Alternative phone number

### Medical Information
- `allergies` - TEXT - Known allergies
- `medical_history` - TEXT - Medical history
- `blood_type` - VARCHAR(5) - Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `code_status` - VARCHAR(20) DEFAULT 'full' - Code status for emergency care
  - Values: `full`, `dnr` (Do Not Resuscitate), `dni` (Do Not Intubate), `dnr_dni`, `comfort`

### Language & Accessibility
- `preferred_language` - VARCHAR(50) DEFAULT 'English' - Preferred language
- `interpreter_needed` - BOOLEAN DEFAULT false - Interpreter required

### Care Provider
- `primary_care_provider_id` - INTEGER - Reference to `users.id` (Primary Care Provider)

### Emergency Contact
- `emergency_contact_name` - VARCHAR(100) - Emergency contact name
- `emergency_contact_phone` - VARCHAR(20) - Emergency contact phone number
- `emergency_contact_relationship` - VARCHAR(50) - Relationship to patient

### Identification
- `national_id` - VARCHAR(50) - National ID number
- `insurance_id` - VARCHAR(50) - Insurance ID number

### Organization
- `organization_id` - INTEGER - Reference to `organizations.id` (Multi-tenant support)

## Schema Definition (from shared/schema.ts)

```typescript
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 10 }), // Mr., Mrs., Ms., Dr., Prof., etc.
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  // Industry-standard patient identification fields
  bloodType: varchar("blood_type", { length: 5 }), // A+, A-, B+, B-, AB+, AB-, O+, O-
  preferredLanguage: varchar("preferred_language", { length: 50 }).default('English'),
  interpreterNeeded: boolean("interpreter_needed").default(false),
  // Primary Care Provider
  primaryCareProviderId: integer("primary_care_provider_id").references(() => users.id),
  // Emergency Contact Information
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 50 }),
  // Code Status (for inpatient/acute settings)
  codeStatus: varchar("code_status", { length: 20 }).default('full'), // full, dnr, dni, dnr_dni, comfort
  // Additional identifiers
  nationalId: varchar("national_id", { length: 50 }),
  insuranceId: varchar("insurance_id", { length: 50 }),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Patient Insurance Table: NHIS-Specific Fields (All Optional)

The `patient_insurance` table includes these Nigeria-specific NHIS fields:

| Field | Type | Description |
|-------|------|-------------|
| `is_nhis` | BOOLEAN | Flag indicating NHIS policy |
| `nhis_enrollee_id` | VARCHAR(20) | NHIS Enrollee ID (format: XXX-XXXXXXX) |
| `nhis_category` | VARCHAR(30) | Category: formal_sector, informal_sector, vulnerable_groups, armed_forces, students |
| `hmo_provider` | VARCHAR(100) | HMO managing the NHIS (e.g., Hygeia, Leadway, Reliance) |
| `primary_healthcare_facility` | VARCHAR(200) | Registered primary healthcare facility |
| `principal_member_name` | VARCHAR(100) | Principal member name (if patient is a dependant) |
| `relationship_to_principal` | VARCHAR(20) | Relationship: self, spouse, child, dependant |
| `employer_name` | VARCHAR(100) | Employer name for formal sector NHIS |
| `employer_nhis_code` | VARCHAR(20) | Employer NHIS registration code |
| `dependants_count` | INTEGER | Number of dependants covered |

## Related Tables

The `patients` table has relationships with:

- **visits** - Patient visits/consultations
- **labResults** - Laboratory test results
- **prescriptions** - Medication prescriptions
- **referrals** - Patient referrals to specialists
- **appointments** - Scheduled appointments
- **comments** - Clinical notes/comments
- **consultationRecords** - Consultation records
- **pharmacyActivities** - Pharmacy interactions
- **medicationReviews** - Medication review records
- **vaccinations** - Vaccination records
- **allergies** - Allergy records (separate table)
- **medicalHistory** - Medical history records (separate table)
- **dischargeLetters** - Discharge letters
- **messages** - Patient messages
- **labOrders** - Lab test orders
- **medicalDocuments** - Medical documents
- **proceduralReports** - Procedural reports
- **patientConsents** - Consent forms
- **patientInsurance** - Insurance information
- **patientReferrals** - Referral records
- **safetyAlerts** - Safety alerts
- **invoices** - Billing invoices
- **payments** - Payment records
- **insuranceClaims** - Insurance claims
- **telemedicineSessions** - Telemedicine sessions
- **aiConsultations** - AI consultation records
- **vitalSigns** - Vital signs measurements

## Indexes

- Primary key index on `id`
- Index on `primary_care_provider_id` (for PCP lookups)
- Index on `organization_id` (for multi-tenant queries)

## Field Descriptions

### Code Status Values
- `full` - Full code (resuscitate and intubate)
- `dnr` - Do Not Resuscitate
- `dni` - Do Not Intubate
- `dnr_dni` - Do Not Resuscitate and Do Not Intubate
- `comfort` - Comfort care only

### Blood Type Values
- `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`

## Usage Example

```typescript
import { patients } from '@shared/schema';

// Insert a new patient
const newPatient = await db.insert(patients).values({
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-15',
  gender: 'Male',
  phone: '+234-123-456-7890',
  email: 'john.doe@example.com',
  organizationId: 1
}).returning();

// Query patients
const allPatients = await db.select().from(patients);
```

## Notes

- The table supports multi-tenant architecture via `organization_id`
- Industry-standard fields align with EHR/EMR best practices (Epic, Cerner, Athenahealth standards)
- Emergency contact and code status fields are critical for acute care settings
- Language and interpreter fields support accessibility requirements

