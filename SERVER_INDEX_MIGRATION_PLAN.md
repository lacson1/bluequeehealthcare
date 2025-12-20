# Server Index Migration Plan

**Date:** January 2025  
**Purpose:** Plan for migrating from dual route registration to single modular route registration

---

## Current State

### Current Route Registration in `server/index.ts`

```typescript
// Setup new modular routes (patients, laboratory, prescriptions)
setupRoutes(app);

// Setup remaining routes from old routes.ts (auth, profile, dashboard, etc.)
await registerRoutes(app);
```

### Current Architecture

1. **Modular Routes** (`server/routes/index.ts`):
   - Registered via `setupRoutes(app)`
   - Organized by domain (patients, prescriptions, laboratory, etc.)
   - Uses `setup*Routes()` functions that return Router instances
   - Registered first (higher priority)

2. **Legacy Routes** (`server/routes.ts`):
   - Registered via `registerRoutes(app)`
   - Contains remaining routes not yet migrated
   - Also contains commented duplicate routes
   - Registered second (lower priority)

---

## Migration Strategy

### Phase 1: Complete Route Migration (Current)
- ✅ Migrate routes to modular files
- ✅ Comment out duplicates
- ✅ Test modular routes
- ⏳ Continue identifying and migrating remaining routes

### Phase 2: Remove Duplicate Routes
- Remove all commented duplicate code blocks
- Verify no functionality lost
- Test all routes again

### Phase 3: Final Migration
- Move remaining unique routes to appropriate modules
- Ensure all routes are in modular files
- Remove `registerRoutes()` function

### Phase 4: Cleanup
- Remove `registerRoutes()` import from `server/index.ts`
- Remove `registerRoutes()` call
- Update documentation

---

## Current Route Registration Analysis

### Routes Registered via `setupRoutes()` (Modular)

**Core Healthcare:**
- ✅ Patient routes (`setupPatientRoutes()`)
- ✅ Laboratory routes (`setupLaboratoryRoutes()`)
- ✅ Prescription routes (`setupPrescriptionRoutes()`)
- ✅ Patient extended routes (`setupPatientExtendedRoutes()`)
- ✅ Visit routes (`setupVisitRoutes()`)
- ✅ Lab results routes (`setupLabResultsRoutes()`)
- ✅ Medicines routes (`setupMedicinesRoutes()`)
- ✅ Referrals routes (`setupReferralRoutes()`)
- ✅ Vaccination routes (`setupVaccinationRoutes()`)
- ✅ Appointment routes (`setupAppointmentRoutes()`)

**Billing & Finance:**
- ✅ Billing routes (`setupBillingRoutes()`)

**System & Management:**
- ✅ Analytics routes (`setupAnalyticsRoutes()`)
- ✅ Notification routes (`setupNotificationRoutes()`)
- ✅ Suggestion routes (`setupSuggestionRoutes()`)
- ✅ System routes (`setupSystemRoutes()`)
- ✅ Users routes (`setupUsersRoutes()`)
- ✅ Performance routes (`setupPerformanceRoutes()`)
- ✅ Integrations routes (`setupIntegrationsRoutes()`)

**Specialized:**
- ✅ Telemedicine routes (`setupTelemedicineRoutes()`)
- ✅ Dashboard routes (`setupDashboardRoutes()`)
- ✅ Files routes (`setupFilesRoutes()`)

**Direct Router Exports:**
- ✅ Health router (`healthRouter`)
- ✅ Auth router (`authRouter`)
- ✅ Profile router (`profileRouter`)
- ✅ Access control router (`accessControlRouter`)
- ✅ Organizations router (`organizationsRouter`)
- ✅ Public API router (`publicApiRouter`)
- ✅ Mobile API router (`mobileApiRouter`)
- ✅ API keys router (`apiKeysRouter`)
- ✅ API docs router (`apiDocsRouter`)

**Function-based Setup:**
- ✅ Tab configs (`setupTabConfigRoutes(app)`)
- ✅ Tab presets (`setupTabPresetRoutes(app)`)
- ✅ Patient portal (`setupPatientPortalRoutes(app)`)

### Routes Registered via `registerRoutes()` (Legacy)

**Remaining Unique Routes:**
- Safety alerts routes
- Medication review routes
- Recent patients route
- Discharge letters routes
- Print organization route
- Superadmin routes (handled by `setupSuperAdminRoutes()`)
- Various system/audit/compliance routes

**Commented Duplicate Routes:**
- 110+ duplicate blocks (to be removed after testing)

---

## Migration Steps

### Step 1: Move Remaining Unique Routes

**Safety Alerts:**
- Move to `server/routes/patient-extended.ts` or create `server/routes/safety-alerts.ts`

**Medication Reviews:**
- Move to `server/routes/prescriptions.ts`

**Recent Patients:**
- Move to `server/routes/patients.ts`

**Discharge Letters:**
- Move to `server/routes/patient-extended.ts`

**Print Routes:**
- Create `server/routes/print.ts` or add to appropriate module

### Step 2: Update Route Registration

Add new route modules to `server/routes/index.ts`:

```typescript
import { setupSafetyAlertsRoutes } from "./safety-alerts";
import { setupPrintRoutes } from "./print";

export function setupRoutes(app: Express): void {
  // ... existing routes ...
  
  // Safety alerts routes
  console.log("Setting up safety alerts routes...");
  const safetyAlertsRouter = setupSafetyAlertsRoutes();
  app.use('/api', safetyAlertsRouter);
  
  // Print routes
  console.log("Setting up print routes...");
  const printRouter = setupPrintRoutes();
  app.use('/api', printRouter);
}
```

### Step 3: Remove registerRoutes() Call

Once all routes are migrated:

```typescript
// server/index.ts

// Remove this import:
// import { registerRoutes } from "./routes";

// Remove this call:
// await registerRoutes(app);

// Keep only:
setupRoutes(app);
```

### Step 4: Remove registerRoutes() Function

After confirming all routes work:

1. Remove `registerRoutes()` function from `server/routes.ts`
2. Remove all commented duplicate code blocks
3. Keep only unique routes that haven't been migrated yet (if any)

---

## Verification Checklist

Before removing `registerRoutes()`:

- [ ] All routes tested and working
- [ ] No 404 errors for any endpoint
- [ ] All duplicate routes removed
- [ ] All unique routes migrated to modules
- [ ] Frontend integration verified
- [ ] Performance acceptable
- [ ] Error handling correct
- [ ] Authentication/authorization working
- [ ] Organization filtering correct
- [ ] Documentation updated

---

## Timeline

1. **Week 1:** Move remaining unique routes to modules
2. **Week 2:** Test all routes comprehensively
3. **Week 3:** Remove commented duplicate code
4. **Week 4:** Remove `registerRoutes()` function and call
5. **Week 5:** Final testing and cleanup

---

## Risks & Mitigation

### Risk: Breaking Changes
**Mitigation:** Comprehensive testing before removal

### Risk: Missing Routes
**Mitigation:** Route inventory and verification

### Risk: Performance Issues
**Mitigation:** Performance testing and monitoring

### Risk: Frontend Integration Issues
**Mitigation:** Coordinate with frontend team, test integration

---

## Success Criteria

✅ All routes migrated to modular files  
✅ No duplicate routes remaining  
✅ `registerRoutes()` function removed  
✅ `registerRoutes()` call removed from `server/index.ts`  
✅ All tests passing  
✅ No breaking changes  
✅ Performance maintained or improved  
✅ Codebase cleaner and more maintainable  

---

**Last Updated:** January 2025  
**Status:** Planning Phase

