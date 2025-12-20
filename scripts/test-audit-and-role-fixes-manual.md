# Manual Testing Guide for Audit and Role Fixes

Since automated tests require database access, here's a manual testing guide.

## Prerequisites

1. **Database must be running**
2. **Set DATABASE_URL** in `.env` file
3. **Server should be running** (or tests will use direct DB access)

---

## Test 1: Audit Logging - Skip Superadmin (ID: 999)

### Steps:
1. Start your server: `npm run dev`
2. Make an API request as superadmin (ID: 999) - if you have fallback auth enabled
3. Check server logs - should see: `⚠️ AUDIT WARNING: Skipping audit log for fallback superadmin`
4. Check database - no audit log should be created

### SQL Verification:
```sql
-- Should return 0 rows for user_id = 999
SELECT * FROM audit_logs WHERE user_id = 999 ORDER BY timestamp DESC LIMIT 10;
```

### Expected Result:
✅ No audit logs for user ID 999

---

## Test 2: Audit Logging - Skip Users Without Roles

### Steps:
1. Find a user without a role (or create one temporarily):
   ```sql
   -- Find users without roles
   SELECT id, username, role FROM users 
   WHERE role IS NULL OR role = '' OR TRIM(role) = '';
   ```

2. If none exist, create a test user:
   ```sql
   INSERT INTO users (username, password, role, organization_id, is_active)
   VALUES ('test_no_role', 'hash', '', 1, true)
   RETURNING id, username, role;
   ```

3. Make an API request as that user
4. Check server logs - should see: `⚠️ AUDIT WARNING: User X has no role assigned`
5. Check database - no audit log should be created

### SQL Verification:
```sql
-- Get the test user ID
SELECT id FROM users WHERE username = 'test_no_role';

-- Check audit logs (replace X with user ID)
SELECT * FROM audit_logs WHERE user_id = X ORDER BY timestamp DESC LIMIT 10;
```

### Expected Result:
✅ No new audit logs for users without roles

---

## Test 3: User Creation - Role Required

### Steps:
1. Try to create a user without a role via API:
   ```bash
   curl -X POST http://localhost:5001/api/users \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "username": "testuser",
       "password": "testpass123",
       "organizationId": 1
     }'
   ```

2. **Expected Response:** 400 Bad Request
   ```json
   {
     "error": "Valid role is required and cannot be empty"
   }
   ```

3. Try with empty role:
   ```bash
   curl -X POST http://localhost:5001/api/users \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "username": "testuser",
       "password": "testpass123",
       "role": "",
       "organizationId": 1
     }'
   ```

4. **Expected Response:** 400 Bad Request

### Expected Result:
✅ Cannot create users without roles

---

## Test 4: User Update - Cannot Remove Role

### Steps:
1. Get an existing user ID
2. Try to update user to remove role:
   ```bash
   curl -X PATCH http://localhost:5001/api/users/USER_ID \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "role": ""
     }'
   ```

3. **Expected Response:** 400 Bad Request
   ```json
   {
     "message": "Role cannot be empty. User must have a valid role assigned."
   }
   ```

### Expected Result:
✅ Cannot update users to remove roles

---

## Test 5: Fix Users Without Roles Script

### Steps:
1. Run the fix script:
   ```bash
   npx tsx scripts/fix-users-without-roles.ts
   ```

2. **Expected Output:**
   ```
   🔍 Finding users without roles...
   ⚠️  Found X user(s) without roles:
      1. ID: Y, Username: username, Email: email
   🔧 Assigning default role 'staff' to X user(s)...
   ✅ Successfully fixed X user(s):
      1. ID: Y, Username: username, New Role: staff
   ✅ Verification passed: All users have roles assigned.
   ```

3. Verify in database:
   ```sql
   -- Should return 0 rows
   SELECT id, username, role FROM users 
   WHERE role IS NULL OR role = '' OR TRIM(role) = '';
   ```

### Expected Result:
✅ All users have roles assigned

---

## Test 6: Verify Audit Logs Show Correct Users

### Steps:
1. Perform some actions as different users
2. Check audit logs:
   ```sql
   SELECT 
     al.id,
     al.user_id,
     u.username,
     u.role,
     al.action,
     al.entity_type,
     al.timestamp
   FROM audit_logs al
   LEFT JOIN users u ON al.user_id = u.id
   ORDER BY al.timestamp DESC
   LIMIT 20;
   ```

3. **Verify:**
   - ✅ No user_id = 999 (superadmin)
   - ✅ All users have roles
   - ✅ Username and role are populated

### Expected Result:
✅ Audit logs show correct users with roles

---

## Test 7: Check Server Logs

### Steps:
1. Check server console/logs for warnings:
   ```bash
   # If running in terminal, watch for:
   # ⚠️ AUDIT WARNING: Skipping audit log for fallback superadmin
   # ⚠️ AUDIT WARNING: User X has no role assigned
   ```

2. Look for audit log entries:
   ```
   🔍 AUDIT: Action by user X (username, role: role) on entity_type
   ```

### Expected Result:
✅ Warnings for invalid users, proper logging for valid users

---

## Summary Checklist

- [ ] Test 1: Audit logs skip superadmin (ID: 999)
- [ ] Test 2: Audit logs skip users without roles
- [ ] Test 3: Cannot create users without roles
- [ ] Test 4: Cannot update users to remove roles
- [ ] Test 5: Fix script works correctly
- [ ] Test 6: Audit logs show correct users
- [ ] Test 7: Server logs show proper warnings

---

## Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Or check .env file
cat .env | grep DATABASE_URL
```

### No Users Found
```sql
-- Check if users exist
SELECT COUNT(*) FROM users;

-- If 0, you may need to seed the database first
```

### Script Fails
- Ensure database is running
- Check DATABASE_URL is correct
- Verify user has permissions to read/write users table

---

## Quick Test Commands

```bash
# 1. Check users without roles
psql $DATABASE_URL -c "SELECT id, username, role FROM users WHERE role IS NULL OR role = '' OR TRIM(role) = '';"

# 2. Check audit logs for superadmin
psql $DATABASE_URL -c "SELECT COUNT(*) FROM audit_logs WHERE user_id = 999;"

# 3. Check recent audit logs
psql $DATABASE_URL -c "SELECT al.user_id, u.username, u.role, al.action FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.timestamp DESC LIMIT 10;"

# 4. Run fix script
npx tsx scripts/fix-users-without-roles.ts
```

