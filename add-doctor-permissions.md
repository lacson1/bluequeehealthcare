# How to Add Permissions to Doctor Role

## Method 1: Using the UI (Recommended)

1. **Navigate to Role Permissions Page**
   - Go to: http://localhost:5001/role-permissions
   - Or access via Admin menu → Role Management

2. **Select Doctor Role**
   - Click on "Doctor" from the roles list on the left

3. **Add Permissions**
   - Browse through permission categories
   - Check the boxes for permissions you want to add
   - Use "Select All" in a category for bulk selection

4. **Save Changes**
   - Click the "Save Changes" button
   - Confirm the changes

---

## Method 2: Using the API

### Step 1: Get Doctor Role ID
```bash
curl http://localhost:5001/api/access-control/roles \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  | jq '.[] | select(.name == "doctor") | .id'
```

### Step 2: Get All Available Permissions
```bash
curl http://localhost:5001/api/access-control/permissions \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  | jq '.[] | {id, name, description}'
```

### Step 3: Update Doctor Role Permissions
```bash
# Replace ROLE_ID with the doctor role ID (usually 1)
# Replace PERMISSION_IDS with array of permission IDs you want to add

curl -X PUT http://localhost:5001/api/access-control/roles/1/permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  -d '{
    "permissionIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
  }'
```

**Example: Adding specific permissions**
```bash
# Add "deletePatients" permission to doctor role
# First, find the permission ID for "deletePatients"
PERMISSION_ID=$(curl -s http://localhost:5001/api/access-control/permissions \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  | jq '.[] | select(.name == "deletePatients") | .id')

# Get current doctor permissions
CURRENT_PERMS=$(curl -s http://localhost:5001/api/access-control/roles/1 \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  | jq -r '.permissions[].id')

# Add new permission to existing ones
curl -X PUT http://localhost:5001/api/access-control/roles/1/permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .session_cookie 2>/dev/null || echo '')" \
  -d "{
    \"permissionIds\": [$CURRENT_PERMS, $PERMISSION_ID]
  }"
```

---

## Method 3: Using SQL (Direct Database)

### Step 1: Find Doctor Role ID
```sql
SELECT id, name FROM roles WHERE name = 'doctor';
-- Usually returns: id = 1
```

### Step 2: Find Permission IDs
```sql
-- List all available permissions
SELECT id, name, description FROM permissions ORDER BY name;

-- Find specific permission
SELECT id FROM permissions WHERE name = 'deletePatients';
```

### Step 3: Add Permission to Doctor Role
```sql
-- Add a single permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'doctor'),
  (SELECT id FROM permissions WHERE name = 'deletePatients')
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions 
  WHERE role_id = (SELECT id FROM roles WHERE name = 'doctor')
    AND permission_id = (SELECT id FROM permissions WHERE name = 'deletePatients')
);

-- Add multiple permissions at once
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'doctor'),
  id
FROM permissions 
WHERE name IN ('deletePatients', 'manageUsers', 'viewAuditLogs')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'doctor')
      AND rp.permission_id = permissions.id
  );
```

### View Current Doctor Permissions
```sql
SELECT 
  r.name as role,
  p.name as permission,
  p.description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'doctor'
ORDER BY p.name;
```

---

## Current Doctor Permissions (Default)

Based on `rbac_seed.sql`, doctors currently have:

- **Patients**: `viewPatients`, `editPatients`, `createPatients`
- **Visits**: `createVisit`, `viewVisits`, `editVisits`
- **Lab**: `createLabOrder`, `viewLabResults`, `editLabResults`
- **Consultations**: `createConsultation`, `viewConsultation`, `createConsultationForm`
- **Medications**: `viewMedications`, `createPrescription`, `viewPrescriptions`
- **Referrals**: `createReferral`, `viewReferrals`, `manageReferrals`
- **Appointments**: `viewAppointments`, `createAppointments`, `editAppointments`
- **Files**: `uploadFiles`, `viewFiles`
- **Dashboard**: `viewDashboard`, `viewReports`

---

## Common Permissions You Might Want to Add

- `deletePatients` - Delete patient records
- `manageUsers` - Manage staff members
- `viewAuditLogs` - View system audit logs
- `manageOrganizations` - Manage organization settings
- `cancelAppointments` - Cancel appointments
- `deleteFiles` - Delete uploaded files
- `manageMedications` - Manage medication database

---

## Troubleshooting

### Permission Not Showing Up
1. **Check if permission exists:**
   ```sql
   SELECT * FROM permissions WHERE name = 'permissionName';
   ```

2. **Check if already assigned:**
   ```sql
   SELECT * FROM role_permissions 
   WHERE role_id = (SELECT id FROM roles WHERE name = 'doctor')
     AND permission_id = (SELECT id FROM permissions WHERE name = 'permissionName');
   ```

3. **Clear cache** (if using frontend):
   - Refresh the page
   - Clear browser cache

### API Returns 403 Forbidden
- Make sure you're logged in as an admin or superadmin
- Check your session cookie is valid
- Verify your user has `manageUsers` permission

### Changes Not Taking Effect
- Users may need to log out and log back in
- Check if the user's role_id is correctly set
- Verify the role_permissions table was updated

---

## Quick Reference

**API Endpoint:**
```
PUT /api/access-control/roles/:id/permissions
```

**Request Body:**
```json
{
  "permissionIds": [1, 2, 3, ...]
}
```

**SQL Pattern:**
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM ...;
```

