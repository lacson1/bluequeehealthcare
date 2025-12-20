# Quick Fix: Assign Your Account to an Organization

## The Problem
Your account was created but not assigned to an organization. This happens when registering through the public signup form.

## Quick Solutions (Choose One)

### ✅ Option 1: Use Admin Panel (Easiest - If you have admin access)

1. **Log in as an admin user**
2. Navigate to **User Management** page (`/user-management` or `/super-admin-control`)
3. Find your username in the user list
4. Click **Edit** on your user account
5. Select an **Organization** from the dropdown
6. Click **Save** or **Update User**
7. **Log out and log back in** to refresh your session

### ✅ Option 2: Ask Another Admin

If you don't have admin access, ask someone with admin privileges to:
- Go to User Management
- Edit your account
- Assign you to an organization

### ✅ Option 3: Use the API (If you're an admin)

```bash
# First, get your user ID by checking your profile
# Then update your organization:
curl -X PATCH http://localhost:5000/api/users/YOUR_USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"organizationId": 1}'
```

### ✅ Option 4: Use Database Script (Recommended for Quick Fix)

```bash
# List users without organizations
node list-unassigned-users.mjs

# Assign yourself (replace with your username and org ID)
node fix-user-organization.mjs YOUR_USERNAME 1
```

**Example:**
```bash
# See who needs assignment
node list-unassigned-users.mjs

# Assign user "johndoe" to organization ID 1
node fix-user-organization.mjs johndoe 1
```

### ✅ Option 5: Direct SQL (Advanced)

```sql
-- Find your user ID
SELECT id, username, organization_id FROM users WHERE username = 'YOUR_USERNAME';

-- Find available organizations
SELECT id, name FROM organizations;

-- Update your organization
UPDATE users SET organization_id = 1 WHERE id = YOUR_USER_ID;
```

## After Assignment

1. **Log out completely**
2. **Log back in**
3. Your account should now have organization access

## Finding Your Organization ID

- Check the admin panel → Organizations section
- Or query: `SELECT id, name FROM organizations;`
- Usually the first organization is ID `1`

## Still Having Issues?

1. **Clear browser cache and cookies**
2. **Check browser console for errors**
3. **Verify the organization exists** in the database
4. **Check server logs** for any errors during assignment

## Need Help?

If you're stuck, provide:
- Your username
- Whether you have admin access
- Any error messages you see

