# RBAC Quick Reference Guide

## 🚀 Quick Start

### Check if RBAC is Set Up
```sql
SELECT COUNT(*) FROM roles;
-- Should return 6 (doctor, nurse, pharmacist, physiotherapist, admin, superadmin)
```

### Initialize RBAC
```bash
psql -d clinicconnect -f rbac_seed.sql
```

---

## 📋 Common Tasks

### 1. Create a Custom Role

**API Call:**
```bash
curl -X POST http://localhost:5000/api/access-control/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "receptionist",
    "description": "Front desk staff",
    "permissionIds": [1, 2, 60]
  }'
```

**Frontend:**
```tsx
const response = await fetch('/api/access-control/roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'receptionist',
    description: 'Front desk staff',
    permissionIds: [1, 2, 60]
  })
});
```

### 2. Assign Role to User

**API Call:**
```bash
curl -X PUT http://localhost:5000/api/access-control/users/5/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId": 1}'
```

**SQL:**
```sql
UPDATE users SET role_id = 1 WHERE id = 5;
```

### 3. Check User Permissions

**API Call:**
```bash
curl http://localhost:5000/api/access-control/users/5/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Backend:**
```typescript
import { getUserPermissions } from '../middleware/permissions';

const permissions = await getUserPermissions(userId);
// Returns: ['viewPatients', 'createVisit', ...]
```

### 4. Protect a Route

**Backend:**
```typescript
import { checkPermission } from '../middleware/permissions';

router.post('/patients',
  authenticateToken,
  checkPermission('createPatients'),
  async (req, res) => {
    // Handler
  }
);
```

### 5. Frontend Role Check

**Component:**
```tsx
import { RoleGuard } from '@/components/role-guard';

<RoleGuard allowedRoles={['doctor', 'nurse']}>
  <MedicalStaffContent />
</RoleGuard>
```

**Hook:**
```tsx
import { useRole } from '@/components/role-guard';

const { isDoctor, hasAnyRole } = useRole();

{isDoctor && <PrescriptionForm />}
{hasAnyRole(['doctor', 'nurse']) && <EditButton />}
```

---

## 🔑 Permission Reference

### Quick Permission Lookup

| Category | Permissions |
|----------|-------------|
| **Patients** | `viewPatients`, `editPatients`, `createPatients` |
| **Visits** | `createVisit`, `viewVisits`, `editVisits` |
| **Lab** | `createLabOrder`, `viewLabResults`, `editLabResults` |
| **Consultations** | `createConsultation`, `viewConsultation`, `createConsultationForm` |
| **Medications** | `viewMedications`, `manageMedications`, `createPrescription`, `viewPrescriptions` |
| **Referrals** | `createReferral`, `viewReferrals`, `manageReferrals` |
| **Users** | `manageUsers`, `viewUsers` |
| **Organizations** | `manageOrganizations`, `viewOrganizations` |
| **Files** | `uploadFiles`, `viewFiles`, `deleteFiles` |
| **Analytics** | `viewDashboard`, `viewReports`, `viewAuditLogs` |

---

## 👥 Role Permission Matrix

| Permission | Doctor | Nurse | Pharmacist | Physiotherapist | Admin |
|------------|--------|-------|------------|-----------------|-------|
| View Patients | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Patients | ✅ | ✅ | ❌ | ✅ | ✅ |
| Create Patients | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create Visit | ✅ | ✅ | ❌ | ❌ | ✅ |
| View Lab Results | ✅ | ✅ | ❌ | ❌ | ✅ |
| Edit Lab Results | ✅ | ❌ | ❌ | ❌ | ✅ |
| Create Prescription | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage Medications | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create Consultation | ✅ | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ SQL Snippets

### List All Roles with Permissions
```sql
SELECT 
  r.name as role,
  p.name as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.name;
```

### Find Users Without RBAC Role
```sql
SELECT id, username, role, role_id 
FROM users 
WHERE role_id IS NULL;
```

### Add Permission to Role
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'nurse'),
  (SELECT id FROM permissions WHERE name = 'editVisits');
```

### Remove Permission from Role
```sql
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'nurse')
  AND permission_id = (SELECT id FROM permissions WHERE name = 'editVisits');
```

### Get User's Permissions
```sql
SELECT DISTINCT p.name
FROM users u
JOIN role_permissions rp ON u.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 5;
```

### Count Users per Role
```sql
SELECT 
  r.name,
  COUNT(u.id) as user_count
FROM roles r
LEFT JOIN users u ON r.id = u.role_id
GROUP BY r.id, r.name
ORDER BY user_count DESC;
```

---

## 🎯 API Endpoints Cheat Sheet

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/access-control/roles` | List all roles | Yes |
| GET | `/api/access-control/roles/:id` | Get role details | Yes |
| POST | `/api/access-control/roles` | Create new role | Admin |
| PUT | `/api/access-control/roles/:id/permissions` | Update role permissions | Admin |
| DELETE | `/api/access-control/roles/:id` | Delete role | Admin |
| GET | `/api/access-control/permissions` | List all permissions | Yes |
| PUT | `/api/access-control/users/:userId/role` | Assign role to user | Admin |
| GET | `/api/access-control/users/:userId/permissions` | Get user permissions | Yes |
| POST | `/api/access-control/bulk-assign-roles` | Bulk assign roles | Admin |
| GET | `/api/access-control/staff` | Get staff with roles | Yes |

---

## 🐛 Troubleshooting

### User Can't Access Feature

**Check 1: User has role assigned**
```sql
SELECT username, role, role_id FROM users WHERE id = <user_id>;
```

**Check 2: Role has required permission**
```sql
SELECT p.name 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = <role_id>;
```

**Check 3: Route is protected**
```typescript
// Ensure middleware is present
router.post('/endpoint',
  authenticateToken,              // ✅ Required
  checkPermission('permission'),  // ✅ Required
  handler
);
```

### Permission Denied Despite Having Role

**Possible Causes:**
1. User's `is_active` is false
2. User belongs to different organization
3. Token is expired
4. Permission name mismatch in code

**Debug:**
```typescript
const permissions = await getUserPermissions(userId);
console.log('User permissions:', permissions);
```

### Role Won't Delete

**Error:** "Cannot delete role: N user(s) currently assigned"

**Solution:**
```sql
-- Find users with this role
SELECT id, username FROM users WHERE role_id = <role_id>;

-- Reassign them first
UPDATE users SET role_id = <new_role_id> WHERE role_id = <old_role_id>;

-- Then delete
DELETE FROM roles WHERE id = <old_role_id>;
```

---

## 📚 Code Examples

### Backend: Custom Permission Check

```typescript
import { getUserPermissions } from '../middleware/permissions';

async function customHandler(req: AuthRequest, res: Response) {
  const permissions = await getUserPermissions(req.user!.id);
  
  const canEdit = permissions.includes('editPatients');
  const canDelete = permissions.includes('deletePatients');
  
  if (!canEdit) {
    return res.status(403).json({ message: 'Cannot edit patients' });
  }
  
  // Proceed with action
}
```

### Frontend: Conditional Button

```tsx
function PatientCard({ patient }) {
  const { user } = useRole();
  const [permissions, setPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    fetch(`/api/access-control/users/${user.id}/permissions`)
      .then(r => r.json())
      .then(perms => setPermissions(perms.map(p => p.name)));
  }, [user.id]);
  
  const canEdit = permissions.includes('editPatients');
  
  return (
    <div>
      <PatientInfo patient={patient} />
      {canEdit && <EditButton />}
    </div>
  );
}
```

### Frontend: Multiple Role Check

```tsx
function DashboardHeader() {
  const { hasAnyRole } = useRole();
  
  const isMedicalStaff = hasAnyRole(['doctor', 'nurse', 'physiotherapist']);
  const isAdminStaff = hasAnyRole(['admin', 'superadmin']);
  
  return (
    <header>
      <h1>Dashboard</h1>
      {isMedicalStaff && <MedicalMenu />}
      {isAdminStaff && <AdminMenu />}
    </header>
  );
}
```

---

## 🔐 Security Best Practices

1. ✅ **Always use `checkPermission` middleware on protected routes**
2. ✅ **Check permissions, not roles** (more granular)
3. ✅ **Log all role/permission changes** (audit trail)
4. ✅ **Use organization scoping** (multi-tenant)
5. ✅ **Validate tokens** (authentication)
6. ✅ **Apply principle of least privilege** (minimal permissions)
7. ❌ **Never expose permission checks to client** (server-side only)
8. ❌ **Don't hardcode role names** (use constants)

---

## 🎨 Frontend Patterns

### Pattern 1: Role-Based Navigation

```tsx
function AppNavigation() {
  const { isDoctor, isNurse, isPharmacist, isAdmin } = useRole();
  
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      {(isDoctor || isNurse) && <Link to="/patients">Patients</Link>}
      {isDoctor && <Link to="/prescriptions">Prescriptions</Link>}
      {isPharmacist && <Link to="/pharmacy">Pharmacy</Link>}
      {isAdmin && <Link to="/admin">Administration</Link>}
    </nav>
  );
}
```

### Pattern 2: Permission-Based Features

```tsx
function PatientProfile() {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    fetchUserPermissions().then(perms => 
      setPermissions(new Set(perms.map(p => p.name)))
    );
  }, []);
  
  return (
    <div>
      <PatientInfo />
      
      {permissions.has('editPatients') && <EditForm />}
      {permissions.has('createVisit') && <NewVisitButton />}
      {permissions.has('viewLabResults') && <LabResults />}
      {permissions.has('createPrescription') && <PrescriptionForm />}
    </div>
  );
}
```

### Pattern 3: Fallback UI

```tsx
<RoleGuard 
  allowedRoles={['doctor', 'admin']}
  fallback={
    <Card>
      <CardHeader>
        <CardTitle>Access Restricted</CardTitle>
      </CardHeader>
      <CardContent>
        You don't have permission to view this content.
      </CardContent>
    </Card>
  }
>
  <SensitiveContent />
</RoleGuard>
```

---

## 📊 Performance Tips

1. **Cache user permissions** - Fetch once per session
2. **Use indices** on `role_id` columns
3. **Batch permission checks** - Get all permissions at once
4. **Minimize database calls** - Cache role-permission mappings

```typescript
// ✅ Good: Single query
const permissions = await getUserPermissions(userId);
const canView = permissions.includes('viewPatients');
const canEdit = permissions.includes('editPatients');

// ❌ Bad: Multiple queries
const canView = await checkUserPermission(userId, 'viewPatients');
const canEdit = await checkUserPermission(userId, 'editPatients');
```

---

## 🔗 Related Files

- **Backend Middleware:** `server/middleware/permissions.ts`
- **Backend Routes:** `server/routes/access-control.ts`
- **Frontend Components:** `client/src/components/role-guard.tsx`
- **Database Schema:** `shared/schema.ts`
- **Seed Script:** `rbac_seed.sql`
- **Full Guide:** `RBAC_SYSTEM_GUIDE.md`

---

## 💡 Common Patterns Summary

```typescript
// Backend: Protect route
router.post('/endpoint', 
  authenticateToken, 
  checkPermission('permissionName'), 
  handler
);

// Backend: Get permissions
const perms = await getUserPermissions(userId);

// Frontend: Guard component
<RoleGuard allowedRoles={['doctor']}>
  <Content />
</RoleGuard>

// Frontend: Hook
const { isDoctor, hasAnyRole } = useRole();

// SQL: Add permission to role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name = 'editVisits';
```

---

**Need more details?** See [RBAC_SYSTEM_GUIDE.md](./RBAC_SYSTEM_GUIDE.md) for comprehensive documentation.

