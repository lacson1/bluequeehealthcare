# Routes Testing Plan

**Date:** January 2025  
**Purpose:** Comprehensive testing plan for all routes before removing commented duplicate code

---

## Overview

Before removing the commented duplicate routes from `server/routes.ts`, we need to ensure that:
1. All modular routes are working correctly
2. No functionality is lost during the migration
3. All endpoints respond as expected
4. Authentication and authorization work properly
5. Organization filtering is correct
6. Error handling is appropriate

---

## Testing Strategy

### Phase 1: Unit Testing (Individual Routes)
Test each route module independently to verify:
- Route registration
- Request/response handling
- Validation
- Error handling

### Phase 2: Integration Testing (Route Modules)
Test route modules together to verify:
- Route precedence (no conflicts)
- Middleware chain
- Authentication flow
- Authorization checks

### Phase 3: End-to-End Testing (Full Workflows)
Test complete user workflows:
- Patient registration → Visit → Prescription → Lab Order
- Appointment booking → Consultation → Follow-up
- Billing → Invoice → Payment
- User management → Role assignment → Permissions

### Phase 4: Regression Testing
Test previously working features to ensure:
- No breaking changes
- Backward compatibility
- Data integrity

---

## Test Categories

### 1. Authentication & Authorization Tests

#### Authentication Tests
- [ ] Valid JWT token accepted
- [ ] Invalid JWT token rejected
- [ ] Expired token rejected
- [ ] Missing token returns 401
- [ ] Token refresh works

#### Authorization Tests
- [ ] Role-based access control works
- [ ] Permission checks enforced
- [ ] Super admin routes protected
- [ ] Organization isolation maintained
- [ ] Cross-organization access blocked

### 2. Patient Routes Tests

#### Patient CRUD
- [ ] Create patient (POST /api/patients)
- [ ] Get all patients (GET /api/patients)
- [ ] Get patient by ID (GET /api/patients/:id)
- [ ] Update patient (PATCH /api/patients/:id)
- [ ] Archive patient (PATCH /api/patients/:id/archive)
- [ ] Search patients (GET /api/patients/search)
- [ ] Get patient summary (GET /api/patients/:id/summary)
- [ ] Get recent patients (GET /api/patients/recent)

#### Patient Extended Routes
- [ ] Get patient allergies (GET /api/patients/:id/allergies)
- [ ] Create allergy (POST /api/patients/:id/allergies)
- [ ] Get patient vitals (GET /api/patients/:id/vitals)
- [ ] Create vital signs (POST /api/patients/:id/vitals)
- [ ] Get patient documents (GET /api/patients/:patientId/documents)
- [ ] Get patient insurance (GET /api/patients/:id/insurance)
- [ ] Create insurance (POST /api/patients/:id/insurance)
- [ ] Get medical history (GET /api/patients/:id/medical-history)
- [ ] Create medical history (POST /api/patients/:id/medical-history)
- [ ] Get safety alerts (GET /api/patients/:patientId/safety-alerts)

### 3. Visit Routes Tests

- [ ] Create visit (POST /api/patients/:id/visits)
- [ ] Get patient visits (GET /api/patients/:id/visits)
- [ ] Get visit by ID (GET /api/patients/:patientId/visits/:visitId)
- [ ] Update visit (PATCH /api/patients/:patientId/visits/:visitId)

### 4. Prescription Routes Tests

- [ ] Create prescription (POST /api/patients/:id/prescriptions)
- [ ] Get all prescriptions (GET /api/prescriptions)
- [ ] Get patient prescriptions (GET /api/patients/:id/prescriptions)
- [ ] Get active prescriptions (GET /api/patients/:id/prescriptions/active)
- [ ] Update prescription status (PATCH /api/prescriptions/:id/status)
- [ ] Print prescription (GET /api/prescriptions/:id/print)
- [ ] Medication review assignments (POST /api/medication-review-assignments)
- [ ] Get medication review assignments (GET /api/medication-review-assignments)
- [ ] Update medication review (PATCH /api/medication-reviews/:reviewId)

### 5. Laboratory Routes Tests

- [ ] Create lab order (POST /api/patients/:id/labs)
- [ ] Get patient labs (GET /api/patients/:id/labs)
- [ ] Get lab tests (GET /api/lab-tests)
- [ ] Create lab test (POST /api/lab-tests)
- [ ] Get lab results (GET /api/lab-results)
- [ ] Create lab result (POST /api/lab-results)

### 6. Appointment Routes Tests

- [ ] Create appointment (POST /api/appointments)
- [ ] Get appointments (GET /api/appointments)
- [ ] Get appointment by ID (GET /api/appointments/:id)
- [ ] Update appointment (PATCH /api/appointments/:id)
- [ ] Start consultation (POST /api/appointments/:id/start-consultation)
- [ ] Complete consultation (POST /api/appointments/:id/complete-consultation)

### 7. Billing Routes Tests

- [ ] Get invoices (GET /api/invoices)
- [ ] Create invoice (POST /api/invoices)
- [ ] Get invoice by ID (GET /api/invoices/:id)
- [ ] Record payment (POST /api/payments)
- [ ] Get service prices (GET /api/service-prices)
- [ ] Create service price (POST /api/service-prices)
- [ ] Get insurance claims (GET /api/insurance-claims)
- [ ] Submit insurance claim (POST /api/insurance-claims)

### 8. User & Organization Routes Tests

- [ ] Get users (GET /api/users)
- [ ] Create user (POST /api/users)
- [ ] Update user (PATCH /api/users/:id)
- [ ] Delete user (DELETE /api/users/:id)
- [ ] Get organizations (GET /api/organizations)
- [ ] Create organization (POST /api/organizations)
- [ ] Update organization (PATCH /api/organizations/:id)

### 9. Dashboard & Analytics Routes Tests

- [ ] Get dashboard stats (GET /api/dashboard/stats)
- [ ] Get comprehensive analytics (GET /api/analytics/comprehensive)

### 10. Telemedicine Routes Tests

- [ ] Get telemedicine sessions (GET /api/telemedicine/sessions)
- [ ] Create session (POST /api/telemedicine/sessions)
- [ ] Send notification (POST /api/telemedicine/sessions/:id/send-notification)
- [ ] Get stats (GET /api/telemedicine/stats)
- [ ] Update session (PATCH /api/telemedicine/sessions/:id)

### 11. File Routes Tests

- [ ] Upload file (POST /api/upload/:category)
- [ ] Get file (GET /api/files/:category/:fileName)
- [ ] Delete file (DELETE /api/files/:category/:fileName)
- [ ] Upload medical document (POST /api/upload/medical)
- [ ] Get medical documents (GET /api/files/medical)

### 12. Suggestion Routes Tests

- [ ] Medicine suggestions (GET /api/suggestions/medicines)
- [ ] Medication suggestions (GET /api/suggestions/medications)
- [ ] Diagnosis suggestions (GET /api/suggestions/diagnoses)
- [ ] Symptom suggestions (GET /api/suggestions/symptoms)
- [ ] Lab test suggestions (GET /api/suggestions/lab-tests)
- [ ] Allergy suggestions (GET /api/suggestions/allergies)
- [ ] Medical condition suggestions (GET /api/suggestions/medical-conditions)
- [ ] Get pharmacies (GET /api/pharmacies)

### 13. Notification Routes Tests

- [ ] Get notifications (GET /api/notifications)
- [ ] Clear notifications (POST /api/notifications/clear)
- [ ] Delete notification (DELETE /api/notifications/:notificationId)

### 14. Profile & Settings Routes Tests

- [ ] Get profile (GET /api/profile)
- [ ] Update profile (PUT /api/profile)
- [ ] Get settings (GET /api/settings)
- [ ] Update settings (PUT /api/settings)

### 15. Auth Routes Tests

- [ ] Login (POST /api/auth/login)
- [ ] Change password (POST /api/auth/change-password)
- [ ] Session status (GET /api/auth/session-status)
- [ ] Logout (POST /api/auth/logout)

---

## Test Execution Plan

### Step 1: Setup Test Environment
1. Create test database
2. Seed test data
3. Create test users with different roles
4. Set up test organizations

### Step 2: Run Automated Tests
1. Unit tests for each route module
2. Integration tests for route combinations
3. API endpoint tests using Postman/Newman or similar

### Step 3: Manual Testing
1. Test critical user workflows
2. Test edge cases
3. Test error scenarios
4. Test performance under load

### Step 4: Validation
1. Compare responses from modular routes vs commented routes
2. Verify data consistency
3. Check logs for errors
4. Monitor performance metrics

---

## Success Criteria

Before removing commented duplicate code:

✅ All modular routes respond correctly  
✅ No 404 errors for migrated routes  
✅ Authentication/authorization working  
✅ Organization filtering correct  
✅ Error handling appropriate  
✅ Response formats consistent  
✅ Performance acceptable  
✅ No breaking changes for frontend  
✅ All tests passing  
✅ Manual testing completed  

---

## Rollback Plan

If issues are discovered:
1. Keep commented duplicate code until issues resolved
2. Fix issues in modular routes
3. Re-test affected routes
4. Only remove commented code after all issues resolved

---

## Notes

- Test with different user roles (admin, doctor, nurse, pharmacist, receptionist)
- Test with different organizations (multi-tenant isolation)
- Test with invalid data (validation)
- Test with missing data (error handling)
- Test with large datasets (performance)
- Monitor database queries (efficiency)

---

**Last Updated:** January 2025  
**Status:** Ready for Testing

