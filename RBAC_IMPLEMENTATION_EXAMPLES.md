# RBAC Implementation Examples

A practical guide with real-world examples for implementing role-based permissions in ClinicConnect.

---

## Table of Contents

1. [Backend Examples](#backend-examples)
2. [Frontend Examples](#frontend-examples)
3. [Database Operations](#database-operations)
4. [Real-World Scenarios](#real-world-scenarios)
5. [Testing Permissions](#testing-permissions)
6. [Common Mistakes](#common-mistakes)

---

## Backend Examples

### Example 1: Simple Route Protection

Protect a route to allow only users with specific permission:

```typescript
// server/routes/patients.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = Router();

// Only users with 'createPatients' permission can access
router.post('/patients',
  authenticateToken,
  checkPermission('createPatients'),
  async (req: AuthRequest, res: Response) => {
    try {
      const patient = await db.insert(patients)
        .values(req.body)
        .returning();
      
      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create patient' });
    }
  }
);

export default router;
```

### Example 2: Multiple Permission Checks

Check for multiple permissions in the handler:

```typescript
// server/routes/consultations.ts
router.post('/consultations',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    // Get user's permissions
    const permissions = await getUserPermissions(req.user!.id);
    
    // Check if user has required permission
    if (!permissions.includes('createConsultation')) {
      return res.status(403).json({ 
        message: 'You do not have permission to create consultations' 
      });
    }
    
    // Check for additional specialist permission if needed
    if (req.body.type === 'specialist') {
      if (!permissions.includes('createConsultationForm')) {
        return res.status(403).json({ 
          message: 'You do not have permission to create specialist consultations' 
        });
      }
    }
    
    // Proceed with consultation creation
    const consultation = await db.insert(consultations)
      .values(req.body)
      .returning();
    
    res.status(201).json(consultation);
  }
);
```

### Example 3: Organization-Scoped Access

Ensure users can only access resources in their organization:

```typescript
// server/routes/staff.ts
router.get('/staff/:id',
  authenticateToken,
  checkPermission('viewUsers'),
  async (req: AuthRequest, res: Response) => {
    const staffId = parseInt(req.params.id);
    
    // Build query with organization scoping
    const query = req.user!.role === 'superadmin'
      ? eq(users.id, staffId)  // Superadmin sees all
      : and(
          eq(users.id, staffId),
          eq(users.organizationId, req.user!.organizationId!)
        );
    
    const [staff] = await db
      .select()
      .from(users)
      .where(query);
    
    if (!staff) {
      return res.status(404).json({ 
        message: 'Staff member not found or access denied' 
      });
    }
    
    res.json(staff);
  }
);
```

### Example 4: Permission-Based Data Filtering

Return different data based on user permissions:

```typescript
// server/routes/patients.ts
router.get('/patients/:id',
  authenticateToken,
  checkPermission('viewPatients'),
  async (req: AuthRequest, res: Response) => {
    const patientId = parseInt(req.params.id);
    const permissions = await getUserPermissions(req.user!.id);
    
    // Get patient data
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId));
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Build response based on permissions
    const response: any = {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender
    };
    
    // Include sensitive data only if user has edit permission
    if (permissions.includes('editPatients')) {
      response.phone = patient.phone;
      response.email = patient.email;
      response.address = patient.address;
      response.allergies = patient.allergies;
      response.medicalHistory = patient.medicalHistory;
    }
    
    res.json(response);
  }
);
```

### Example 5: Custom Permission Helper

Create reusable permission check function:

```typescript
// server/utils/permission-helpers.ts
import { getUserPermissions } from '../middleware/permissions';
import type { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

export async function requirePermissions(
  req: AuthRequest,
  res: Response,
  requiredPermissions: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(req.user!.id);
  
  const hasAllPermissions = requiredPermissions.every(
    perm => userPermissions.includes(perm)
  );
  
  if (!hasAllPermissions) {
    res.status(403).json({
      message: 'Insufficient permissions',
      required: requiredPermissions,
      missing: requiredPermissions.filter(p => !userPermissions.includes(p))
    });
    return false;
  }
  
  return true;
}

// Usage
router.post('/prescriptions',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    // Check multiple permissions
    const hasPermission = await requirePermissions(req, res, [
      'createPrescription',
      'viewPatients'
    ]);
    
    if (!hasPermission) return; // Response already sent
    
    // Proceed with prescription creation
  }
);
```

---

## Frontend Examples

### Example 1: Role-Based Component Rendering

Show/hide components based on user role:

```tsx
// client/src/pages/dashboard.tsx
import { RoleGuard, useRole } from '@/components/role-guard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const { isDoctor, isNurse, isAdmin, hasAnyRole } = useRole();
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Show to doctors only */}
      {isDoctor && (
        <Card>
          <CardHeader>
            <CardTitle>My Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientList />
          </CardContent>
        </Card>
      )}
      
      {/* Show to medical staff */}
      {hasAnyRole(['doctor', 'nurse']) && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentList />
          </CardContent>
        </Card>
      )}
      
      {/* Show to admin only */}
      <RoleGuard allowedRoles={['admin', 'superadmin']}>
        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemStats />
          </CardContent>
        </Card>
      </RoleGuard>
    </div>
  );
}
```

### Example 2: Permission-Based Button Visibility

Show action buttons based on user permissions:

```tsx
// client/src/components/patient-card.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface PatientCardProps {
  patient: any;
}

export function PatientCard({ patient }: PatientCardProps) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    // Fetch user permissions
    fetch(`/api/access-control/users/${user?.id}/permissions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(perms => setPermissions(perms.map((p: any) => p.name)));
  }, [user?.id]);
  
  const canEdit = permissions.includes('editPatients');
  const canCreateVisit = permissions.includes('createVisit');
  const canPrescribe = permissions.includes('createPrescription');
  
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">
        {patient.firstName} {patient.lastName}
      </h3>
      
      <div className="mt-4 space-x-2">
        <Button variant="outline">View</Button>
        
        {canEdit && (
          <Button variant="default">Edit</Button>
        )}
        
        {canCreateVisit && (
          <Button variant="default">Record Visit</Button>
        )}
        
        {canPrescribe && (
          <Button variant="default">New Prescription</Button>
        )}
      </div>
    </div>
  );
}
```

### Example 3: Custom Permission Hook

Create a reusable hook for permission checking:

```tsx
// client/src/hooks/usePermissions.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    
    fetch(`/api/access-control/users/${user.id}/permissions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(perms => {
        setPermissions(perms.map((p: any) => p.name));
        setLoading(false);
      })
      .catch(() => {
        setPermissions([]);
        setLoading(false);
      });
  }, [user?.id]);
  
  const hasPermission = (permission: string) => permissions.includes(permission);
  
  const hasAnyPermission = (perms: string[]) => 
    perms.some(p => permissions.includes(p));
  
  const hasAllPermissions = (perms: string[]) => 
    perms.every(p => permissions.includes(p));
  
  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}

// Usage
function PatientProfile() {
  const { hasPermission, loading } = usePermissions();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <PatientInfo />
      
      {hasPermission('editPatients') && <EditForm />}
      {hasPermission('createPrescription') && <PrescriptionForm />}
    </div>
  );
}
```

### Example 4: Conditional Navigation Menu

Build navigation based on user permissions:

```tsx
// client/src/components/sidebar.tsx
import { useRole } from '@/components/role-guard';
import { Link } from 'wouter';
import { 
  Home, Users, TestTube, FileText, 
  Settings, ShieldCheck 
} from 'lucide-react';

export function Sidebar() {
  const { user, isDoctor, isNurse, isPharmacist, isAdmin } = useRole();
  
  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      show: true // All users
    },
    {
      label: 'Patients',
      icon: Users,
      path: '/patients',
      show: isDoctor || isNurse || isAdmin
    },
    {
      label: 'Lab Results',
      icon: TestTube,
      path: '/lab-results',
      show: isDoctor || isNurse || isAdmin
    },
    {
      label: 'Prescriptions',
      icon: FileText,
      path: '/prescriptions',
      show: isDoctor || isAdmin
    },
    {
      label: 'Pharmacy',
      icon: FileText,
      path: '/pharmacy',
      show: isPharmacist || isAdmin
    },
    {
      label: 'User Management',
      icon: ShieldCheck,
      path: '/users',
      show: isAdmin
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      show: true // All users
    }
  ];
  
  return (
    <aside className="w-64 bg-gray-900 text-white">
      <nav className="p-4 space-y-2">
        {menuItems
          .filter(item => item.show)
          .map(item => (
            <Link key={item.path} href={item.path}>
              <a className="flex items-center gap-3 p-3 rounded hover:bg-gray-800">
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          ))
        }
      </nav>
    </aside>
  );
}
```

### Example 5: Permission-Based Form Fields

Show/hide form fields based on permissions:

```tsx
// client/src/components/patient-form.tsx
import { usePermissions } from '@/hooks/usePermissions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function PatientForm() {
  const { hasPermission } = usePermissions();
  
  return (
    <form className="space-y-4">
      {/* Basic info - everyone can see */}
      <div>
        <Label>First Name</Label>
        <Input name="firstName" required />
      </div>
      
      <div>
        <Label>Last Name</Label>
        <Input name="lastName" required />
      </div>
      
      {/* Sensitive info - only with edit permission */}
      {hasPermission('editPatients') && (
        <>
          <div>
            <Label>Phone</Label>
            <Input name="phone" type="tel" />
          </div>
          
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" />
          </div>
          
          <div>
            <Label>Address</Label>
            <Textarea name="address" />
          </div>
        </>
      )}
      
      {/* Medical history - only doctors */}
      {hasPermission('editVisits') && (
        <>
          <div>
            <Label>Allergies</Label>
            <Textarea name="allergies" />
          </div>
          
          <div>
            <Label>Medical History</Label>
            <Textarea name="medicalHistory" rows={5} />
          </div>
        </>
      )}
    </form>
  );
}
```

---

## Database Operations

### Example 1: Create Custom Role

```sql
-- Create a new "Receptionist" role
INSERT INTO roles (name, description)
VALUES ('receptionist', 'Front desk staff with patient registration access');

-- Get the role ID
SELECT id FROM roles WHERE name = 'receptionist';
-- Let's say it returns id = 7

-- Assign permissions to the role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 7, id FROM permissions WHERE name IN (
  'viewPatients',
  'createPatients',
  'viewFiles',
  'uploadFiles',
  'viewDashboard'
);

-- Verify permissions
SELECT p.name, p.description
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 7;
```

### Example 2: Migrate User to RBAC

```sql
-- Find users still using legacy role system
SELECT id, username, role, role_id
FROM users
WHERE role_id IS NULL;

-- Assign RBAC roles based on legacy roles
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'doctor')
WHERE role = 'doctor' AND role_id IS NULL;

UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'nurse')
WHERE role = 'nurse' AND role_id IS NULL;

-- Verify migration
SELECT 
  u.id,
  u.username,
  u.role as legacy_role,
  r.name as rbac_role
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.role_id IS NOT NULL;
```

### Example 3: Add New Permission

```sql
-- Add a new permission
INSERT INTO permissions (name, description)
VALUES ('deletePatients', 'Delete patient records');

-- Assign to admin role only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r, permissions p
WHERE r.name = 'admin' 
  AND p.name = 'deletePatients';

-- Verify
SELECT r.name as role, p.name as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'deletePatients';
```

### Example 4: Audit User Permissions

```sql
-- Get all permissions for a specific user
SELECT DISTINCT
  u.username,
  r.name as role,
  p.name as permission,
  p.description
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 5
ORDER BY p.name;

-- Count permissions per user
SELECT 
  u.id,
  u.username,
  r.name as role,
  COUNT(p.id) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY u.id, u.username, r.name
ORDER BY permission_count DESC;
```

---

## Real-World Scenarios

### Scenario 1: Lab Technician Role

**Requirement:** Create a lab technician role that can manage lab orders and results but not patient medical records.

**Implementation:**

```sql
-- 1. Create role
INSERT INTO roles (name, description)
VALUES ('lab_technician', 'Laboratory staff managing test orders and results');

-- 2. Assign specific permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'lab_technician'),
  id
FROM permissions
WHERE name IN (
  'viewPatients',        -- See basic patient info
  'createLabOrder',      -- Create lab orders
  'viewLabResults',      -- View lab results
  'editLabResults',      -- Enter lab results
  'viewFiles',           -- View lab reports
  'uploadFiles',         -- Upload lab reports
  'viewDashboard'        -- Access dashboard
);

-- 3. Assign to users
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'lab_technician')
WHERE id IN (10, 11, 12); -- Lab tech user IDs
```

**Backend Route:**

```typescript
// Protect lab results entry route
router.post('/lab-results',
  authenticateToken,
  checkPermission('editLabResults'),
  async (req: AuthRequest, res: Response) => {
    // Lab technician can enter results
  }
);
```

### Scenario 2: Read-Only Auditor Role

**Requirement:** Create an auditor role that can view everything but change nothing.

```sql
-- Create auditor role
INSERT INTO roles (name, description)
VALUES ('auditor', 'Can view all records for compliance audits');

-- Assign all view permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'auditor'),
  id
FROM permissions
WHERE name LIKE 'view%';  -- All view permissions
```

### Scenario 3: Temporary Permission Elevation

**Requirement:** Temporarily grant admin permissions to a doctor for a specific task.

```typescript
// Backend route for temporary permission grant
router.post('/temporary-permissions',
  authenticateToken,
  checkPermission('manageUsers'),
  async (req: AuthRequest, res: Response) => {
    const { userId, permissions, expiresInHours } = req.body;
    
    // Store temporary permissions in a separate table
    await db.insert(temporaryPermissions).values({
      userId,
      permissions: JSON.stringify(permissions),
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      grantedBy: req.user!.id
    });
    
    // Modified checkPermission would also check temp permissions
    res.json({ message: 'Temporary permissions granted' });
  }
);
```

### Scenario 4: Department-Based Permissions

**Requirement:** Different permissions for emergency department vs. general practice.

```sql
-- Add department column to users
ALTER TABLE users ADD COLUMN department VARCHAR(50);

-- Backend: Check department in addition to role
router.get('/emergency-patients',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const permissions = await getUserPermissions(req.user!.id);
    
    // Check permission AND department
    if (!permissions.includes('viewPatients') || 
        req.user!.department !== 'emergency') {
      return res.status(403).json({ 
        message: 'Emergency department access required' 
      });
    }
    
    // Return emergency patients
  }
);
```

---

## Testing Permissions

### Unit Test: Permission Middleware

```typescript
// server/middleware/permissions.test.ts
import { checkPermission, getUserPermissions } from './permissions';
import { describe, it, expect, vi } from 'vitest';

describe('Permission Middleware', () => {
  it('should allow admin users', async () => {
    const req = {
      user: { id: 1, role: 'admin' }
    } as AuthRequest;
    
    const res = {} as Response;
    const next = vi.fn();
    
    await checkPermission('createPatients')(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });
  
  it('should deny users without permission', async () => {
    const req = {
      user: { id: 2, role: 'pharmacist', roleId: 3 }
    } as AuthRequest;
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;
    
    const next = vi.fn();
    
    await checkPermission('createPatients')(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### Integration Test: Protected Route

```typescript
// server/routes/patients.test.ts
import request from 'supertest';
import { app } from '../index';

describe('POST /api/patients', () => {
  it('should create patient with doctor role', async () => {
    const doctorToken = 'JWT_TOKEN_FOR_DOCTOR';
    
    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
  
  it('should deny pharmacist role', async () => {
    const pharmacistToken = 'JWT_TOKEN_FOR_PHARMACIST';
    
    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe'
      });
    
    expect(response.status).toBe(403);
  });
});
```

---

## Common Mistakes

### Mistake 1: Client-Side Only Permission Checks

❌ **Wrong:**

```tsx
// Only hiding UI - not secure!
function DeleteButton() {
  const { isAdmin } = useRole();
  
  if (!isAdmin) return null;
  
  const handleDelete = async () => {
    await fetch('/api/patients/1', { method: 'DELETE' });
  };
  
  return <Button onClick={handleDelete}>Delete</Button>;
}
```

✅ **Correct:**

```tsx
// UI + Backend protection
function DeleteButton() {
  const { isAdmin } = useRole();
  
  if (!isAdmin) return null; // Hide UI
  
  const handleDelete = async () => {
    await fetch('/api/patients/1', { method: 'DELETE' });
    // Backend also checks permission in middleware
  };
  
  return <Button onClick={handleDelete}>Delete</Button>;
}

// Backend
router.delete('/patients/:id',
  authenticateToken,
  checkPermission('deletePatients'), // ✅ Server-side check
  handler
);
```

### Mistake 2: Hardcoding Role Names

❌ **Wrong:**

```typescript
if (user.role === 'doctor' || user.role === 'nurse') {
  // Allow action
}
```

✅ **Correct:**

```typescript
const permissions = await getUserPermissions(user.id);
if (permissions.includes('createVisit')) {
  // Allow action - based on permission, not role
}
```

### Mistake 3: Not Checking Organization Scope

❌ **Wrong:**

```typescript
// Admin from Org A can see users from Org B!
router.get('/users',
  authenticateToken,
  checkPermission('viewUsers'),
  async (req, res) => {
    const users = await db.select().from(users);
    res.json(users);
  }
);
```

✅ **Correct:**

```typescript
router.get('/users',
  authenticateToken,
  checkPermission('viewUsers'),
  async (req, res) => {
    const query = req.user!.role === 'superadmin'
      ? sql`1=1`
      : eq(users.organizationId, req.user!.organizationId!);
    
    const allUsers = await db
      .select()
      .from(users)
      .where(query);
    
    res.json(allUsers);
  }
);
```

### Mistake 4: Forgetting Audit Logs

❌ **Wrong:**

```typescript
router.delete('/users/:id',
  authenticateToken,
  checkPermission('manageUsers'),
  async (req, res) => {
    await db.delete(users).where(eq(users.id, req.params.id));
    res.json({ message: 'User deleted' });
  }
);
```

✅ **Correct:**

```typescript
router.delete('/users/:id',
  authenticateToken,
  checkPermission('manageUsers'),
  async (req, res) => {
    await db.delete(users).where(eq(users.id, req.params.id));
    
    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user!.id,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: req.params.id,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });
    
    res.json({ message: 'User deleted' });
  }
);
```

---

## Summary

This guide covered:

✅ Backend route protection with middleware  
✅ Frontend permission-based UI rendering  
✅ Database operations for role management  
✅ Real-world implementation scenarios  
✅ Testing strategies  
✅ Common pitfalls to avoid  

**Key Principles:**

1. Always check permissions on the backend
2. Use permissions, not roles, for fine-grained control
3. Apply organization scoping for multi-tenant systems
4. Log all sensitive actions
5. Test permission boundaries thoroughly

For more information, see:
- [RBAC_SYSTEM_GUIDE.md](./RBAC_SYSTEM_GUIDE.md)
- [RBAC_QUICK_REFERENCE.md](./RBAC_QUICK_REFERENCE.md)
- [RBAC_ARCHITECTURE_DIAGRAM.md](./RBAC_ARCHITECTURE_DIAGRAM.md)

