# Referrals Functionality Analysis

## Overview

The referrals system in ClinicConnect enables healthcare providers to refer patients to specialists, other facilities, or specific doctors. The system follows international standards for medical terminology, data formats, and clinical documentation.

## Core Functionality

### 1. Database Schema

The system uses two referral-related tables:

#### `referrals` Table (Legacy/Simple)
```typescript
- id: Primary key
- patientId: Reference to patients
- fromUserId: Reference to referring user
- toRole: Target role (e.g., 'doctor', 'nurse', 'pharmacist')
- reason: Reason for referral (varchar 255)
- date: Referral date
- status: Status (pending, accepted, rejected, completed)
```

#### `patientReferrals` Table (Enhanced/Modern)
```typescript
- id: Primary key
- patientId: Reference to patients (required)
- referringDoctorId: Reference to referring doctor (required)
- referredToDoctor: Doctor name (optional, varchar 200)
- referredToFacility: Facility name (optional, varchar 200)
- specialty: Medical specialty (varchar 100)
- reason: Reason for referral (text, required)
- urgency: Urgency level (urgent, routine, non-urgent) - defaults to 'routine'
- status: Status (pending, scheduled, completed, cancelled) - defaults to 'pending'
- referralDate: Date of referral (defaults to now)
- appointmentDate: Optional appointment date
- notes: Additional notes (text)
- followUpRequired: Boolean flag
- followUpDate: Optional follow-up date
- organizationId: Organization context
- createdAt/updatedAt: Timestamps
```

### 2. API Endpoints

#### Patient-Specific Referrals (Primary Implementation)
- `GET /api/patients/:id/referrals` - Fetch all referrals for a patient
- `POST /api/patients/:id/referrals` - Create new referral for a patient
- `PATCH /api/patients/:id/referrals/:referralId` - Update referral
- `DELETE /api/patients/:id/referrals/:referralId` - Delete referral

#### General Referrals (Legacy/Alternative)
- `GET /api/referrals` - Get all referrals (with filters: toRole, fromUserId, status, patientId)
- `POST /api/referrals` - Create referral
- `GET /api/referrals/:id` - Get referral by ID
- `PATCH /api/referrals/:id` - Update referral status
- `DELETE /api/referrals/:id` - Delete referral (admin only)

### 3. Access Control

**Who can create referrals:**
- Doctors
- Nurses
- Administrators

**Who can update referral status:**
- Pharmacists
- Physiotherapists
- Doctors
- Administrators

**Organization Context:**
- All referrals are scoped to the user's organization
- Cross-organization access is restricted

## International Standards Implementation

### 1. Medical Terminology Standards

**Location:** `client/src/lib/i18n.ts`

The system follows **ISO 639-1 language codes** for internationalization:
- English (en)
- French (fr)
- Spanish (es)

Referrals are translated as:
- English: "Referrals"
- French: "Orientation"
- Spanish: "Referencias"

The i18n system follows international standards for medical terminology, ensuring consistent translation across languages.

### 2. Date/Time Standards

**Location:** `client/src/lib/date-utils.ts`

The system follows **ISO 8601 standards** for:
- Data storage: All dates stored in ISO 8601 format
- Display: Dates formatted according to user's locale
- Medical records: ISO-like format for clinical documentation

### 3. Clinical Documentation Standards

**Location:** `client/src/components/modern-patient-overview.tsx`

The system implements **ICD-10** (International Classification of Diseases, 10th Revision) for:
- Diagnosis coding
- Billing compliance
- Clinical documentation

Features:
- ICD-10 code search and selection
- Quick-select common ICD-10 codes
- Secondary diagnosis support with ICD-10 codes

### 4. Industry Standards Compliance

The system implements several industry-standard requirements:

1. **Patient Safety Banner** - Industry standard requirement
2. **Review of Systems (ROS)** - Industry standard requirement
3. **Social & Family History** - Industry standard requirement
4. **Assessment & Diagnosis** - Enhanced with ICD-10 search
5. **Drug-drug interaction & allergy checking** - Industry standard
6. **Visit Time Tracking** - Industry standard for billing
7. **Provider Attestation** - Industry standard

## Integration Across Application

### 1. Patient Profile Integration

**Location:** `client/src/components/patient-tabs/dynamic-tab-registry.tsx`

Referrals are integrated as a **system tab** in the patient profile:

```typescript
referrals: {
  key: 'referrals',
  defaultLabel: 'tab.referrals',
  icon: Users,
  render: ({ patient }) => <ReferralsTab patient={patient} />,
}
```

**Features:**
- Accessible from patient profile tabs
- Integrated with patient context
- Uses internationalized labels
- Part of dynamic tab system

### 2. Navigation Integration

**Location:** `client/src/App.tsx`

Routes:
- `/referrals` - Standalone referrals management page
- `/referral-letters` - Referral letter generation page
- Patient profile with `?tab=referrals` - Direct access to referrals tab

**Location:** `client/src/components/patient-dropdown-menu.tsx`

Quick actions:
- "Create Referral" menu item in patient dropdown
- Direct navigation to referrals page with patient context

### 3. Component Integration

#### ReferralsTab Component
**Location:** `client/src/components/patient-tabs/referrals-tab.tsx`

**Features:**
- Create new referrals
- View existing referrals
- Display referral details (specialty, urgency, status, dates)
- Show referring doctor information
- Empty state handling
- Form validation with Zod schema

**Specialties Supported:**
- Cardiology
- Dermatology
- Endocrinology
- Gastroenterology
- Neurology
- Oncology
- Orthopedics
- Pediatrics
- Psychiatry
- Radiology
- Surgery
- Urology
- Other

#### ReferralManagement Component
**Location:** `client/src/components/referral-management.tsx`

**Features:**
- Full CRUD operations (Create, Read, Update, Delete)
- Nigerian healthcare context (facilities and specialties)
- Urgency and status management
- Follow-up tracking
- Rich UI with badges and icons

**Nigerian Healthcare Facilities:**
- Lagos University Teaching Hospital (LUTH)
- University College Hospital (UCH), Ibadan
- Obafemi Awolowo University Teaching Hospital, Ile-Ife
- And 12+ other major facilities

#### ReferralModal Component
**Location:** `client/src/components/referral-modal.tsx`

Modal dialog for creating referrals from various contexts.

### 4. Referral Letters Integration

**Location:** `client/src/pages/referral-letters.tsx`

**Features:**
- Generate professional referral letters
- Save as patient documents
- Print/export functionality
- Organization letterhead support
- Clinical history integration
- Current findings documentation
- Specific questions for specialist

### 5. Storage Layer Integration

**Location:** `server/storage.ts`

Database operations:
- `getReferral(id)` - Get single referral
- `getReferrals(filters)` - Get referrals with filters
- `createReferral(data)` - Create new referral
- `updateReferral(id, data)` - Update referral
- `deleteReferral(id)` - Delete referral

**Features:**
- Joins with patients and users tables
- Organization filtering
- Status-based filtering
- Role-based filtering

### 6. Routes Integration

**Location:** `server/routes.ts` and `server/routes/referrals.ts`

Two routing implementations:
1. **Legacy routes** in `routes.ts` - Direct Express routes
2. **Modular routes** in `routes/referrals.ts` - Router-based approach

Both support:
- Authentication middleware
- Role-based authorization
- Organization context
- Error handling
- Validation with Zod schemas

### 7. Testing Integration

**Location:** `test-patient-referral.js` and `TEST_REFERRAL_GUIDE.md`

Comprehensive testing:
- Automated test scripts
- Manual testing guides
- API endpoint testing
- Edge case validation

## Data Flow

### Creating a Referral

1. **User Action:** User clicks "Add Referral" in patient profile
2. **Form Submission:** ReferralsTab component validates form data
3. **API Call:** POST to `/api/patients/:id/referrals`
4. **Backend Processing:**
   - Validates required fields (specialty, reason)
   - Sets referringDoctorId from authenticated user
   - Sets organizationId from user context
   - Sets default status to 'pending'
   - Sets default urgency to 'routine' if not specified
5. **Database Insert:** Creates record in `patientReferrals` table
6. **Response:** Returns created referral with all fields
7. **UI Update:** Query invalidation refreshes referrals list

### Viewing Referrals

1. **Tab Activation:** User navigates to Referrals tab
2. **Query Execution:** React Query fetches `/api/patients/:id/referrals`
3. **Backend Query:** Filters by patientId and organizationId
4. **Data Join:** Joins with patients and users tables for display
5. **UI Rendering:** Displays referrals with status badges, urgency indicators, and dates

## Status Workflow

```
pending → scheduled → completed
         ↓
      cancelled
```

**Status Values:**
- `pending` - Initial status, awaiting action
- `scheduled` - Appointment has been scheduled
- `completed` - Referral process completed
- `cancelled` - Referral cancelled

## Urgency Levels

- `urgent` - Requires immediate attention
- `routine` - Standard referral (default)
- `non-urgent` - Can be scheduled at convenience

## Key Features

1. **Multi-Context Support:**
   - Patient-specific referrals (primary)
   - Role-based referrals (legacy)
   - Organization-scoped access

2. **Rich Metadata:**
   - Specialty classification
   - Urgency levels
   - Follow-up tracking
   - Appointment scheduling
   - Clinical notes

3. **Internationalization:**
   - Multi-language support
   - ISO 639-1 language codes
   - Locale-aware date formatting

4. **Standards Compliance:**
   - ICD-10 diagnosis codes
   - ISO 8601 date formats
   - Industry-standard clinical documentation

5. **Integration Points:**
   - Patient profile tabs
   - Navigation menus
   - Document generation
   - Clinical workflows

## Future Enhancements

Potential improvements based on international standards:

1. **HL7 FHIR Integration:**
   - Standard referral message format
   - Interoperability with other systems
   - Structured data exchange

2. **SNOMED CT Support:**
   - Standardized clinical terminology
   - Enhanced specialty classification
   - Better semantic interoperability

3. **Enhanced ICD-10/ICD-11:**
   - Full ICD-10 code database
   - ICD-11 migration path
   - Automated code suggestions

4. **Referral Tracking:**
   - Status updates from receiving facility
   - Automated notifications
   - Outcome tracking

5. **Electronic Referral Exchange:**
   - Direct system-to-system referrals
   - Secure data transmission
   - Audit trails

## Conclusion

The referrals system in ClinicConnect is well-integrated across the application, following international standards for medical terminology (ISO 639-1), date formats (ISO 8601), and clinical documentation (ICD-10). The system provides comprehensive referral management with proper access control, organization scoping, and rich metadata support.

