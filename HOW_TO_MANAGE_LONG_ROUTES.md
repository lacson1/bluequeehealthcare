# How to Manage Long Routes.ts File (15,184 lines)

## Current Problem
- **File**: `server/routes.ts` - 15,184 lines
- **Routes**: ~302 route definitions
- **Issue**: Hard to maintain, navigate, and understand

## Solution: Modular Route Architecture

### ✅ Already Done
Many routes are already modularized in `server/routes/`:
- `patients.ts` - Patient management
- `laboratory.ts` - Lab operations
- `prescriptions.ts` - Prescription management
- `appointments.ts` - Appointment scheduling
- `medicines.ts` - Medicine inventory
- `auth.ts` - Authentication
- `profile.ts` - User profiles
- `performance.ts` - Performance monitoring
- `integrations.ts` - Healthcare integrations
- `suggestions.ts` - Autocomplete/suggestions
- `ai-errors.ts` - AI and error monitoring (newly created)

### 📋 Strategy: Extract by Domain

#### Step 1: Identify Route Groups
Look for patterns in route paths:
```bash
# Find all route definitions
grep -n "app\.(get|post|put|patch|delete)" server/routes.ts | head -50
```

#### Step 2: Create Domain-Specific Route Files

**Pattern:**
```typescript
// server/routes/[domain].ts
import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";

export function setup[Domain]Routes(): Router {
  const router = Router();
  
  router.get('/endpoint', authenticateToken, async (req: AuthRequest, res) => {
    // handler code
  });
  
  return router;
}
```

#### Step 3: Register in routes.ts

**Replace:**
```typescript
app.get('/api/domain/endpoint', authenticateToken, handler);
```

**With:**
```typescript
const { setupDomainRoutes } = await import('./routes/domain');
const domainRouter = setupDomainRoutes();
app.use('/api', domainRouter);
```

### 🎯 Priority Extraction List

1. **Search Routes** → `server/routes/search.ts`
   - `/api/search/global`
   - `/api/medicines/search`
   - `/api/lab-tests/search`
   - `/api/patients/search`
   - `/api/diagnoses/search`
   - `/api/symptoms/search`
   - `/api/pharmacies/search`

2. **Dashboard Routes** → `server/routes/dashboard.ts`
   - `/api/dashboard/stats`
   - `/api/patients/analytics`
   - `/api/patients/enhanced`
   - `/api/patients/recent`

3. **Medication Review Routes** → `server/routes/medication-reviews.ts`
   - `/api/medication-review-assignments`
   - `/api/patients/:patientId/medication-review-assignments`

4. **Lab Order Items** → `server/routes/lab-order-items.ts`
   - `/api/lab-order-items/:id` (PATCH)

5. **Super Admin Routes** → `server/routes/super-admin.ts`
   - `/api/superadmin/*` (all super admin routes)

6. **Remaining Patient Routes** → Update `server/routes/patients.ts`
   - Patient visits (some already extracted)
   - Patient labs
   - Patient prescriptions
   - Patient vaccinations
   - Patient safety alerts

### 🔧 Quick Commands

**Find routes by pattern:**
```bash
grep "app\.(get|post|put|patch|delete)\(['\"]/api/search" server/routes.ts
```

**Count routes:**
```bash
grep -c "app\.(get|post|put|patch|delete)" server/routes.ts
```

**Find duplicate routes:**
```bash
grep "app\.(get|post|put|patch|delete)" server/routes.ts | sort | uniq -d
```

### 📊 Progress Tracking

- ✅ AI/Error routes extracted
- ✅ Performance routes (already modular)
- ✅ Integration routes (already modular)
- ⏳ Search routes
- ⏳ Dashboard routes
- ⏳ Medication reviews
- ⏳ Lab order items
- ⏳ Super admin routes
- ⏳ Remaining patient routes

### 🎯 Target Structure

```
server/
├── routes.ts (final: ~500 lines)
│   ├── Imports
│   ├── Middleware setup
│   ├── Route registrations
│   └── Legacy cleanup
│
└── routes/
    ├── ai-errors.ts ✅
    ├── performance.ts ✅
    ├── integrations.ts ✅
    ├── search.ts ⏳
    ├── dashboard.ts ⏳
    ├── medication-reviews.ts ⏳
    ├── lab-order-items.ts ⏳
    ├── super-admin.ts ⏳
    └── ... (existing modules)
```

### 💡 Best Practices

1. **One domain per file** - Keep related routes together
2. **Use Router()** - Create Express routers, not direct app routes
3. **Export setup function** - `setup[Domain]Routes(): Router`
4. **Import handlers** - Keep business logic in separate files
5. **Remove duplicates** - Check for duplicate route definitions
6. **Update index.ts** - Register new routes in `server/routes/index.ts`

### 🚀 Next Steps

1. Extract Search routes (highest impact)
2. Extract Dashboard routes
3. Extract Medication Review routes
4. Extract Lab Order Items
5. Extract Super Admin routes
6. Consolidate remaining Patient routes
7. Remove duplicate helper functions
8. Final cleanup and testing

