# API Errors Diagnosis and Fix

## Error Summary

The console shows multiple API errors, all stemming from a **401 Unauthorized** error on `/api/profile`. This authentication failure cascades to other endpoints that require user context.

## Root Cause

**Primary Issue: Session Expired/Invalid**
- `/api/profile` returns 401 Unauthorized
- This means the user's session has expired or is invalid
- Without a valid session, `req.user` is undefined, causing all dependent endpoints to fail

## Error Breakdown

### 1. Authentication Error (401)
```
api/profile:1 Failed to load resource: 401 (Unauthorized)
```
**Cause:** Session expired or invalid  
**Impact:** All other endpoints fail because they can't get user context  
**Fix:** User needs to log in again

### 2. Lab Orders Error (400)
```
api/patients/1/lab-orders:1 Failed to load resource: 400 (Bad Request)
```
**Cause:** Endpoint requires `organizationId` from authenticated user  
**Location:** `server/routes.ts:6180-6235`  
**Code:**
```typescript
const userOrgId = req.user?.organizationId;
if (!userOrgId) {
  return res.status(400).json({ message: "Organization context required" });
}
```
**Fix:** Will resolve once authentication is fixed

### 3. Labs Error (403)
```
api/patients/1/labs:1 Failed to load resource: 403 (Forbidden)
```
**Cause:** Endpoint requires `organizationId` from authenticated user  
**Location:** `server/routes.ts:1996-2039`  
**Code:**
```typescript
const organizationId = req.user?.organizationId;
if (!organizationId) {
  return res.status(403).json({ message: "Organization access required" });
}
```
**Fix:** Will resolve once authentication is fixed

### 4. Prescriptions Error (400)
```
api/patients/1/prescriptions:1 Failed to load resource: 400 (Bad Request)
```
**Cause:** Endpoint requires `organizationId` from authenticated user  
**Location:** `server/routes.ts:2530-2560`  
**Fix:** Will resolve once authentication is fixed

### 5. Safety Alerts Error (404)
```
api/patients/1/safety-alerts:1 Failed to load resource: 404 (Not Found)
```
**Cause:** Endpoint exists at `/api/patients/:id/safety-alerts`  
**Location:** `server/routes.ts:10053-10067`  
**Possible Issues:**
- Route might not be registered properly
- Path mismatch (check if client is calling correct path)
- Endpoint might be behind authentication that's failing

**Fix:** Verify route registration and ensure authentication works

### 6. Tab Configs Error (403)
```
api/tab-configs:1 Failed to load resource: 403 (Forbidden)
```
**Cause:** Endpoint uses `tenantMiddleware` which requires organization context  
**Location:** `server/routes/tab-configs.ts:105`  
**Fix:** Will resolve once authentication is fixed

### 7. Care Plans Error (403)
```
api/patients/1/care-plans:1 Failed to load resource: 403 (Forbidden)
```
**Cause:** Endpoint requires `organizationId` from authenticated user  
**Location:** `server/routes.ts:7836-7860`  
**Code:**
```typescript
const userOrgId = req.user?.organizationId;
if (!userOrgId) {
  return res.status(403).json({ message: "Organization context required" });
}
```
**Fix:** Will resolve once authentication is fixed

### 8. Appointments Error (400)
```
api/appointments:1 Failed to load resource: 400 (Bad Request)
```
**Cause:** Likely requires `organizationId` or other required parameters  
**Fix:** Will resolve once authentication is fixed

## Solutions

### Immediate Fix

1. **Log In Again**
   - The user needs to log in to restore their session
   - This will fix the 401 error on `/api/profile`
   - Once authenticated, most other errors should resolve automatically

2. **Verify User Has Organization**
   - After logging in, verify the user has an `organizationId` assigned
   - Users without an organization will still get 400/403 errors
   - Check user record in database: `SELECT id, username, organization_id FROM users WHERE username = 'your_username';`

### Long-term Improvements

1. **Better Error Handling**
   - Add more descriptive error messages
   - Return 401 instead of 400 when authentication is missing
   - Provide clear feedback to users about session expiration

2. **Session Management**
   - Implement automatic session refresh
   - Add session expiration warnings
   - Better handling of expired sessions in the frontend

3. **Route Verification**
   - Verify all routes are properly registered
   - Check for duplicate route definitions
   - Ensure route order is correct (more specific routes first)

## Testing

After logging in, verify:
1. `/api/profile` returns 200 OK
2. User object includes `organizationId`
3. All patient-related endpoints work correctly
4. No more 400/403 errors appear in console

## Related Files

- `server/routes.ts` - Main route definitions
- `server/middleware/auth.ts` - Authentication middleware
- `server/routes/profile.ts` - Profile endpoint
- `client/src/contexts/AuthContext.tsx` - Frontend auth context
- `server/routes/tab-configs.ts` - Tab configs routes

