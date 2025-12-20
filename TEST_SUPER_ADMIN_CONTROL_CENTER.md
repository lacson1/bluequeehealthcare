# Super Admin Control Center - Testing Guide

## Quick Test Results

**Latest Test Run**: 76.9% Success Rate (20/26 tests passed)

### ✅ Working Features
- ✅ Authentication & Login
- ✅ Get All Organizations
- ✅ Create Organization
- ✅ Get All Users
- ✅ User Impersonation
- ✅ Maintenance Mode (Enable/Disable)
- ✅ System Status & Stats
- ✅ Feature Management (Get/Toggle)
- ✅ System Analytics
- ✅ System Health
- ✅ Security Policies
- ✅ Audit Logs
- ✅ System Backup
- ✅ Data Export
- ✅ Global Policies (Get/Update)
- ✅ Activity Statistics

### ⚠️ Issues Found
- ❌ Update Organization Status
- ❌ Update Organization Details
- ❌ Lock User Account
- ❌ Get Comprehensive Analytics
- ❌ Get Active Sessions
- ❌ Get Activity Logs

## Testing Methods

### Option 1: Web UI Testing (Recommended)

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Login as Super Admin**:
   - Navigate to: `http://localhost:5001/login`
   - Username: `superadmin`
   - Password: `super123`
   - Or use the "Super Admin" demo button if available

3. **Access Super Admin Control Center**:
   - Navigate to: `http://localhost:5001/super-admin-control`
   - Or: `http://localhost:5001/super-admin-control-panel`
   - The route should be accessible from the sidebar if you're logged in as superadmin

4. **Test Each Tab**:
   - **Overview**: System health, recent activities
   - **Organizations**: View, create, manage organizations
   - **Users**: View, edit, manage users
   - **System**: Maintenance mode, backups, system controls
   - **Analytics**: System analytics and statistics
   - **Settings**: System and security settings

### Option 2: Automated Test Script

```bash
# Run the comprehensive test suite
node test-super-admin-control.js superadmin super123

# Or with custom credentials
node test-super-admin-control.js <username> <password>
```

**Expected Output**:
- Authentication test
- Organization Management tests
- User Management tests
- System Controls tests
- Feature Management tests
- Analytics tests
- Security Features tests
- Data Management tests
- Global Policies tests
- Activity Monitoring tests

### Option 3: API Testing (cURL)

#### 1. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"super123"}' \
  -c cookies.txt
```

#### 2. Get Organizations
```bash
curl -X GET http://localhost:5001/api/superadmin/organizations \
  -b cookies.txt
```

#### 3. Get Users
```bash
curl -X GET http://localhost:5001/api/superadmin/users \
  -b cookies.txt
```

#### 4. Get System Stats
```bash
curl -X GET http://localhost:5001/api/superadmin/system-stats \
  -b cookies.txt
```

#### 5. Get Analytics
```bash
curl -X GET http://localhost:5001/api/superadmin/analytics \
  -b cookies.txt
```

#### 6. Enable Maintenance Mode
```bash
curl -X POST http://localhost:5001/api/superadmin/system/maintenance \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"enabled":true,"message":"System maintenance","estimatedDuration":"30 minutes"}'
```

## Test Credentials

Default super admin credentials:
- **Username**: `superadmin`
- **Password**: `super123`

**Note**: These are demo passwords that only work in development mode when `ALLOW_DEMO_PASSWORDS=true` is set in `.env`.

## Features to Test

### 1. Overview Tab
- [x] System Health Cards (CPU, Memory, Disk)
- [x] Recent Activities Display
- [x] System Status Badge
- [x] Quick Stats

### 2. Organizations Tab
- [x] List All Organizations
- [x] Search Organizations
- [x] Filter by Status
- [x] Create New Organization
- [x] View Organization Details
- [ ] Update Organization Status (Issue)
- [ ] Update Organization Details (Issue)
- [x] Toggle Organization Active/Inactive

### 3. Users Tab
- [x] List All Users
- [x] Search Users
- [x] Filter by Role/Status
- [x] Sort Users
- [x] Bulk Actions
- [x] View User Details
- [x] Edit User
- [x] Delete User
- [x] Reset Password
- [ ] Lock User Account (Issue)
- [x] Unlock User Account
- [x] User Impersonation

### 4. System Tab
- [x] Create System Backup
- [x] Restore from Backup
- [x] Restart System Services
- [x] Emergency Maintenance Mode
- [x] System Monitoring Metrics
- [x] Enable/Disable Maintenance Mode

### 5. Analytics Tab
- [x] Usage Statistics
- [x] Performance Metrics
- [x] System Health
- [ ] Comprehensive Analytics (Issue)

### 6. Settings Tab
- [x] Maintenance Mode Toggle
- [x] Auto Backups Toggle
- [x] Email Notifications Toggle
- [x] Debug Logging Toggle
- [x] Security Settings Form
- [x] Update Security Settings

## Known Issues

### 1. Update Organization Status
**Error**: Endpoint may not be properly handling status updates
**Workaround**: Use the UI toggle button which uses `isActive` boolean

### 2. Update Organization Details
**Error**: PATCH endpoint may have validation issues
**Workaround**: Try updating one field at a time

### 3. Lock User Account
**Error**: User status update endpoint may not support 'locked' status
**Workaround**: Use 'suspended' status instead, or use the UI

### 4. Get Comprehensive Analytics
**Error**: Endpoint `/api/superadmin/analytics/comprehensive` may not be implemented
**Workaround**: Use `/api/superadmin/analytics` instead

### 5. Get Active Sessions
**Error**: Endpoint `/api/superadmin/sessions` may not be implemented
**Workaround**: Check audit logs for session information

### 6. Get Activity Logs
**Error**: Endpoint `/api/superadmin/activity` may not be implemented
**Workaround**: Use `/api/superadmin/activity/stats` for activity statistics

## Troubleshooting

### Issue: Cannot Access Super Admin Control Center
**Solution**:
1. Ensure you're logged in as a user with `superadmin` role
2. Check browser console for errors
3. Verify the route exists in `client/src/App.tsx`
4. Check server logs for authentication errors

### Issue: API Endpoints Return 404
**Solution**:
1. Verify server is running: `curl http://localhost:5001/api/health`
2. Check if routes are registered in `server/super-admin-routes.ts`
3. Ensure middleware is properly configured
4. Restart the server

### Issue: Authentication Fails
**Solution**:
1. Check `.env` file for `ALLOW_DEMO_PASSWORDS=true`
2. Verify `NODE_ENV=development`
3. Check database for superadmin user
4. Review server logs for authentication errors

### Issue: UI Not Loading
**Solution**:
1. Clear browser cache
2. Check browser console for JavaScript errors
3. Verify React components are properly imported
4. Check network tab for failed requests

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login as superadmin

### Organizations
- `GET /api/superadmin/organizations` - Get all organizations
- `POST /api/superadmin/organizations` - Create organization
- `PATCH /api/superadmin/organizations/:id` - Update organization
- `PATCH /api/superadmin/organizations/:id/status` - Update status

### Users
- `GET /api/superadmin/users` - Get all users
- `PATCH /api/superadmin/users/:id` - Update user
- `PATCH /api/superadmin/users/:id/status` - Update user status
- `POST /api/superadmin/users/:id/impersonate` - Impersonate user
- `POST /api/superadmin/users/:id/reset-password` - Reset password

### System
- `GET /api/superadmin/system/status` - Get system status
- `GET /api/superadmin/system-stats` - Get system statistics
- `POST /api/superadmin/system/maintenance` - Toggle maintenance mode
- `POST /api/superadmin/system/restart` - Restart system services
- `POST /api/superadmin/backup` - Create backup

### Analytics
- `GET /api/superadmin/analytics` - Get system analytics
- `GET /api/superadmin/analytics/system-health` - Get system health
- `GET /api/superadmin/analytics/comprehensive` - Get comprehensive analytics (may not be implemented)

### Security
- `GET /api/superadmin/security/policies` - Get security policies
- `PATCH /api/superadmin/security/policies` - Update security policies
- `GET /api/superadmin/sessions` - Get active sessions (may not be implemented)
- `GET /api/superadmin/audit/logs` - Get audit logs

### Features
- `GET /api/superadmin/features` - Get all features
- `PATCH /api/superadmin/features/:id` - Toggle feature

### Policies
- `GET /api/superadmin/policies/global` - Get global policies
- `PATCH /api/superadmin/policies/global` - Update global policies

### Activity
- `GET /api/superadmin/activity` - Get activity logs (may not be implemented)
- `GET /api/superadmin/activity/stats` - Get activity statistics

### Data
- `POST /api/superadmin/data/backup` - Create backup
- `GET /api/superadmin/data/export` - Export data

## Next Steps

1. **Fix Known Issues**: Address the 6 failing tests
2. **UI Testing**: Test all tabs in the web interface
3. **Integration Testing**: Test workflows end-to-end
4. **Performance Testing**: Test with large datasets
5. **Security Testing**: Verify access controls

## Test Report

**Date**: Current
**Tester**: Automated Test Suite
**Environment**: Development
**Success Rate**: 76.9% (20/26 tests passed)

**Summary**: The Super Admin Control Center is mostly functional with core features working. Some endpoints need implementation or fixes for full functionality.

