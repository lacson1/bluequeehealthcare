# Routes.ts Refactoring Plan

## Current Status
- **File Size**: 15,184 lines
- **Route Definitions**: ~302 routes
- **Goal**: Reduce to < 500 lines (just route registration)

## Strategy

### Phase 1: Extract by Domain (Current)
1. ✅ AI/Error routes → `server/routes/ai-errors.ts`
2. ⏳ Performance/Integration routes → `server/routes/performance-integrations.ts`
3. ⏳ Suggestions routes → Update `server/routes/suggestions.ts`
4. ⏳ Search routes → `server/routes/search.ts`
5. ⏳ Dashboard routes → `server/routes/dashboard.ts`
6. ⏳ Super Admin routes → `server/routes/super-admin.ts`
7. ⏳ Lab Order Items → `server/routes/lab-order-items.ts`
8. ⏳ Medication Reviews → `server/routes/medication-reviews.ts`

### Phase 2: Extract Remaining Patient Routes
- Patient enhanced endpoints
- Patient analytics
- Patient search
- Patient visits (some already in visits.ts)
- Patient labs
- Patient prescriptions
- Patient vaccinations
- Patient safety alerts

### Phase 3: Extract Remaining Routes
- Medicines management (some already in medicines.ts)
- Prescriptions (some already in prescriptions.ts)
- Lab results (some already in lab-results.ts)
- Users management (some already in users.ts)
- Audit logs (some already in audit-logs-enhanced.ts)

### Phase 4: Cleanup
- Remove duplicate helper functions
- Remove duplicate route definitions
- Consolidate route registration in `registerRoutes`

## Route Extraction Pattern

```typescript
// server/routes/[domain].ts
import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
// ... other imports

export function setup[Domain]Routes(): Router {
  const router = Router();
  
  // Route definitions here
  router.get('/endpoint', authenticateToken, async (req: AuthRequest, res) => {
    // handler
  });
  
  return router;
}
```

Then in `routes.ts`:
```typescript
const { setup[Domain]Routes } = await import('./routes/[domain]');
const domainRouter = setup[Domain]Routes();
app.use('/api', domainRouter);
```

## Target Structure

```
server/routes.ts (final) - ~500 lines
├── Imports
├── Middleware setup
├── Route module registrations
└── Legacy route cleanup

server/routes/
├── ai-errors.ts ✅
├── performance-integrations.ts
├── suggestions.ts (update)
├── search.ts
├── dashboard.ts
├── super-admin.ts
├── lab-order-items.ts
├── medication-reviews.ts
└── ... (existing modules)
```
