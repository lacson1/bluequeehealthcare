# Routes.ts Management Guide

## Problem Summary
- **File**: `server/routes.ts`
- **Size**: 15,488 lines (extremely large!)
- **Routes**: ~308 route definitions
- **Linter Errors**: 906 errors
- **Status**: Monolithic file that needs refactoring

## Current Architecture

### ✅ Already Modularized (in `server/routes/`)
These routes are already extracted and working:
- `patients.ts` - Patient management
- `laboratory.ts` - Lab operations
- `prescriptions.ts` - Prescription management
- `appointments.ts` - Appointment scheduling
- `visits.ts` - Patient visits
- `medicines.ts` - Medicine catalog
- `referrals.ts` - Patient referrals
- `vaccinations.ts` - Vaccination records
- `auth.ts` - Authentication
- `organizations.ts` - Organization management
- `profile.ts` - User profiles
- `billing.ts` - Billing and invoices
- `analytics.ts` - Analytics
- `notifications.ts` - Notifications
- `system.ts` - System management
- `suggestions.ts` - Autocomplete/suggestions
- `users.ts` - **NEW** User management (just created)

### ❌ Still in routes.ts (Need Extraction)
These route groups are still in the monolithic file:
1. **Consultations** - Consultation forms, records, psychiatry routes
2. **Dashboard** - Dashboard statistics, patient outcomes
3. **Lab Results** - Lab result uploads and management (may partially exist)
4. **Patient Extended** - Insurance, medical history, discharge letters (may partially exist)
5. **Integrations** - FHIR, lab sync, e-prescribing (may partially exist)
6. **Performance** - Performance monitoring, error tracking, AI insights
7. **Availability** - Availability slots, blackout dates
8. **Consent Forms** - Consent templates and records
9. **Procedural Reports** - Procedure documentation
10. **Medical Documents** - Document uploads
11. **Messages** - Patient-staff messaging

## How to Manage This Refactoring

### Step 1: Identify Route Groups
```bash
# Find all route definitions
grep -n "app\.(get|post|put|delete|patch)" server/routes.ts | head -50

# Find routes by category
grep -n "/api/consultations" server/routes.ts
grep -n "/api/dashboard" server/routes.ts
grep -n "/api/availability" server/routes.ts
```

### Step 2: Create New Route Module
1. Create file: `server/routes/[domain].ts`
2. Use this template:
```typescript
import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { db } from "../db";
// ... other imports

const router = Router();

export function setup[Domain]Routes(): Router {
  // Extract routes from routes.ts here
  
  return router;
}
```

### Step 3: Extract Routes
1. Copy route handlers from `routes.ts`
2. Fix errors as you extract:
   - Add `return` before `res.json()` / `res.status().json()`
   - Remove unused imports
   - Fix type errors
   - Remove unused variables

### Step 4: Register in routes/index.ts
```typescript
import { setup[Domain]Routes } from "./[domain]";

export function setupRoutes(app: Express): void {
  // ... existing routes ...
  
  const [domain]Router = setup[Domain]Routes();
  app.use('/api', [domain]Router);
}
```

### Step 5: Remove from routes.ts
1. Delete extracted routes from `routes.ts`
2. Test that endpoints still work
3. Check linter errors are reduced

### Step 6: Update server/index.ts
Eventually, remove the call to `registerRoutes` from `routes.ts`:
```typescript
// OLD:
await registerRoutes(app);

// NEW:
// All routes now come from setupRoutes() in routes/index.ts
```

## Common Error Fixes

### 1. Missing Return Statements
**Error**: "Not all code paths return a value"

**Fix**: Add `return` before response:
```typescript
// BAD:
res.json(data);

// GOOD:
return res.json(data);
```

### 2. Unused Imports
**Error**: "'X' is declared but never used"

**Fix**: Remove unused imports:
```typescript
// Remove from imports if not used
import { unusedSchema } from "@shared/schema"; // DELETE
```

### 3. Type Errors (Database Schema)
**Error**: "Property 'X' does not exist in type..."

**Fix**: Check schema definition and fix insert/update:
```typescript
// Check what fields actually exist in the schema
// Remove fields that don't exist
await db.insert(table).values({
  validField: value,
  // invalidField: value, // REMOVE if doesn't exist
});
```

### 4. Unused Variables
**Error**: "'variable' is declared but its value is never read"

**Fix**: Remove or prefix with underscore:
```typescript
// BAD:
const unused = someValue;

// GOOD:
const _unused = someValue; // or just remove it
```

## File Size Targets

- **Each route module**: 200-500 lines (manageable)
- **Main routes index**: < 200 lines
- **Helper utilities**: < 300 lines each
- **routes.ts**: Eventually delete or archive

## Testing Strategy

1. **Extract one module at a time**
2. **Test endpoints** after each extraction
3. **Fix errors** before moving to next module
4. **Keep routes.ts** until all routes are migrated
5. **Use git commits** for each module extraction

## Priority Order

1. ✅ **Users** - DONE (just created)
2. **Consultations** - High priority (many routes)
3. **Dashboard** - High priority (used frequently)
4. **Availability** - Medium priority
5. **Performance** - Medium priority
6. **Consent Forms** - Low priority
7. **Procedural Reports** - Low priority
8. **Medical Documents** - Low priority
9. **Messages** - Low priority

## Benefits After Refactoring

✅ **Easier to maintain** - Smaller, focused files  
✅ **Better organization** - Routes grouped by domain  
✅ **Faster development** - Find routes quickly  
✅ **Reduced merge conflicts** - Multiple devs can work on different modules  
✅ **Better testability** - Test modules independently  
✅ **Clearer dependencies** - See what each module needs  
✅ **No linter errors** - Clean codebase  

## Quick Commands

```bash
# Count routes in routes.ts
grep -c "app\.(get|post|put|delete|patch)" server/routes.ts

# Count linter errors
npm run lint 2>&1 | grep "server/routes.ts" | wc -l

# Find all route paths
grep -oP "app\.(get|post|put|delete|patch)\('/api/[^']+'" server/routes.ts | sort | uniq

# Check file size
wc -l server/routes.ts
```

## Next Steps

1. ✅ Created `users.ts` module
2. ⏭️ Extract consultations routes
3. ⏭️ Extract dashboard routes
4. ⏭️ Extract availability routes
5. ⏭️ Continue with remaining modules
6. ⏭️ Fix all linter errors
7. ⏭️ Remove old routes.ts

