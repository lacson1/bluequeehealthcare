# Code Organization & Test Coverage Improvement Plan

## Overview
This document outlines the plan to improve code organization and establish comprehensive test coverage for ClinicConnect.

---

## Part 1: Code Organization Refactoring

### 1.1 Routes.ts Refactoring (HIGH PRIORITY)

**Current State:**
- `server/routes.ts`: 13,856 lines (monolithic)
- `server/routes/`: 29 modular route files (partially migrated)
- Both `setupRoutes()` and `registerRoutes()` are used

**Goal:**
- Migrate all routes from `routes.ts` to domain-specific modules
- Reduce `routes.ts` to <500 lines (just route registration)
- Remove duplicate route definitions

**Migration Strategy:**

#### Phase 1: Extract Remaining Route Groups (Week 1)

1. **Visits & Consultations** → `server/routes/visits.ts`
   - GET/POST `/api/visits`
   - GET/PUT/DELETE `/api/visits/:id`
   - POST `/api/visits/:id/finalize`
   - GET `/api/patients/:id/visits`

2. **Lab Results** → `server/routes/lab-results.ts`
   - GET `/api/lab-results`
   - GET `/api/lab-results/reviewed`
   - POST `/api/lab-results`
   - PUT `/api/lab-results/:id/review`

3. **Medicines & Inventory** → `server/routes/medicines.ts`
   - GET/POST `/api/medicines`
   - GET/PUT/DELETE `/api/medicines/:id`
   - GET `/api/medicines/low-stock`

4. **Referrals** → `server/routes/referrals.ts`
   - GET/POST `/api/referrals`
   - GET/PUT/DELETE `/api/referrals/:id`

5. **Vaccinations** → `server/routes/vaccinations.ts`
   - GET/POST `/api/vaccinations`
   - GET/PUT/DELETE `/api/vaccinations/:id`

6. **Documents** → `server/routes/documents.ts`
   - GET/POST `/api/documents`
   - GET/DELETE `/api/documents/:id`
   - POST `/api/documents/:id/upload`

7. **Billing & Invoices** → `server/routes/billing.ts` (already exists, expand)
   - GET/POST `/api/invoices`
   - GET/POST `/api/payments`
   - GET/POST `/api/insurance-claims`

8. **Appointments** → `server/routes/appointments.ts` (already exists, expand)
   - All appointment-related routes

9. **Notifications** → `server/routes/notifications.ts` (already exists, expand)
   - All notification routes

10. **Analytics** → `server/routes/analytics.ts` (already exists, expand)
    - All analytics routes

#### Phase 2: Extract Helper Functions (Week 2)

Move utility functions from `routes.ts` to service layer:

1. **Patient Services** → `server/services/PatientService.ts`
   - `getOrganizationDetails()`
   - Patient search logic
   - Patient validation

2. **Visit Services** → `server/services/VisitService.ts`
   - Visit creation logic
   - Visit validation
   - Visit queries

3. **Prescription Services** → `server/services/PrescriptionService.ts` (exists, expand)
   - Prescription generation
   - HTML template generation

4. **Lab Services** → `server/services/LabService.ts` (exists, expand)
   - Lab result processing
   - Lab order management

#### Phase 3: Clean Up routes.ts (Week 3)

1. Keep only route registration logic
2. Import all route modules
3. Remove duplicate route definitions
4. Update `server/index.ts` to use only `setupRoutes()`

**Target Structure:**
```typescript
// server/routes.ts (final version - <500 lines)
import { setupRoutes } from './routes/index';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  initializeFirebase();
  
  // Apply global middleware
  app.use(securityHeaders);
  app.use(updateSessionActivity);
  app.use(performanceMonitor);
  
  // Setup all modular routes
  setupRoutes(app);
  
  // Setup error handling
  setupErrorRoutes(app);
  
  return createServer(app);
}
```

### 1.2 Component Splitting (MEDIUM PRIORITY)

#### Target Files:

1. **laboratory-unified.tsx** (2,477 lines → ~300 lines per component)
   - Split into:
     - `LabOrdersList.tsx` - Order listing
     - `LabOrderForm.tsx` - Order creation
     - `LabResultsList.tsx` - Results listing
     - `LabResultEntry.tsx` - Result entry form
     - `LabCatalog.tsx` - Test catalog
     - `LabPanels.tsx` - Panel management
   - Create: `hooks/useLabOperations.ts` for shared logic

2. **user-management-simple.tsx** (1,010 lines → ~300 lines per component)
   - Split into:
     - `UserList.tsx` - User listing
     - `UserForm.tsx` - User creation/editing
     - `UserFilters.tsx` - Filter controls
     - `BulkUserOperations.tsx` - Already exists, use it
   - Create: `hooks/useUserManagement.ts` for shared logic

3. **patient-profile.tsx** (808 lines → smaller components)
   - Extract tab components:
     - `PatientOverviewTab.tsx`
     - `PatientVisitsTab.tsx`
     - `PatientLabResultsTab.tsx`
     - `PatientMedicationsTab.tsx`

### 1.3 Service Layer Enhancement

**Create/Enhance Services:**

1. `server/services/PatientService.ts`
   - Patient CRUD operations
   - Patient search
   - Patient validation

2. `server/services/VisitService.ts`
   - Visit CRUD operations
   - Visit queries
   - Visit validation

3. `server/services/PrescriptionService.ts` (enhance)
   - Prescription generation
   - HTML template generation
   - Prescription validation

4. `server/services/LabService.ts` (enhance)
   - Lab order management
   - Lab result processing
   - Lab test catalog management

5. `server/services/MedicineService.ts`
   - Medicine CRUD operations
   - Stock management
   - Low stock alerts

---

## Part 2: Test Coverage Implementation

### 2.1 Testing Framework Setup

#### Frontend Testing:
- **Framework:** Vitest (fast, Vite-native)
- **Testing Library:** React Testing Library
- **Coverage:** @vitest/coverage-v8

#### Backend Testing:
- **Framework:** Vitest (unified with frontend)
- **HTTP Testing:** Supertest
- **Database Testing:** Test database with transactions

### 2.2 Test Structure

```
/
├── client/
│   ├── src/
│   │   ├── __tests__/          # Component tests
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   └── __mocks__/           # Mock data
├── server/
│   ├── __tests__/               # Backend tests
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── __mocks__/               # Mock data
└── tests/
    ├── e2e/                     # Cypress tests
    └── integration/             # Integration tests
```

### 2.3 Testing Priorities

#### Phase 1: Critical Path Tests (Week 1-2)

1. **Authentication & Authorization**
   - Login/logout flows
   - Role-based access control
   - Session management

2. **Patient Management**
   - Patient CRUD operations
   - Patient search
   - Patient profile access

3. **Core Clinical Operations**
   - Visit creation
   - Lab order creation
   - Prescription creation

#### Phase 2: Service Layer Tests (Week 3-4)

1. **Service Unit Tests**
   - PatientService
   - VisitService
   - LabService
   - PrescriptionService

2. **Utility Function Tests**
   - Validation functions
   - Formatting functions
   - Helper functions

#### Phase 3: Component Tests (Week 5-6)

1. **Critical Components**
   - PatientProfile
   - ConsultationWizard
   - LabOrderForm
   - UserManagement

2. **Reusable Components**
   - Form components
   - Table components
   - Modal components

#### Phase 4: Integration Tests (Week 7-8)

1. **API Integration Tests**
   - Full request/response cycles
   - Database interactions
   - Error handling

2. **E2E Tests (Cypress)**
   - Critical user flows
   - Multi-step workflows
   - Cross-browser testing

### 2.4 Test Coverage Goals

- **Unit Tests:** 80% coverage
- **Integration Tests:** 70% coverage
- **E2E Tests:** Critical paths only
- **Overall Target:** 75% code coverage

---

## Part 3: Implementation Timeline

### Week 1-2: Setup & Critical Routes
- [ ] Set up testing framework
- [ ] Create test utilities
- [ ] Extract visits routes
- [ ] Extract lab-results routes
- [ ] Add authentication tests

### Week 3-4: Service Layer & More Routes
- [ ] Create/enhance service layer
- [ ] Extract medicines routes
- [ ] Extract referrals routes
- [ ] Add service unit tests
- [ ] Add route integration tests

### Week 5-6: Component Splitting
- [ ] Split laboratory-unified.tsx
- [ ] Split user-management-simple.tsx
- [ ] Extract patient-profile tabs
- [ ] Add component tests

### Week 7-8: Finalization & Documentation
- [ ] Complete routes.ts cleanup
- [ ] Expand E2E test coverage
- [ ] Update documentation
- [ ] Code review and cleanup

---

## Part 4: Success Metrics

### Code Organization:
- ✅ `routes.ts` < 500 lines
- ✅ All routes in domain-specific files
- ✅ No component files > 500 lines
- ✅ Service layer for all business logic

### Test Coverage:
- ✅ 75%+ overall coverage
- ✅ 80%+ unit test coverage
- ✅ All critical paths tested
- ✅ CI/CD integration

### Code Quality:
- ✅ No linter errors
- ✅ TypeScript strict mode
- ✅ Consistent code style
- ✅ Proper error handling

---

## Next Steps

1. Review and approve this plan
2. Set up testing infrastructure
3. Begin Phase 1 route extraction
4. Create initial test suite
5. Establish CI/CD pipeline

---

**Last Updated:** December 2024

