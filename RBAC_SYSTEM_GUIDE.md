# Role-Based Access Control (RBAC) System Guide

## Overview

ClinicConnect implements a comprehensive Role-Based Access Control (RBAC) system that allows fine-grained permission management across the platform. The system supports:

- **Predefined Roles**: Doctor, Nurse, Pharmacist, Physiotherapist, Admin, SuperAdmin
- **Custom Roles**: Create new roles with specific permission sets
- **Granular Permissions**: 30+ permissions covering all system features
- **Organization Scoping**: Roles and permissions can be scoped to specific organizations
- **Backward Compatibility**: Supports legacy role-based authentication
- **Audit Logging**: All role and permission changes are logged

---

## System Architecture

### Database Schema

#### 1. **Roles Table** (`roles`)
Stores role definitions.

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **Permissions Table** (`permissions`)
Stores available permissions.

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **Role-Permissions Junction Table** (`role_permissions`)
Maps permissions to roles.

```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) NOT NULL,
  permission_id INTEGER REFERENCES permissions(id) NOT NULL
);
```

#### 4. **Users Table** (Extended)
Links users to roles.

```sql
ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
-- Legacy column for backward compatibility
ALTER TABLE users ADD COLUMN role VARCHAR(20);
```

---

## Predefined Roles & Permissions

### 1. **Doctor**
**Permissions:**
- `viewPatients`, `editPatients`, `createPatients`
- `createVisit`, `viewVisits`, `editVisits`
- `createLabOrder`, `viewLabResults`, `editLabResults`
- `createConsultation`, `viewConsultation`, `createConsultationForm`
- `viewMedications`, `createPrescription`, `viewPrescriptions`
- `createReferral`, `viewReferrals`, `manageReferrals`
- `uploadFiles`, `viewFiles`
- `viewDashboard`, `viewReports`

### 2. **Nurse**
**Permissions:**
- `viewPatients`, `editPatients`, `createPatients`
- `createVisit`, `viewVisits`
- `createLabOrder`, `viewLabResults`
- `viewConsultation`
- `viewMedications`, `viewPrescriptions`
- `createReferral`, `viewReferrals`
- `uploadFiles`, `viewFiles`
- `viewDashboard`

### 3. **Pharmacist**
**Permissions:**
- `viewPatients`
- `viewMedications`, `manageMedications`, `viewPrescriptions`
- `viewFiles`
- `viewDashboard`

### 4. **Physiotherapist**
**Permissions:**
- `viewPatients`, `editPatients`
- `viewVisits`
- `createConsultation`, `viewConsultation`, `createConsultationForm`
- `viewReferrals`, `manageReferrals`
- `uploadFiles`, `viewFiles`
- `viewDashboard`

### 5. **Admin**
**Permissions:**
- All patient, visit, lab, consultation permissions
- `manageUsers`, `viewUsers`
- `viewOrganizations`
- All file permissions including `deleteFiles`
- `viewAuditLogs`

### 6. **SuperAdmin**
**Permissions:** ALL (full platform access across all organizations)

---

## Complete Permissions List

### Patient Management
- `viewPatients` - View patient data
- `editPatients` - Edit patient data
- `createPatients` - Create new patient profiles

### Visits & Consultations
- `createVisit` - Create patient visits
- `viewVisits` - View visit records
- `editVisits` - Edit visit records
- `createConsultation` - Create specialist consultations
- `viewConsultation` - View consultation records
- `createConsultationForm` - Create consultation form templates

### Laboratory
- `createLabOrder` - Create lab orders
- `viewLabResults` - View lab results
- `editLabResults` - Update lab results

### Medications & Prescriptions
- `viewMedications` - View prescribed medications
- `manageMedications` - Manage and dispense medications
- `createPrescription` - Create prescriptions
- `viewPrescriptions` - View prescription records

### Referrals
- `createReferral` - Create patient referrals
- `viewReferrals` - View referral records
- `manageReferrals` - Accept/reject referrals

### User Management
- `manageUsers` - Manage staff and user roles
- `viewUsers` - View staff information

### Organization Management
- `manageOrganizations` - Manage organization settings
- `viewOrganizations` - View organization information

### File Management
- `uploadFiles` - Upload files and documents
- `viewFiles` - View and download files
- `deleteFiles` - Delete files

### Dashboard & Analytics
- `viewDashboard` - Access the dashboard
- `viewReports` - View analytics and performance reports
- `viewAuditLogs` - View system audit logs

---

## API Endpoints

### Role Management

#### 1. Get All Roles
```http
GET /api/access-control/roles
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "doctor",
    "description": "Can view and edit patient data, consultations, and lab results",
    "createdAt": "2024-01-01T00:00:00Z",
    "userCount": 15,
    "permissions": [
      {
        "id": 1,
        "name": "viewPatients",
        "description": "View patient data"
      }
    ]
  }
]
```

#### 2. Get Single Role
```http
GET /api/access-control/roles/:id
Authorization: Bearer <token>
```

#### 3. Create New Role
```http
POST /api/access-control/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "lab_technician",
  "description": "Manages laboratory operations",
  "permissionIds": [26, 27, 28]
}
```

#### 4. Update Role Permissions
```http
PUT /api/access-control/roles/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionIds": [1, 2, 3, 4]
}
```

#### 5. Delete Role
```http
DELETE /api/access-control/roles/:id
Authorization: Bearer <token>
```

**Note:** Role cannot be deleted if users are assigned to it.

### Permission Management

#### 6. Get All Permissions
```http
GET /api/access-control/permissions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "all": [...],
  "grouped": {
    "patient": [...],
    "visit": [...],
    "lab": [...]
  }
}
```

### User Role Assignment

#### 7. Assign Role to User
```http
PUT /api/access-control/users/:userId/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": 1
}
```

#### 8. Get User Permissions
```http
GET /api/access-control/users/:userId/permissions
Authorization: Bearer <token>
```

#### 9. Bulk Assign Roles
```http
POST /api/access-control/bulk-assign-roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "userIds": [1, 2, 3, 4],
  "roleId": 2
}
```

#### 10. Get Staff with Roles
```http
GET /api/access-control/staff
Authorization: Bearer <token>
```

Returns all staff members in the organization with their roles and permissions.

---

## Backend Implementation

### 1. Permission Middleware

**Location:** `server/middleware/permissions.ts`

#### Check Permission Middleware
```typescript
import { checkPermission } from '../middleware/permissions';

// Protect route with specific permission
router.post('/patients', 
  authenticateToken,
  checkPermission('createPatients'),
  async (req, res) => {
    // Route handler
  }
);
```

#### Get User Permissions Helper
```typescript
import { getUserPermissions } from '../middleware/permissions';

const permissions = await getUserPermissions(userId);
// Returns: ['viewPatients', 'editPatients', ...]
```

### 2. Route Protection Examples

```typescript
// Single permission
router.post('/lab-orders',
  authenticateToken,
  checkPermission('createLabOrder'),
  handler
);

// Multiple permissions (user needs ANY of them)
router.get('/consultations',
  authenticateToken,
  checkPermission('viewConsultation'),
  handler
);
```

### 3. Custom Permission Checks

```typescript
async function customHandler(req: AuthRequest, res: Response) {
  const permissions = await getUserPermissions(req.user!.id);
  
  if (permissions.includes('manageUsers')) {
    // Allow action
  } else {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
}
```

---

## Frontend Implementation

### 1. Role Guard Component

**Location:** `client/src/components/role-guard.tsx`

#### Basic Usage
```tsx
import { RoleGuard } from '@/components/role-guard';

function AdminPanel() {
  return (
    <RoleGuard 
      allowedRoles={['admin', 'superadmin']}
      fallback={<AccessDenied />}
    >
      <AdminContent />
    </RoleGuard>
  );
}
```

### 2. useRole Hook

```tsx
import { useRole } from '@/components/role-guard';

function MyComponent() {
  const { 
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isDoctor,
    isNurse,
    isPharmacist
  } = useRole();
  
  if (isDoctor) {
    return <DoctorView />;
  }
  
  if (hasAnyRole(['nurse', 'doctor'])) {
    return <MedicalStaffView />;
  }
  
  return <DefaultView />;
}
```

### 3. Conditional Rendering

```tsx
function PatientProfile() {
  const { hasAnyRole } = useRole();
  
  return (
    <div>
      <PatientInfo />
      
      {hasAnyRole(['doctor', 'nurse']) && (
        <EditPatientButton />
      )}
      
      {hasRole('doctor') && (
        <PrescriptionSection />
      )}
    </div>
  );
}
```

### 4. Permission-Based UI

```tsx
function LabResults() {
  const { user } = useRole();
  
  const canEditResults = ['admin', 'doctor', 'nurse'].includes(user?.role || '');
  
  return (
    <div>
      <ResultsList />
      {canEditResults && <EditResultsForm />}
    </div>
  );
}
```

---

## Setup Instructions

### 1. Run RBAC Seed Script

```bash
# Execute the RBAC seed SQL file
psql -d clinicconnect -f rbac_seed.sql
```

This will:
- Create 6 default roles
- Insert 30+ permissions
- Map permissions to roles
- Display role summary

### 2. Migrate Existing Users (Optional)

If you have existing users with legacy roles:

```sql
-- Map legacy doctor role to new RBAC doctor role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'doctor')
WHERE role = 'doctor';

-- Repeat for other roles
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'nurse')
WHERE role = 'nurse';
```

### 3. Verify Installation

```sql
-- Check roles and permission counts
SELECT 
  r.name as role_name,
  r.description,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.description
ORDER BY r.id;
```

---

## Common Use Cases

### 1. Creating a Custom Role

```typescript
// Backend API call
const newRole = await fetch('/api/access-control/roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'receptionist',
    description: 'Front desk staff with limited access',
    permissionIds: [1, 2, 18, 19] // viewPatients, createPatients, viewFiles, viewDashboard
  })
});
```

### 2. Updating User Role

```typescript
// Assign doctor role to user
await fetch(`/api/access-control/users/${userId}/role`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roleId: 1 // doctor role ID
  })
});
```

### 3. Checking Permissions Before Action

```typescript
// Frontend
const userPermissions = await fetch(
  `/api/access-control/users/${user.id}/permissions`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
).then(r => r.json());

const canCreatePrescription = userPermissions.some(
  p => p.name === 'createPrescription'
);

if (canCreatePrescription) {
  // Show prescription form
}
```

### 4. Bulk Role Assignment

```typescript
// Assign nurse role to multiple users
await fetch('/api/access-control/bulk-assign-roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userIds: [5, 6, 7, 8],
    roleId: 2 // nurse role
  })
});
```

---

## Security Considerations

### 1. **Backward Compatibility**
The system maintains the legacy `role` column for backward compatibility. When checking permissions:
- First checks if user has admin/superadmin role (full access)
- Then checks RBAC permissions via `roleId`

### 2. **Organization Scoping**
- Non-superadmin users can only manage roles/users within their organization
- Superadmin has cross-organization access

### 3. **Audit Logging**
All role and permission changes are logged to `audit_logs` table with:
- User who made the change
- Action type (CREATE_ROLE, UPDATE_ROLE_PERMISSIONS, etc.)
- Timestamp
- IP address and user agent
- Detailed change information

### 4. **Role Deletion Protection**
- Roles cannot be deleted if users are currently assigned
- Must reassign users first

### 5. **Permission Validation**
- All protected routes use `checkPermission` middleware
- Invalid/missing permissions return 403 Forbidden
- Failed permission checks are logged

---

## Troubleshooting

### Users Can't Access Features

1. **Check User's Role Assignment**
```sql
SELECT id, username, role, role_id FROM users WHERE id = <user_id>;
```

2. **Verify Role Permissions**
```sql
SELECT p.name, p.description 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = <role_id>;
```

3. **Check Middleware Configuration**
Ensure routes are protected with `checkPermission`:
```typescript
router.post('/endpoint', 
  authenticateToken,
  checkPermission('requiredPermission'), // ← Must be present
  handler
);
```

### Permission Denied Errors

1. **Verify Token is Valid**
2. **Check User is Active**: `is_active = true`
3. **Confirm Organization Access** (for non-superadmins)
4. **Review Audit Logs** for recent permission changes

### Creating Custom Permissions

```sql
-- Add new permission
INSERT INTO permissions (name, description) 
VALUES ('customPermission', 'Description of permission');

-- Assign to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE name = 'customPermission';
```

---

## Migration Guide

### From Legacy Roles to RBAC

**Step 1:** Run seed script
```bash
psql -d clinicconnect -f rbac_seed.sql
```

**Step 2:** Map existing users
```sql
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role = r.name;
```

**Step 3:** Verify migration
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(role_id) as users_with_rbac_role,
  COUNT(*) - COUNT(role_id) as unmapped_users
FROM users;
```

**Step 4:** Update application code to use `checkPermission` middleware

**Step 5:** Test thoroughly before deploying to production

---

## Best Practices

1. **Use Granular Permissions**: Instead of checking roles, check specific permissions
   ```typescript
   // ❌ Bad
   if (user.role === 'doctor') { ... }
   
   // ✅ Good
   const permissions = await getUserPermissions(user.id);
   if (permissions.includes('createPrescription')) { ... }
   ```

2. **Protect All Routes**: Every API endpoint should have authentication and permission checks

3. **Log All Changes**: Use audit logging for compliance and debugging

4. **Regular Permission Audits**: Periodically review role permissions to ensure they're appropriate

5. **Principle of Least Privilege**: Only grant permissions necessary for the role

6. **Test Permission Boundaries**: Verify users cannot access unauthorized features

7. **Document Custom Roles**: If creating custom roles, document their purpose and permissions

---

## Examples

### Complete Example: Creating a Lab Technician Role

```typescript
// 1. Create the role via API
const createLabTechRole = async () => {
  const response = await fetch('/api/access-control/roles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'lab_technician',
      description: 'Laboratory technician with lab-specific permissions',
      permissionIds: [
        // Get permission IDs from GET /api/access-control/permissions
        1,  // viewPatients
        26, // createLabOrder
        27, // viewLabResults
        28, // editLabResults
        56, // viewFiles
        60  // viewDashboard
      ]
    })
  });
  
  return await response.json();
};

// 2. Assign role to users
const assignLabTechRole = async (userId: number, roleId: number) => {
  await fetch(`/api/access-control/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ roleId })
  });
};

// 3. Use in frontend
function LabTechDashboard() {
  const { user } = useRole();
  
  return (
    <RoleGuard allowedRoles={['lab_technician', 'admin']}>
      <LabManagementSystem />
    </RoleGuard>
  );
}

// 4. Protect backend routes
router.post('/lab-results',
  authenticateToken,
  checkPermission('editLabResults'),
  async (req, res) => {
    // Handle lab result entry
  }
);
```

---

## Support

For additional help:
- Review `server/middleware/permissions.ts` for middleware implementation
- Check `server/routes/access-control.ts` for API endpoints
- See `rbac_seed.sql` for complete permission list
- Examine `client/src/components/role-guard.tsx` for frontend usage

## Related Documentation

- [ADMIN_INSTALLATION_GUIDE.md](./ADMIN_INSTALLATION_GUIDE.md) - Admin setup
- [API_GUIDE.md](./API_GUIDE.md) - API documentation
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - General setup instructions

