# RBAC System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ClinicConnect RBAC System                        │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐         ┌──────────────────────────────────────┐
│  Frontend (React)     │         │  Backend (Express + PostgreSQL)      │
│                       │         │                                      │
│  ┌─────────────────┐ │         │  ┌────────────────────────────────┐ │
│  │  RoleGuard      │ │         │  │  Authentication Middleware     │ │
│  │  Component      │ │◄────────┼──┤  (authenticateToken)           │ │
│  └─────────────────┘ │         │  └────────────────────────────────┘ │
│         │             │         │              │                      │
│         ▼             │         │              ▼                      │
│  ┌─────────────────┐ │         │  ┌────────────────────────────────┐ │
│  │  useRole()      │ │         │  │  Permission Middleware         │ │
│  │  Hook           │ │◄────────┼──┤  (checkPermission)             │ │
│  └─────────────────┘ │         │  └────────────────────────────────┘ │
│         │             │         │              │                      │
│         ▼             │         │              ▼                      │
│  ┌─────────────────┐ │  HTTP   │  ┌────────────────────────────────┐ │
│  │  API Calls      │─┼────────►│  │  Access Control Routes         │ │
│  │  (fetch)        │ │ Request │  │  (/api/access-control/*)       │ │
│  └─────────────────┘ │         │  └────────────────────────────────┘ │
│                       │         │              │                      │
└───────────────────────┘         │              ▼                      │
                                  │  ┌────────────────────────────────┐ │
                                  │  │  Database Layer (Drizzle ORM)  │ │
                                  │  └────────────────────────────────┘ │
                                  │              │                      │
                                  └──────────────┼──────────────────────┘
                                                 ▼
                                  ┌──────────────────────────────────────┐
                                  │      PostgreSQL Database             │
                                  │                                      │
                                  │  ┌─────────┐  ┌────────────┐        │
                                  │  │  roles  │  │permissions │        │
                                  │  └────┬────┘  └─────┬──────┘        │
                                  │       │             │               │
                                  │       └──────┬──────┘               │
                                  │              │                      │
                                  │    ┌─────────▼──────────┐           │
                                  │    │ role_permissions   │           │
                                  │    └─────────┬──────────┘           │
                                  │              │                      │
                                  │    ┌─────────▼──────────┐           │
                                  │    │      users         │           │
                                  │    │  (role_id column)  │           │
                                  │    └────────────────────┘           │
                                  └──────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Database Entity Relationships                     │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │      roles       │
                              ├──────────────────┤
                              │ id (PK)          │
                              │ name (UNIQUE)    │
                              │ description      │
                              │ created_at       │
                              └────────┬─────────┘
                                       │
                       ┌───────────────┼───────────────┐
                       │               │               │
                       │ 1             │ N             │
                       │               │               │
          ┌────────────▼──────┐        │    ┌──────────▼──────────┐
          │       users       │        │    │  role_permissions   │
          ├───────────────────┤        │    ├─────────────────────┤
          │ id (PK)           │        │    │ id (PK)             │
          │ username          │        │    │ role_id (FK)        │
          │ role (legacy)     │        │    │ permission_id (FK)  │
          │ role_id (FK) ─────┘        │    └──────────┬──────────┘
          │ organization_id   │                        │
          │ is_active         │                        │ N
          └───────────────────┘                        │
                                                       │ 1
                                            ┌──────────▼──────────┐
                                            │    permissions      │
                                            ├─────────────────────┤
                                            │ id (PK)             │
                                            │ name (UNIQUE)       │
                                            │ description         │
                                            │ created_at          │
                                            └─────────────────────┘
```

---

## Permission Flow

### 1. User Makes Request

```
┌──────────┐
│  User    │  Initiates action (e.g., create patient)
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Component                                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  useRole() hook checks user's role                    │ │
│  │  const { isDoctor } = useRole();                      │ │
│  │                                                        │ │
│  │  Conditionally shows/hides UI elements:               │ │
│  │  {isDoctor && <CreatePatientButton />}                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │  API Request     │
                        │  POST /patients  │
                        │  + Auth Token    │
                        └────────┬─────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend Middleware Chain                                   │
│                                                             │
│  1. authenticateToken()                                     │
│     ├─ Verify JWT token                                    │
│     ├─ Extract user from token                             │
│     └─ Attach to req.user                                  │
│                                                             │
│  2. checkPermission('createPatients')                       │
│     ├─ Check if user.role === 'admin' (backward compat)    │
│     ├─ OR get user.roleId                                  │
│     ├─ Query role_permissions table                        │
│     ├─ Check if permission exists                          │
│     └─ Allow/Deny access                                   │
│                                                             │
│  3. Route Handler                                           │
│     └─ Execute business logic                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Role Assignment Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Admin assigns role to user                                      │
└──────────────────────────────────────────────────────────────────┘

Admin User                    Backend API                Database
    │                             │                          │
    ├─ PUT /users/5/role ────────►│                          │
    │  { roleId: 1 }              │                          │
    │                             │                          │
    │                             ├─ authenticateToken()     │
    │                             │  (verify admin)          │
    │                             │                          │
    │                             ├─ UPDATE users       ────►│
    │                             │  SET role_id = 1         │
    │                             │  WHERE id = 5            │
    │                             │                          │
    │                             ├─ INSERT audit_logs  ────►│
    │                             │  (log the change)        │
    │                             │                          │
    │◄────── Success ─────────────┤                          │
    │  { updatedUser }            │                          │
    │                             │                          │
```

---

## Permission Check Logic

```
┌────────────────────────────────────────────────────────────────┐
│  checkPermission('createPatients') Middleware Flow             │
└────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Request comes  │
                    │  with JWT token │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  req.user set   │
                    │  by auth?       │
                    └────┬───────┬────┘
                         │ NO    │ YES
                         │       │
                    ┌────▼───┐   │
                    │ 401    │   │
                    │ Denied │   │
                    └────────┘   │
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │ Is admin/superadmin? │
                    │ (backward compat)    │
                    └────┬───────────┬─────┘
                         │ YES       │ NO
                         │           │
                    ┌────▼───┐       │
                    │ Allow  │       │
                    │ Access │       │
                    └────────┘       │
                                     │
                                     ▼
                    ┌─────────────────────────────┐
                    │ Does user have roleId?      │
                    └────┬───────────────────┬────┘
                         │ NO                │ YES
                         │                   │
                    ┌────▼───┐               │
                    │ 403    │               │
                    │ Denied │               │
                    └────────┘               │
                                             │
                                             ▼
                    ┌─────────────────────────────────────┐
                    │ Query: SELECT permissions.name      │
                    │ FROM role_permissions               │
                    │ JOIN permissions                    │
                    │ WHERE role_id = user.roleId         │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────────┐
                    │ Does permission list include │
                    │ 'createPatients'?            │
                    └────┬─────────────────────┬───┘
                         │ NO                  │ YES
                         │                     │
                    ┌────▼───┐            ┌────▼───┐
                    │ 403    │            │ Allow  │
                    │ Denied │            │ Access │
                    └────────┘            └────┬───┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │  Route Handler   │
                                    │  Executes        │
                                    └──────────────────┘
```

---

## Role Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│  Role Hierarchy (Permission Levels)                            │
└────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   SuperAdmin    │  ← ALL Permissions
                         │                 │     Cross-org access
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼────────┐          ┌──────▼──────┐
            │     Admin      │          │  (Reserved) │
            │  Organization  │          │             │
            │     Level      │          └─────────────┘
            └───────┬────────┘
                    │
      ┌─────────────┼─────────────┬─────────────┐
      │             │             │             │
┌─────▼──────┐ ┌───▼─────┐ ┌────▼────┐ ┌──────▼───────┐
│   Doctor   │ │  Nurse  │ │Pharmacy │ │Physiotherapist│
│            │ │         │ │         │ │              │
│ Full       │ │ Patient │ │ Med     │ │ Consultation │
│ Clinical   │ │ Care    │ │ Mgmt    │ │ Forms        │
│ Access     │ │ Limited │ │ Only    │ │              │
└────────────┘ └─────────┘ └─────────┘ └──────────────┘
```

---

## Data Flow Example: Creating a Patient

```
┌────────────────────────────────────────────────────────────────┐
│  Complete Flow: Doctor creates a new patient                   │
└────────────────────────────────────────────────────────────────┘

1. Frontend Component
   ┌──────────────────────────────────────────────┐
   │ <CreatePatientForm />                        │
   │                                              │
   │ const { isDoctor } = useRole();              │
   │                                              │
   │ {isDoctor && <Button>Create Patient</Button>}│
   └──────────────────┬───────────────────────────┘
                      │ Click
                      ▼
2. API Call
   ┌──────────────────────────────────────────────┐
   │ POST /api/patients                           │
   │ Headers: {                                   │
   │   Authorization: "Bearer eyJhbGc..."         │
   │   Content-Type: "application/json"           │
   │ }                                            │
   │ Body: { firstName, lastName, ... }           │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
3. Backend Middleware Chain
   ┌──────────────────────────────────────────────┐
   │ router.post('/patients',                     │
   │   authenticateToken,            ← Step A     │
   │   checkPermission('createPatients'), ← B     │
   │   handler                       ← Step C     │
   │ );                                           │
   └──────────────────────────────────────────────┘
   
   Step A: authenticateToken
   ┌──────────────────────────────────────────────┐
   │ 1. Extract JWT from Authorization header    │
   │ 2. Verify signature                         │
   │ 3. Extract payload { id: 5, role: "doctor" }│
   │ 4. Query database for user                  │
   │ 5. Attach to req.user                       │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
   Step B: checkPermission('createPatients')
   ┌──────────────────────────────────────────────┐
   │ 1. Check req.user exists                    │
   │ 2. Check if role === 'admin' (skip if yes)  │
   │ 3. Get user.roleId (e.g., 1 = doctor)       │
   │ 4. Query:                                   │
   │    SELECT permissions.name                  │
   │    FROM role_permissions                    │
   │    JOIN permissions                         │
   │    WHERE role_id = 1                        │
   │                                             │
   │ 5. Check if 'createPatients' in results    │
   │ 6. ✅ ALLOW (doctor has this permission)   │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
   Step C: Route Handler
   ┌──────────────────────────────────────────────┐
   │ async (req, res) => {                       │
   │   const patient = await db.insert(patients) │
   │     .values(req.body)                       │
   │     .returning();                           │
   │                                             │
   │   await auditLog({                          │
   │     action: 'CREATE_PATIENT',               │
   │     userId: req.user.id                     │
   │   });                                       │
   │                                             │
   │   return res.json(patient);                 │
   │ }                                           │
   └──────────────────┬───────────────────────────┘
                      │
                      ▼
4. Response to Frontend
   ┌──────────────────────────────────────────────┐
   │ 201 Created                                  │
   │ {                                            │
   │   id: 123,                                   │
   │   firstName: "John",                         │
   │   lastName: "Doe",                           │
   │   ...                                        │
   │ }                                            │
   └──────────────────────────────────────────────┘
```

---

## Multi-Organization Support

```
┌────────────────────────────────────────────────────────────────┐
│  Organization Scoping                                          │
└────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   SuperAdmin     │
                    │  (Cross-Org)     │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
     ┌──────▼──────┐  ┌──────▼──────┐ ┌──────▼──────┐
     │Organization │  │Organization │ │Organization │
     │     A       │  │     B       │ │     C       │
     └──────┬──────┘  └──────┬──────┘ └──────┬──────┘
            │                │                │
     ┌──────┴──────┐  ┌──────┴──────┐ ┌──────┴──────┐
     │  Admin A    │  │  Admin B    │ │  Admin C    │
     └──────┬──────┘  └──────┬──────┘ └──────┬──────┘
            │                │                │
     ┌──────┴──────┐  ┌──────┴──────┐ ┌──────┴──────┐
     │ Staff A     │  │ Staff B     │ │ Staff C     │
     │ - Doctor    │  │ - Nurse     │ │ - Pharmacist│
     │ - Nurse     │  │ - Doctor    │ │ - Doctor    │
     └─────────────┘  └─────────────┘ └─────────────┘
     
Organization Scoping Rules:
- SuperAdmin: Can access ALL organizations
- Admin: Can only manage users in their organization
- Staff: Can only see data from their organization
- Users query: WHERE organization_id = req.user.organizationId
```

---

## Audit Logging Flow

```
┌────────────────────────────────────────────────────────────────┐
│  Every RBAC action is logged                                   │
└────────────────────────────────────────────────────────────────┘

Action: Admin assigns Doctor role to User #5

┌─────────────────┐
│ Admin (User #2) │
│ Org A           │
└────────┬────────┘
         │
         │ PUT /users/5/role { roleId: 1 }
         │
         ▼
┌──────────────────────────────────────┐
│ Backend processes request            │
│                                      │
│ 1. Authenticate admin                │
│ 2. Update user role                  │
│ 3. ✅ Insert audit log ────────────┐│
└──────────────────────────────────────┘│
                                        │
                                        ▼
                        ┌───────────────────────────────────┐
                        │ audit_logs table                  │
                        ├───────────────────────────────────┤
                        │ user_id: 2 (admin)                │
                        │ action: 'ASSIGN_ROLE'             │
                        │ entity_type: 'user'               │
                        │ entity_id: 5                      │
                        │ details: '{"roleId": 1}'          │
                        │ ip_address: '192.168.1.100'       │
                        │ user_agent: 'Mozilla/5.0...'      │
                        │ timestamp: '2024-01-15 10:30:00'  │
                        └───────────────────────────────────┘

Logged Actions:
- CREATE_ROLE
- UPDATE_ROLE_PERMISSIONS
- DELETE_ROLE
- ASSIGN_ROLE
- BULK_ASSIGN_ROLES
```

---

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│  Defense in Depth: Multiple Security Layers                    │
└────────────────────────────────────────────────────────────────┘

Layer 1: Frontend UI
┌────────────────────────────────────────────────────┐
│ RoleGuard / useRole() hook                         │
│ - Hides unauthorized UI elements                   │
│ - Prevents accidental unauthorized actions         │
│ ⚠️  NOT a security boundary (client-side)          │
└────────────────────────────────────────────────────┘
                        │
                        ▼
Layer 2: API Authentication
┌────────────────────────────────────────────────────┐
│ authenticateToken() middleware                     │
│ - Verifies JWT signature                           │
│ - Checks token expiration                          │
│ - Validates user exists and is active              │
│ ✅ First security boundary                         │
└────────────────────────────────────────────────────┘
                        │
                        ▼
Layer 3: Permission Check
┌────────────────────────────────────────────────────┐
│ checkPermission() middleware                       │
│ - Verifies user has specific permission            │
│ - Checks role-permission mapping in database       │
│ - Organization scoping (if applicable)             │
│ ✅ Second security boundary                        │
└────────────────────────────────────────────────────┘
                        │
                        ▼
Layer 4: Business Logic
┌────────────────────────────────────────────────────┐
│ Route handler                                      │
│ - Additional checks (e.g., resource ownership)     │
│ - Data validation                                  │
│ - Database constraints                             │
│ ✅ Final security boundary                         │
└────────────────────────────────────────────────────┘
                        │
                        ▼
Layer 5: Audit Trail
┌────────────────────────────────────────────────────┐
│ Audit logging                                      │
│ - Records all actions                              │
│ - Enables forensics and compliance                 │
│ - Detects unauthorized access attempts             │
│ ✅ Monitoring and accountability                   │
└────────────────────────────────────────────────────┘
```

---

## Quick Reference: Key Files

```
Project Structure
├── server/
│   ├── middleware/
│   │   └── permissions.ts        ← Permission check logic
│   │
│   └── routes/
│       └── access-control.ts     ← RBAC API endpoints
│
├── client/
│   └── src/
│       └── components/
│           └── role-guard.tsx    ← Frontend role checking
│
├── shared/
│   └── schema.ts                 ← Database schema definitions
│
└── rbac_seed.sql                 ← Initial setup script
```

---

## Summary

The ClinicConnect RBAC system provides:

✅ **Granular Permission Control** - 30+ specific permissions  
✅ **Flexible Role Management** - Create custom roles  
✅ **Multi-Organization Support** - Scoped access  
✅ **Backward Compatibility** - Works with legacy role system  
✅ **Comprehensive Audit Trail** - All changes logged  
✅ **Defense in Depth** - Multiple security layers  
✅ **Developer-Friendly** - Simple middleware and hooks  

For implementation details, see:
- [RBAC_SYSTEM_GUIDE.md](./RBAC_SYSTEM_GUIDE.md) - Full documentation
- [RBAC_QUICK_REFERENCE.md](./RBAC_QUICK_REFERENCE.md) - Quick lookup

