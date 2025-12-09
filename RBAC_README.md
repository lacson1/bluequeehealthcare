# ClinicConnect RBAC Documentation

Complete documentation for the Role-Based Access Control (RBAC) system in ClinicConnect.

---

## 📚 Documentation Index

This documentation suite provides comprehensive coverage of the RBAC system:

### 1. **[RBAC System Guide](./RBAC_SYSTEM_GUIDE.md)** 📖
**Complete reference guide** covering all aspects of the RBAC system.

**Contents:**
- System architecture and database schema
- Complete list of roles and permissions
- API endpoints reference
- Backend and frontend implementation
- Setup instructions
- Security considerations
- Troubleshooting guide

**Best for:** Understanding the complete system, initial setup, comprehensive reference

---

### 2. **[RBAC Quick Reference](./RBAC_QUICK_REFERENCE.md)** ⚡
**Fast lookup guide** for common tasks and commands.

**Contents:**
- Quick start commands
- Common tasks (create role, assign permissions, etc.)
- Permission lookup table
- Role permission matrix
- SQL snippets
- API endpoint cheat sheet
- Troubleshooting tips
- Code pattern examples

**Best for:** Day-to-day development, quick lookups, common operations

---

### 3. **[RBAC Architecture Diagram](./RBAC_ARCHITECTURE_DIAGRAM.md)** 🏗️
**Visual guide** showing system structure and data flow.

**Contents:**
- System overview diagram
- Database relationships
- Permission flow diagrams
- Role hierarchy
- Data flow examples
- Multi-organization architecture
- Security layers
- Audit logging flow

**Best for:** Understanding how components interact, onboarding new developers, system design

---

### 4. **[RBAC Implementation Examples](./RBAC_IMPLEMENTATION_EXAMPLES.md)** 💻
**Practical code examples** for real-world scenarios.

**Contents:**
- Backend route protection examples
- Frontend component examples
- Custom hooks and helpers
- Database operations
- Real-world scenarios (lab technician, auditor, etc.)
- Testing examples
- Common mistakes and how to avoid them

**Best for:** Implementing new features, learning by example, avoiding common pitfalls

---

## 🚀 Quick Start

### Prerequisites
- PostgreSQL database set up
- Node.js and npm installed
- ClinicConnect application running

### Installation

1. **Run the RBAC seed script:**
```bash
psql -d clinicconnect -f rbac_seed.sql
```

2. **Verify installation:**
```sql
SELECT COUNT(*) FROM roles;
-- Should return 6

SELECT COUNT(*) FROM permissions;
-- Should return 30+
```

3. **Migrate existing users (optional):**
```sql
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'doctor')
WHERE role = 'doctor';
```

4. **Test the system:**
```bash
# Check if permission middleware works
curl -X POST http://localhost:5000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User"}'
```

---

## 📋 System Overview

### What is RBAC?

Role-Based Access Control (RBAC) is a security model that restricts system access based on a user's role and permissions.

```
User → Assigned Role → Has Permissions → Can Perform Actions
```

### Key Components

1. **Roles** - Named collections of permissions (e.g., Doctor, Nurse, Admin)
2. **Permissions** - Specific actions users can perform (e.g., createPatients, viewLabResults)
3. **Users** - Individuals assigned to roles
4. **Role-Permission Mapping** - Links roles to their allowed permissions

### Default Roles

| Role | Description | Permission Count |
|------|-------------|------------------|
| **Doctor** | Full clinical access | 17 |
| **Nurse** | Patient care, limited access | 12 |
| **Pharmacist** | Medication management | 5 |
| **Physiotherapist** | Consultation forms | 9 |
| **Admin** | Organization management | 24 |
| **SuperAdmin** | Full platform access | ALL |

### Permission Categories

- **Patient Management** (3 permissions)
- **Visits & Consultations** (6 permissions)
- **Laboratory** (3 permissions)
- **Medications** (4 permissions)
- **Referrals** (3 permissions)
- **User Management** (2 permissions)
- **Organization Management** (2 permissions)
- **File Management** (3 permissions)
- **Analytics** (3 permissions)

---

## 🔑 Common Use Cases

### 1. Protect a Backend Route

```typescript
import { checkPermission } from '../middleware/permissions';

router.post('/patients',
  authenticateToken,
  checkPermission('createPatients'),
  async (req, res) => {
    // Only users with 'createPatients' permission can access
  }
);
```

### 2. Show/Hide Frontend Components

```tsx
import { RoleGuard } from '@/components/role-guard';

<RoleGuard allowedRoles={['doctor', 'admin']}>
  <PrescriptionForm />
</RoleGuard>
```

### 3. Create Custom Role

```typescript
const response = await fetch('/api/access-control/roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'receptionist',
    description: 'Front desk staff',
    permissionIds: [1, 2, 60] // viewPatients, createPatients, viewDashboard
  })
});
```

### 4. Assign Role to User

```typescript
await fetch(`/api/access-control/users/${userId}/role`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ roleId: 1 })
});
```

---

## 🎯 API Endpoints

### Role Management
- `GET /api/access-control/roles` - List all roles
- `GET /api/access-control/roles/:id` - Get role details
- `POST /api/access-control/roles` - Create new role
- `PUT /api/access-control/roles/:id/permissions` - Update role permissions
- `DELETE /api/access-control/roles/:id` - Delete role

### Permission Management
- `GET /api/access-control/permissions` - List all permissions

### User Management
- `PUT /api/access-control/users/:userId/role` - Assign role to user
- `GET /api/access-control/users/:userId/permissions` - Get user permissions
- `POST /api/access-control/bulk-assign-roles` - Bulk assign roles
- `GET /api/access-control/staff` - Get staff with roles

---

## 🛠️ Development Guide

### Adding a New Permission

1. **Add to database:**
```sql
INSERT INTO permissions (name, description)
VALUES ('deletePatients', 'Delete patient records');
```

2. **Assign to roles:**
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'deletePatients';
```

3. **Protect route:**
```typescript
router.delete('/patients/:id',
  authenticateToken,
  checkPermission('deletePatients'),
  handler
);
```

4. **Update frontend:**
```tsx
const { hasPermission } = usePermissions();

{hasPermission('deletePatients') && (
  <Button onClick={handleDelete}>Delete</Button>
)}
```

### Creating a Custom Role

See [RBAC Implementation Examples](./RBAC_IMPLEMENTATION_EXAMPLES.md#scenario-1-lab-technician-role) for detailed examples.

---

## 🔒 Security Best Practices

1. ✅ **Always validate on the backend** - Never trust client-side checks
2. ✅ **Use permissions, not roles** - More granular and flexible
3. ✅ **Apply organization scoping** - Multi-tenant data isolation
4. ✅ **Log all sensitive actions** - Audit trail for compliance
5. ✅ **Principle of least privilege** - Grant minimum necessary permissions
6. ✅ **Regular permission audits** - Review and update as needed
7. ❌ **Never expose all data** - Filter based on permissions
8. ❌ **Don't hardcode role names** - Use permission checks instead

---

## 📊 Database Schema

```
roles
├── id (PK)
├── name (UNIQUE)
├── description
└── created_at

permissions
├── id (PK)
├── name (UNIQUE)
├── description
└── created_at

role_permissions
├── id (PK)
├── role_id (FK → roles.id)
└── permission_id (FK → permissions.id)

users
├── id (PK)
├── username
├── role (legacy)
├── role_id (FK → roles.id)
└── organization_id
```

---

## 🐛 Troubleshooting

### User Can't Access Feature

1. **Check role assignment:**
```sql
SELECT username, role, role_id FROM users WHERE id = <user_id>;
```

2. **Verify role permissions:**
```sql
SELECT p.name FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = <role_id>;
```

3. **Check route protection:**
```typescript
// Ensure middleware is present
router.post('/endpoint',
  authenticateToken,              // ✅ Required
  checkPermission('permission'),  // ✅ Required
  handler
);
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Missing permission | Assign permission to user's role |
| 401 Unauthorized | Invalid/expired token | Refresh authentication |
| Role won't delete | Users assigned to role | Reassign users first |
| Permission not working | Typo in permission name | Verify exact spelling |

See [RBAC Quick Reference](./RBAC_QUICK_REFERENCE.md#troubleshooting) for more.

---

## 📈 Monitoring & Auditing

All RBAC changes are logged to the `audit_logs` table:

```sql
-- View recent permission changes
SELECT 
  u.username,
  al.action,
  al.details,
  al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action LIKE '%ROLE%' OR al.action LIKE '%PERMISSION%'
ORDER BY al.created_at DESC
LIMIT 50;
```

Logged actions:
- `CREATE_ROLE`
- `UPDATE_ROLE_PERMISSIONS`
- `DELETE_ROLE`
- `ASSIGN_ROLE`
- `BULK_ASSIGN_ROLES`

---

## 🧪 Testing

### Backend Tests

```typescript
// Test permission middleware
import { checkPermission } from './permissions';

it('should allow users with permission', async () => {
  const req = { user: { id: 1, roleId: 1 } };
  const next = vi.fn();
  
  await checkPermission('createPatients')(req, res, next);
  
  expect(next).toHaveBeenCalled();
});
```

### Frontend Tests

```tsx
// Test role guard component
import { render } from '@testing-library/react';
import { RoleGuard } from './role-guard';

it('shows content for allowed roles', () => {
  const { getByText } = render(
    <RoleGuard allowedRoles={['doctor']}>
      <div>Protected Content</div>
    </RoleGuard>
  );
  
  expect(getByText('Protected Content')).toBeInTheDocument();
});
```

See [RBAC Implementation Examples](./RBAC_IMPLEMENTATION_EXAMPLES.md#testing-permissions) for more tests.

---

## 📚 Additional Resources

### Internal Documentation
- [API Guide](./API_GUIDE.md) - General API documentation
- [Setup Guide](./SETUP_GUIDE.md) - Application setup
- [Admin Installation Guide](./ADMIN_INSTALLATION_GUIDE.md) - Admin features

### Code Files
- `server/middleware/permissions.ts` - Permission middleware
- `server/routes/access-control.ts` - RBAC API routes
- `client/src/components/role-guard.tsx` - Frontend role checking
- `shared/schema.ts` - Database schema
- `rbac_seed.sql` - Initial setup script

---

## 🤝 Support

### Getting Help

1. **Check the documentation:**
   - Start with [Quick Reference](./RBAC_QUICK_REFERENCE.md) for common tasks
   - Consult [System Guide](./RBAC_SYSTEM_GUIDE.md) for detailed information
   - Review [Implementation Examples](./RBAC_IMPLEMENTATION_EXAMPLES.md) for code samples

2. **Debug the issue:**
   - Check database for role assignments
   - Verify permissions in role_permissions table
   - Review audit logs for recent changes
   - Test with curl or Postman

3. **Common solutions:**
   - Re-run `rbac_seed.sql` if permissions are missing
   - Refresh user session if permissions don't update
   - Check organization scoping for multi-tenant issues

---

## 📝 Version History

- **v1.0** (Current) - Initial RBAC implementation
  - 6 default roles
  - 30+ permissions
  - Full API endpoints
  - Frontend components
  - Audit logging
  - Multi-organization support

---

## 🎓 Learning Path

### For New Developers

1. **Start here:** [RBAC Architecture Diagram](./RBAC_ARCHITECTURE_DIAGRAM.md)
   - Understand system structure
   - See data flow visually

2. **Next:** [RBAC Quick Reference](./RBAC_QUICK_REFERENCE.md)
   - Learn common tasks
   - Get familiar with API endpoints

3. **Then:** [RBAC Implementation Examples](./RBAC_IMPLEMENTATION_EXAMPLES.md)
   - Study code examples
   - Learn best practices

4. **Finally:** [RBAC System Guide](./RBAC_SYSTEM_GUIDE.md)
   - Deep dive into details
   - Reference when needed

### For Experienced Developers

1. [RBAC Quick Reference](./RBAC_QUICK_REFERENCE.md) - Fast lookup
2. [RBAC Implementation Examples](./RBAC_IMPLEMENTATION_EXAMPLES.md) - Code patterns
3. [RBAC System Guide](./RBAC_SYSTEM_GUIDE.md) - Complete reference

---

## ✨ Key Features

✅ **Granular Control** - 30+ specific permissions  
✅ **Flexible Roles** - Create custom roles as needed  
✅ **Multi-Tenant** - Organization-scoped access  
✅ **Audit Trail** - Complete logging of all changes  
✅ **Easy Integration** - Simple middleware and hooks  
✅ **Backward Compatible** - Works with legacy system  
✅ **Well Documented** - Comprehensive guides and examples  
✅ **Type Safe** - Full TypeScript support  

---

## 🎯 Next Steps

1. **Set up the system:** Run `rbac_seed.sql`
2. **Explore the docs:** Start with the Quick Reference
3. **Try examples:** Implement a protected route
4. **Customize:** Create your own roles and permissions
5. **Monitor:** Set up audit log reviews

---

**Ready to get started?** Choose a guide above based on your needs!

- 📖 Need comprehensive info? → [System Guide](./RBAC_SYSTEM_GUIDE.md)
- ⚡ Want quick answers? → [Quick Reference](./RBAC_QUICK_REFERENCE.md)
- 🏗️ Understanding architecture? → [Architecture Diagram](./RBAC_ARCHITECTURE_DIAGRAM.md)
- 💻 Looking for examples? → [Implementation Examples](./RBAC_IMPLEMENTATION_EXAMPLES.md)

