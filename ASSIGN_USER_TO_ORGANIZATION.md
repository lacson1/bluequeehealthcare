# How to Assign a User to an Organization

## Problem
When users register through the public registration endpoint (`/api/auth/register`), their `organizationId` is set to `null` by design. This means they need to be manually assigned to an organization by an administrator.

## Solutions

### Option 1: Using the Admin Panel (Recommended)
1. Log in as an admin user
2. Navigate to **User Management** or **Staff Management**
3. Find the user without an organization
4. Edit the user and assign them to an organization
5. Save the changes

### Option 2: Using the API (Admin Access Required)

#### Method A: Update User Directly
```bash
# Update user's organizationId
curl -X PATCH http://localhost:5000/api/users/{userId} \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "organizationId": 1
  }'
```

#### Method B: Add User to Organization
```bash
# Add user to organization via organization endpoint
curl -X POST http://localhost:5000/api/organizations/add-staff \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "userId": 123,
    "organizationId": 1,
    "setAsDefault": true
  }'
```

### Option 3: Using Database Scripts

#### Step 1: List Users Without Organization
```bash
node list-users-without-organization.js
```

This will show all users that don't have an organization assigned.

#### Step 2: Assign User to Organization
```bash
node assign-user-to-organization.js <username> <organizationId>
```

**Example:**
```bash
node assign-user-to-organization.js johndoe 1
```

### Option 4: Direct Database Update (Advanced)

If you have direct database access:

```sql
-- First, find the user ID
SELECT id, username, organization_id FROM users WHERE username = 'johndoe';

-- Then update the organization
UPDATE users 
SET organization_id = 1 
WHERE id = <user_id>;

-- Verify the update
SELECT id, username, organization_id FROM users WHERE id = <user_id>;
```

## Finding Your Organization ID

To find available organizations:

1. **Via Admin Panel**: Go to Organization Settings
2. **Via API**: 
   ```bash
   curl http://localhost:5000/api/organizations \
     -H "Cookie: your-session-cookie"
   ```
3. **Via Database**:
   ```sql
   SELECT id, name, type FROM organizations;
   ```

## Important Notes

- Only **admin**, **superadmin**, or **super_admin** users can assign users to organizations
- Users must be assigned to an organization to access most features
- The system supports multi-organization membership via the `user_organizations` table
- When assigning via API, ensure you're authenticated with admin privileges

## Troubleshooting

### User Still Shows No Organization After Assignment
1. **Log out and log back in** - The session may need to refresh
2. **Check the database directly** - Verify `organization_id` is set in the `users` table
3. **Check user_organizations table** - For multi-org support, entries may be in `user_organizations` table

### Permission Denied Errors
- Ensure you're logged in as an admin user
- Check that your session cookie is valid
- Verify your role has permission to manage users

### Organization Not Found
- Verify the organization ID exists
- Check that you have access to that organization
- Ensure the organization is active

## Related Files

- `server/routes/auth.ts` - Registration endpoint (sets organizationId to null)
- `server/routes/users.ts` - User update endpoint (can set organizationId)
- `server/routes/organizations.ts` - Organization staff management
- `shared/schema.ts` - Database schema definitions

