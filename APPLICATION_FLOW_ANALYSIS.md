# ClinicConnect Application Flow Analysis

## Overview
ClinicConnect is a comprehensive healthcare management system built with a modern tech stack (React + Express + PostgreSQL) featuring multi-tenant support, role-based access control, and extensive clinical workflow automation.

---

## 1. Application Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter (lightweight React router)
- **UI Components**: Custom components + Shadcn/UI
- **Authentication**: Session-based (express-session) with optional Replit Auth integration

### Project Structure
```
/client                    # Frontend React application
  /src
    /components           # 179+ reusable UI components
    /pages               # 60+ route pages
    /contexts            # React contexts (Auth, etc.)
    /hooks               # Custom React hooks
    /lib                 # Utilities, API client, query config
    /services            # Print service, letterhead service
    
/server                   # Backend Express application
  /routes               # Modular API route handlers
  /middleware           # Auth, security, tenant middleware
  /services             # Business logic services
  /migrations           # Database migrations
  
/shared                   # Shared types and schemas
  schema.ts             # Drizzle ORM schema definitions
```

---

## 2. Application Initialization Flow

### Startup Sequence

#### Backend Server (server/index.ts)
1. **Environment Setup**
   - Load environment variables from `.env`
   - Configure CORS for cross-origin requests
   - Apply security headers middleware

2. **Middleware Configuration**
   - Express JSON/URL encoding
   - Session management (express-session with PostgreSQL store)
   - Request logging with timing

3. **Database Seeding** (Idempotent - only creates if not exists)
   - Tab configurations seeding
   - Tab presets seeding
   - Mock data seeding (2 patients, 2 staff)
   - Medication database seeding

4. **Route Registration**
   - Modular routes setup (patients, laboratory, prescriptions, etc.)
   - Legacy routes from routes.ts
   - Error handling middleware

5. **Vite Development Server**
   - In development: Vite dev server for HMR
   - In production: Static file serving

6. **Server Listen**
   - Port 5001 (default) or environment-specified
   - Binds to 0.0.0.0 for network access

#### Frontend Client (client/src/main.tsx → App.tsx)
1. **React Application Bootstrap**
   - Root render with React 18 concurrent mode
   - QueryClientProvider wrapper for TanStack Query
   - AuthProvider for authentication context
   - TooltipProvider for UI tooltips
   - GlobalErrorBoundary for error handling

2. **Router Initialization**
   - Patient Portal route (public, no auth)
   - Main authenticated app routes
   - Loading state during auth check

3. **Authentication Check** (Currently Disabled)
   - Auto-sets superadmin user (id: 999)
   - Default organization: id 1
   - Note: Authentication is disabled for development

---

## 3. Authentication & Authorization Flow

### Current State: AUTHENTICATION DISABLED
⚠️ **Important**: For development purposes, authentication is currently bypassed.

**Default User:**
```typescript
{
  id: 999,
  username: 'superadmin',
  role: 'superadmin',
  organizationId: 1,
  currentOrganizationId: 1
}
```

### Normal Authentication Flow (When Enabled)

#### Login Process
1. **User submits credentials** → `/api/auth/login` (POST)
2. **Backend validates** credentials against database
3. **Session created** in PostgreSQL sessions table
4. **Cookie set** with session ID (httpOnly, secure)
5. **User data returned** with organization info
6. **Frontend redirects** to dashboard or organization selector

#### Session Management
- **Middleware**: `authenticateToken` checks session on each request
- **Session Storage**: PostgreSQL table with expiration
- **Cookie-based**: No JWT tokens, session ID only
- **Organization Context**: Multi-tenant via `organizationId`

#### Role-Based Access Control (RBAC)
- **Roles Table**: Defines available roles
- **Permissions Table**: Granular permission definitions
- **RolePermissions**: Junction table mapping roles to permissions
- **UserOrganizations**: Users can belong to multiple orgs with different roles

**Predefined Roles:**
- `superadmin` - Full system access
- `admin` - Organization administration
- `doctor` - Clinical workflows
- `nurse` - Patient care workflows
- `pharmacist` - Pharmacy workflows
- `receptionist` - Front desk workflows
- `lab_technician` - Laboratory workflows

---

## 4. Core User Journeys

### Journey 1: Patient Registration Flow

**Entry Points:**
- Dashboard → "Add Patient" button
- Patients page → "Register Patient" button
- Keyboard shortcut: Ctrl/Cmd + N (from dashboard)

**Flow:**
```
1. Click "Add Patient" button
   ↓
2. PatientRegistrationModal opens
   ↓
3. User fills form:
   - Title (Mr., Mrs., Dr., etc.)
   - First Name *
   - Last Name *
   - Date of Birth *
   - Gender *
   - Phone *
   - Email (optional)
   - Address (optional)
   - Allergies (with smart autocomplete)
   - Medical History (with condition autocomplete)
   ↓
4. Form validation (Zod schema)
   ↓
5. Submit → POST /api/patients
   ↓
6. Backend validation:
   - Check for duplicate phone in organization
   - Validate organizationId
   - Insert patient record
   ↓
7. Success response
   ↓
8. Frontend:
   - Invalidates patient queries (refetch)
   - Shows success toast
   - Closes modal
   - Resets form
```

**Backend Endpoint:**
```typescript
POST /api/patients
Authentication: Required
Authorization: All authenticated users
Body: InsertPatient schema
Returns: Created patient object
```

**Database Impact:**
- Insert into `patients` table
- Linked to `organizationId` for multi-tenancy

---

### Journey 2: Appointment Scheduling Flow

**Entry Points:**
- Dashboard → Appointments card
- Patients page → Schedule appointment from patient row
- Patient profile → Appointments tab
- Direct navigation to /appointments

**Flow:**
```
1. Navigate to Appointments page
   ↓
2. View calendar/list of appointments
   ↓
3. Click "New Appointment" or time slot
   ↓
4. SmartAppointmentScheduler opens
   ↓
5. Select/confirm patient
   ↓
6. Choose date from calendar
   ↓
7. Select available time slot
   ↓
8. Select healthcare provider (doctor/nurse)
   ↓
9. Choose appointment type:
   - Consultation
   - Follow-up
   - Check-up
   - Emergency
   - Procedure
   ↓
10. Set duration (default: 30 min)
    ↓
11. Add notes (optional)
    ↓
12. Submit → POST /api/appointments
    ↓
13. Backend validation:
    - Check for time slot conflicts
    - Validate date/time
    - Check provider availability
    ↓
14. Success:
    - Create appointment record
    - Create audit log entry
    - Send notification (if enabled)
    ↓
15. Frontend:
    - Refresh appointments list
    - Show success notification
    - Update calendar view
```

**Conflict Detection:**
- Checks existing appointments for same doctor/date
- Calculates minute-based overlaps
- Returns 409 Conflict if overlap detected

**Backend Endpoint:**
```typescript
POST /api/appointments
Authentication: Required
Authorization: doctor, nurse, admin
Body: {
  patientId: number,
  doctorId: number,
  appointmentDate: string,
  appointmentTime: string,
  duration: number,
  type: string,
  status: 'scheduled',
  priority: string,
  notes?: string
}
Returns: Created appointment object
```

---

### Journey 3: Visit Recording & Consultation Flow

**Entry Points:**
- Patient profile → "Record Visit" button
- Patients list → Quick action menu → Record visit
- Direct URL: /patients/:patientId/record-visit
- From appointment → Mark as "In Progress" → Record visit

**Flow - Basic Visit Recording:**
```
1. Navigate to patient profile
   ↓
2. Click "Record Visit" button
   ↓
3. VisitRecordingModal or EnhancedVisitRecording opens
   ↓
4. System pre-fills patient info
   ↓
5. Clinician enters:
   
   **Vitals Section:**
   - Blood Pressure (e.g., "120/80")
   - Heart Rate (bpm)
   - Temperature (°C/°F)
   - Weight (kg/lbs)
   - Height (cm/inches)
   
   **Clinical Assessment:**
   - Chief Complaint (required) - Smart suggestions
   - Diagnosis (required) - ICD-10 suggestions
   - Treatment Plan (required) - Template-based
   
   **Visit Details:**
   - Visit Type (consultation, follow-up, emergency, etc.)
   - Follow-up Date (optional)
   
   ↓
6. Auto-save draft to localStorage (every 30s)
   ↓
7. Clinician can:
   - Add prescriptions inline
   - Order lab tests
   - Schedule follow-up appointment
   - Generate referral letter
   ↓
8. Submit → POST /api/patients/:id/visits
   ↓
9. Backend processing:
   - Validate visit data (Zod schema)
   - Map field names (chiefComplaint → complaint)
   - Set doctorId from authenticated user
   - Set organizationId for multi-tenancy
   - Insert visit record
   ↓
10. Success:
    - Visit record created
    - Status: 'draft' or 'final'
    - Linked to patient and doctor
    ↓
11. Frontend:
    - Clear draft from localStorage
    - Invalidate visit queries
    - Navigate to visit detail page
    - Show success notification
```

**Enhanced Visit Recording Features:**
- **Smart Templates**: Pre-filled templates for common conditions
- **Voice Input**: Speech-to-text for dictation
- **AI Assistance**: Clinical note suggestions
- **Medication Suggestions**: Based on diagnosis
- **Lab Order Integration**: Direct lab test ordering
- **Previous Visit Context**: Show last visit for reference

**Backend Endpoint:**
```typescript
POST /api/patients/:id/visits
Authentication: Required
Authorization: doctor, nurse, admin
Body: {
  complaint: string,
  diagnosis: string,
  treatment: string,
  visitType: string,
  bloodPressure?: string,
  heartRate?: number,
  temperature?: number,
  weight?: number,
  followUpDate?: string,
  status: 'draft' | 'final'
}
Returns: Created visit object
```

---

### Journey 4: Laboratory Workflow

**Flow - Ordering Lab Tests:**
```
1. During visit or from patient profile
   ↓
2. Click "Order Lab Tests"
   ↓
3. Search for test from catalog:
   - Complete Blood Count (CBC)
   - Lipid Panel
   - Liver Function Test (LFT)
   - Renal Function Test (RFT)
   - HbA1c
   - Custom panels
   ↓
4. Select test(s) and panels
   ↓
5. Add clinical notes/indications
   ↓
6. Set priority (routine, urgent, stat)
   ↓
7. Submit → POST /api/lab-orders
   ↓
8. Lab order created with status: 'pending'
```

**Flow - Processing Lab Results:**
```
1. Lab technician navigates to /laboratory
   ↓
2. Views pending orders list
   ↓
3. Selects order to process
   ↓
4. Enters results for each test:
   - Test value
   - Unit
   - Normal range
   - Flag (normal, high, low, critical)
   ↓
5. Add technician notes
   ↓
6. Submit → PATCH /api/lab-orders/:id
   ↓
7. Status changes: 'pending' → 'completed'
   ↓
8. Notification sent to ordering physician
   ↓
9. Results visible in patient profile → Lab History tab
```

**AI-Powered Features:**
- **Result Analysis**: Automated interpretation suggestions
- **Trend Detection**: Compare with previous results
- **Critical Value Alerts**: Automatic flagging

---

### Journey 5: Prescription & Pharmacy Flow

**Flow - Creating Prescription:**
```
1. During visit or from patient profile
   ↓
2. Click "Add Prescription"
   ↓
3. PrescriptionModal opens
   ↓
4. Search medication:
   - Medication database (15,000+ drugs)
   - Smart search with autocomplete
   - Generic/brand name search
   ↓
5. Select medication
   ↓
6. Auto-fills if medication has defaults:
   - Default dosage
   - Default frequency
   - Default duration
   - Default instructions
   ↓
7. Clinician can modify:
   - Dosage (e.g., "500mg", "1 tablet")
   - Frequency (e.g., "Twice daily", "Every 8 hours")
   - Duration (e.g., "7 days", "2 weeks")
   - Instructions (e.g., "Take with food")
   ↓
8. Add to prescription list (can add multiple)
   ↓
9. Review all medications
   ↓
10. Check for drug interactions (AI-powered)
    ↓
11. Submit → POST /api/prescriptions
    ↓
12. Backend creates prescription records
    ↓
13. Prescription available for:
    - Pharmacy dispensing
    - Patient portal view
    - Printing
```

**Pharmacy Workflow:**
```
1. Pharmacist navigates to /pharmacy
   ↓
2. Views active prescriptions queue
   ↓
3. Selects prescription to dispense
   ↓
4. Verifies patient identity
   ↓
5. Checks medication availability in inventory
   ↓
6. Dispenses medication
   ↓
7. Updates prescription status: 'active' → 'dispensed'
   ↓
8. Updates inventory (stock reduction)
   ↓
9. Optionally: Print medication label
   ↓
10. Patient counseling notes (optional)
```

**Smart Features:**
- **Drug Interaction Checks**: AI-powered safety alerts
- **Allergy Warnings**: Cross-reference patient allergies
- **Dosage Validation**: Age/weight-based calculations
- **Medication History**: Show previous prescriptions
- **Inventory Integration**: Real-time stock checking
- **E-Prescribing**: Digital prescription transmission

---

## 5. Multi-Tenant Architecture

### Organization Hierarchy
```
Organizations (clinics, hospitals, health centers)
    ↓
  Staff Users (multiple roles per org)
    ↓
  Patients (belong to one org)
    ↓
  Clinical Data (visits, labs, prescriptions)
```

### Tenant Isolation
- **Database Level**: All tables have `organizationId` foreign key
- **Middleware Level**: `tenantMiddleware` enforces org context
- **Query Level**: All queries filtered by `organizationId`
- **UI Level**: Organization switcher for multi-org users

### Organization Features
- **Branding**: Custom logo, theme colors
- **Letterhead**: Configurable for documents
- **Settings**: Org-specific configurations
- **Staff Management**: Role assignments per org
- **Billing**: Separate billing per org

---

## 6. API Architecture

### Modular Route Structure
```
/server/routes/
  index.ts              # Route orchestrator
  patients.ts           # Patient CRUD + visits
  laboratory.ts         # Lab orders + results
  prescriptions.ts      # Prescription management
  patient-extended.ts   # Allergies, immunizations, imaging, procedures
  organizations.ts      # Multi-tenant org management
  appointments.ts       # Appointment scheduling
  auth.ts              # Authentication endpoints
  billing.ts           # Billing and invoicing
  public-api.ts        # Public REST API
  mobile-api.ts        # Mobile-optimized endpoints
  tab-configs.ts       # Custom tab configurations
```

### API Endpoint Categories

#### Patient Management
- `GET /api/patients` - List patients with search/filter
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PATCH /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Soft delete/archive

#### Visit Management
- `POST /api/patients/:id/visits` - Create visit
- `GET /api/patients/:id/visits` - List patient visits
- `GET /api/visits/:id` - Get visit details
- `PATCH /api/visits/:id` - Update visit
- `GET /api/visits` - List all visits (with filters)

#### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

#### Laboratory
- `GET /api/lab-orders` - List lab orders
- `POST /api/lab-orders` - Create lab order
- `PATCH /api/lab-orders/:id` - Update/complete order
- `GET /api/lab-catalog` - Get available tests
- `GET /api/lab-panels` - Get test panels

#### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `PATCH /api/prescriptions/:id` - Update prescription status
- `GET /api/medications` - Search medication database

#### Organization Management
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `PATCH /api/organizations/:id` - Update organization
- `GET /api/organization/staff` - List org staff
- `POST /api/organization/staff` - Add staff to org

### Authentication Middleware
All protected endpoints use:
```typescript
authenticateToken        // Verify session
requireRole('doctor')    // Single role check
requireAnyRole(['doctor', 'nurse'])  // Multiple role check
requireSuperOrOrgAdmin() // Admin check
```

---

## 7. Frontend State Management

### TanStack Query (React Query)
**Cache Strategy:**
- Query keys: URL-based (e.g., `/api/patients`)
- Stale time: 30 seconds (default)
- Cache time: 5 minutes
- Refetch on window focus: Enabled
- Retry: 3 attempts with exponential backoff

**Common Queries:**
```typescript
useQuery(['/api/patients'])           // List all patients
useQuery(['/api/patients', patientId]) // Single patient
useQuery(['/api/appointments'])       // Appointments
useQuery(['/api/lab-orders'])         // Lab orders
useQuery(['/api/dashboard/stats'])    // Dashboard stats
```

**Mutations:**
```typescript
useMutation({
  mutationFn: (data) => apiRequest('/api/patients', 'POST', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/patients'])
  }
})
```

### Context Providers
- **AuthContext**: User authentication state
- **ThemeContext**: (if implemented) UI theming
- **NotificationContext**: Toast notifications

### Local Storage Usage
- Visit recording drafts (auto-save)
- User preferences
- Onboarding tour state
- Recently viewed patients

---

## 8. Key Features & Workflows

### Dynamic Tab System
**Purpose**: Customizable patient profile tabs per organization

**Flow:**
```
1. Organization admin defines tabs:
   - Built-in tabs: Overview, History, Lab Results, etc.
   - Custom tabs: Organization-specific sections
   ↓
2. Tab configurations stored in database
   ↓
3. Patient profile loads tabs dynamically
   ↓
4. Tabs rendered based on:
   - Organization settings
   - User role permissions
   - Feature availability
```

**Tab Types:**
- Overview
- Visit History
- Appointments
- Lab Results
- Prescriptions
- Allergies
- Immunizations
- Imaging
- Procedures
- Billing
- Insurance
- Discharge Letters
- Custom (organization-defined)

### Document Generation
**Supported Documents:**
- **Discharge Letters**: Professional letterhead with org branding
- **Prescriptions**: E-prescription format
- **Medical Certificates**: Sick leave, fitness certificates
- **Referral Letters**: Specialist referrals
- **Lab Reports**: Formatted test results
- **Invoices**: Billing documents

**Print Service:**
```typescript
// client/src/services/print-service.ts
printDocument(content, options)
  - Formats content with letterhead
  - Applies organization branding
  - Generates PDF (browser print)
  - Optional: Save to patient record
```

### AI-Powered Features
1. **Clinical Note Generation**
   - Voice-to-text transcription
   - Structured SOAP note formatting
   - ICD-10 code suggestions

2. **Drug Interaction Checking**
   - Real-time interaction alerts
   - Severity classification
   - Alternative suggestions

3. **Lab Result Analysis**
   - Automated interpretation
   - Trend analysis
   - Critical value alerts

4. **Diagnostic Assistance**
   - Differential diagnosis suggestions
   - Evidence-based recommendations
   - Clinical guideline references

### Offline Capabilities
**Service Worker** (`client/src/sw.js`):
- Cache static assets
- Offline page fallback
- Background sync for form submissions
- Push notification support

### Global Search
**Features:**
- Search patients by name, phone, ID
- Search medications
- Search lab tests
- Search appointments
- Keyboard shortcut: Ctrl/Cmd + K

---

## 9. Security & Compliance

### Security Headers (middleware/security.ts)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: (configured)
```

### Session Security
- **HttpOnly Cookies**: Prevents XSS attacks
- **Secure Flag**: HTTPS only (production)
- **SameSite**: CSRF protection
- **Session Expiration**: Configurable timeout
- **Session Storage**: PostgreSQL (persistent)

### Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Minimum Complexity**: (can be configured)
- **Failed Login Tracking**: Account lockout after attempts
- **Password Reset**: Token-based flow

### Audit Logging
**AuditLogger class** tracks:
- Patient record access
- Data modifications
- Prescription creation
- Lab order placement
- User actions
- IP address and user agent

**Audit Log Fields:**
```typescript
{
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  changes: JSON,
  ipAddress: string,
  userAgent: string,
  timestamp: Date
}
```

### HIPAA Considerations
- **Data Encryption**: At rest and in transit
- **Access Controls**: Role-based permissions
- **Audit Trails**: Comprehensive logging
- **Data Retention**: Configurable policies
- **Secure Disposal**: Soft deletes with archiving

---

## 10. Database Schema Overview

### Core Tables
```sql
organizations          # Multi-tenant clinics/hospitals
users                 # Staff members with RBAC
patients              # Patient demographics
visits                # Clinical encounters
appointments          # Scheduling
prescriptions         # Medication orders
lab_orders            # Lab test requests
lab_results           # Test results
medications           # Drug database (15,000+)
```

### Extended Tables
```sql
allergies             # Patient allergies
immunizations         # Vaccination records
imaging_studies       # Radiology/imaging
procedures            # Surgical procedures
insurance_policies    # Patient insurance
billing_transactions  # Financial records
audit_logs           # Security audit trail
sessions             # User sessions
```

### RBAC Tables
```sql
roles                 # System roles
permissions           # Granular permissions
role_permissions      # Role-permission mapping
user_organizations    # User-org membership
```

### Relationships
- **One-to-Many**:
  - Organization → Patients
  - Patient → Visits
  - Visit → Prescriptions
  - Patient → Lab Orders

- **Many-to-Many**:
  - Users ↔ Organizations (via user_organizations)
  - Roles ↔ Permissions (via role_permissions)

---

## 11. Error Handling & Monitoring

### Frontend Error Handling
```typescript
// GlobalErrorBoundary component
- Catches React component errors
- Displays user-friendly error page
- Logs to console/monitoring service
- Allows error recovery
```

### Backend Error Handling
```typescript
// Express error middleware
app.use((err, req, res, next) => {
  - Log error with context
  - Sanitize error message
  - Return appropriate HTTP status
  - Prevent server crashes
})
```

### Error Types
- **Validation Errors** (400): Zod schema validation failures
- **Authentication Errors** (401): Invalid/missing session
- **Authorization Errors** (403): Insufficient permissions
- **Not Found Errors** (404): Resource doesn't exist
- **Conflict Errors** (409): Duplicate data, time conflicts
- **Server Errors** (500): Unexpected failures

### Logging
- **Request Logging**: Method, path, status, duration
- **Error Logging**: Stack traces, context
- **Audit Logging**: User actions, data changes
- **Performance Logging**: Slow query detection

---

## 12. Performance Optimizations

### Frontend
- **Code Splitting**: Route-based lazy loading
- **Query Optimization**: TanStack Query caching
- **Debounced Search**: Reduces API calls
- **Virtual Scrolling**: For large patient lists
- **Memoization**: React.memo for expensive components
- **Image Optimization**: Lazy loading, compression

### Backend
- **Database Indexing**:
  - Patient phone numbers
  - Appointment dates/times
  - Lab order status
  - User organization IDs

- **Query Optimization**:
  - Select only needed columns
  - Use joins instead of N+1 queries
  - Limit/offset pagination

- **Caching** (planned):
  - Redis for session storage
  - Medication database caching
  - Lab catalog caching

### Database
- **Connection Pooling**: Drizzle ORM built-in
- **Prepared Statements**: SQL injection prevention
- **Batch Operations**: Multiple inserts/updates
- **Soft Deletes**: Archive instead of delete

---

## 13. Mobile Responsiveness

### Mobile API Endpoints
```
/api/mobile/*
- Optimized payloads
- Reduced data transfer
- Mobile-specific features
```

### Responsive UI Components
- Sidebar collapses to hamburger menu
- Touch-friendly quick actions
- Mobile-optimized forms
- Swipe gestures (planned)
- Bottom navigation (mobile)

### Progressive Web App (PWA)
- Service worker registration
- Installable on mobile devices
- Offline support
- Push notifications ready

---

## 14. Integration Capabilities

### FHIR Integration (planned)
- **Patient Export**: Convert to FHIR Patient resource
- **Lab Results**: FHIR Observation resources
- **Medications**: FHIR MedicationRequest
- **Import/Export**: Interoperability with other systems

### External APIs
- **SMS Notifications**: Appointment reminders
- **Email Service**: Communication
- **Push Notifications**: Firebase Cloud Messaging
- **Payment Gateways**: Billing integration

### Public REST API
```
/api/v1/*
- API key authentication
- Rate limiting
- Comprehensive documentation
- Swagger/OpenAPI spec
```

---

## 15. Deployment & DevOps

### Environment Configuration
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=5001
NODE_ENV=development|production
SESSION_SECRET=...
REPLIT_AUTH_CLIENT_ID=... (optional)
```

### Build Process
```bash
# Development
npm run dev          # Vite dev server + Express

# Production
npm run build        # Build frontend assets
npm start           # Serve production build
```

### Database Migrations
```
server/migrations/
  001_enable_pg_trgm.sql
  002_fix_prescription_medications.sql
  005_patient_extended_features.sql
  ...
```

### Seeding Scripts
```
server/seedTabConfigs.ts    # Tab configuration data
server/seedTabPresets.ts    # Tab preset templates
server/seedMockData.ts      # Sample patients/staff
server/seedMedications.ts   # 15,000+ medication database
```

---

## 16. Testing Strategy (Planned/Partial)

### E2E Testing
```
cypress/
  e2e/
    consultation.cy.js     # Visit recording flow
  fixtures/
    consultation-data.json # Test data
```

### Test Areas
- Patient registration flow
- Appointment scheduling
- Visit recording
- Prescription creation
- Lab order workflow
- Authentication flow
- Multi-tenant isolation

---

## 17. Common User Scenarios

### Scenario A: Doctor's Daily Workflow
```
1. Login → Dashboard
   ↓
2. View today's appointments
   ↓
3. For each appointment:
   a. Click patient → View overview
   b. Review history, labs, prescriptions
   c. Click "Start Consultation"
   d. Record vitals
   e. Enter chief complaint, diagnosis, treatment
   f. Add prescriptions (if needed)
   g. Order lab tests (if needed)
   h. Schedule follow-up (if needed)
   i. Save visit (final)
   ↓
4. Generate documents (certificates, letters)
   ↓
5. Review lab results for other patients
   ↓
6. End day → Logout
```

### Scenario B: Receptionist Workflow
```
1. Login → Dashboard
   ↓
2. Patient walks in:
   a. Search for existing patient OR
   b. Register new patient
   ↓
3. Schedule/confirm appointment
   ↓
4. Check patient in (update appointment status)
   ↓
5. Collect payment/insurance info
   ↓
6. Update patient contact information (if needed)
   ↓
7. Print appointment card
```

### Scenario C: Lab Technician Workflow
```
1. Login → Navigate to Laboratory
   ↓
2. View pending lab orders
   ↓
3. Collect sample from patient
   ↓
4. Process sample → Run tests
   ↓
5. Enter results into system:
   - Test values
   - Units
   - Flag abnormals
   ↓
6. Review and submit results
   ↓
7. System notifies ordering physician
   ↓
8. Repeat for next order
```

### Scenario D: Pharmacist Workflow
```
1. Login → Navigate to Pharmacy
   ↓
2. View active prescriptions queue
   ↓
3. Select prescription to dispense
   ↓
4. Verify:
   - Patient identity
   - Drug interactions
   - Allergies
   - Stock availability
   ↓
5. Dispense medication
   ↓
6. Update inventory
   ↓
7. Print medication label
   ↓
8. Provide patient counseling
   ↓
9. Mark prescription as dispensed
```

---

## 18. Future Enhancements

### Planned Features
- [ ] **Telemedicine**: Video consultations
- [ ] **Mobile App**: Native iOS/Android apps
- [ ] **Patient Portal**: Self-service appointment booking
- [ ] **Billing Automation**: Insurance claim submission
- [ ] **Analytics Dashboard**: Advanced reporting
- [ ] **FHIR Integration**: Full interoperability
- [ ] **Voice Commands**: Hands-free data entry
- [ ] **Barcode Scanning**: Medication verification
- [ ] **E-Signature**: Digital document signing
- [ ] **Chronic Disease Management**: Care plans, reminders
- [ ] **Inventory Forecasting**: AI-powered stock predictions
- [ ] **Multi-language Support**: Internationalization

---

## 19. Technical Debt & Known Issues

### Current Limitations
1. **Authentication Disabled**: For development purposes
2. **Limited Test Coverage**: Needs comprehensive testing
3. **No Redis Caching**: Performance could improve
4. **Monolithic routes.ts**: Being migrated to modular structure
5. **Limited Error Recovery**: Some workflows lack retry logic

### Performance Bottlenecks
- Large patient lists (need virtual scrolling everywhere)
- Complex form validations (can be slow on low-end devices)
- Image uploads (need compression)

### Security TODOs
- [ ] Implement rate limiting on API endpoints
- [ ] Add CSRF token validation
- [ ] Enable two-factor authentication
- [ ] Implement secure file storage encryption
- [ ] Add IP whitelisting for sensitive endpoints

---

## 20. Summary & Key Takeaways

### Application Strengths
✅ **Comprehensive Feature Set**: Covers entire healthcare workflow
✅ **Modern Tech Stack**: React, TypeScript, PostgreSQL
✅ **Multi-Tenant Architecture**: Scalable for multiple organizations
✅ **RBAC System**: Granular permission control
✅ **AI-Powered Insights**: Clinical decision support
✅ **Modular Design**: Easy to extend and maintain
✅ **Mobile-Responsive**: Works on all devices

### Core Workflows
1. **Patient Registration** → Centralized demographic management
2. **Appointment Scheduling** → Conflict-free calendar management
3. **Clinical Visits** → Structured SOAP note recording
4. **Laboratory** → Order to result workflow
5. **Pharmacy** → Prescription to dispensing workflow
6. **Document Generation** → Professional medical documents

### Data Flow Pattern
```
User Action (Frontend)
    ↓
API Request (TanStack Query)
    ↓
Express Route Handler
    ↓
Middleware (Auth, Tenant, Validation)
    ↓
Business Logic (Service Layer)
    ↓
Database Operation (Drizzle ORM)
    ↓
PostgreSQL Database
    ↓
Response (JSON)
    ↓
Frontend State Update
    ↓
UI Re-render (React)
```

### Development Philosophy
- **User-Centric**: Healthcare workflows optimized for speed
- **Data Integrity**: Comprehensive validation at all levels
- **Security-First**: HIPAA-compliant design patterns
- **Scalability**: Multi-tenant from ground up
- **Maintainability**: Modular architecture, clean code

---

## Appendix: Quick Reference

### Environment Variables
```env
DATABASE_URL          # PostgreSQL connection string
PORT                  # Server port (default: 5001)
JWT_SECRET            # Secret for JWT signing
SESSION_SECRET        # Session encryption key
NODE_ENV              # development | production
```

### Key Directories
```
/client/src/components  # 179+ UI components
/client/src/pages      # 60+ route pages
/server/routes         # API route modules
/server/middleware     # Express middleware
/shared               # Shared TypeScript types
```

### Important Files
```
client/src/App.tsx              # Main app router
client/src/contexts/AuthContext.tsx  # Auth state
server/index.ts                 # Express server entry
server/routes/index.ts          # Route orchestrator
shared/schema.ts                # Database schema
```

### Common Commands
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm start             # Start production server
npm run seed          # Seed database
npm run migrate       # Run migrations
```

---

**Document Version**: 1.0  
**Last Updated**: November 29, 2025  
**Author**: AI Analysis  
**Application**: ClinicConnect Healthcare Management System

