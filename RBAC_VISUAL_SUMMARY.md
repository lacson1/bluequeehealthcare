# RBAC Visual Summary

Quick visual reference for the ClinicConnect RBAC system.

---

## 🎯 System at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│              ClinicConnect RBAC System                      │
│                                                             │
│  Users → Roles → Permissions → Actions                     │
│                                                             │
│  👤 Doctor → Doctor Role → createPrescription → ✅ Allowed  │
│  👤 Nurse → Nurse Role → createPrescription → ❌ Denied     │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Default Roles

```
┌──────────────────┬───────────────────────────────────────────────┐
│  Role            │  Primary Capabilities                         │
├──────────────────┼───────────────────────────────────────────────┤
│  🩺 Doctor       │  Full clinical access                         │
│                  │  • Patient management                         │
│                  │  • Prescriptions                              │
│                  │  • Lab orders                                 │
│                  │  • Consultations                              │
├──────────────────┼───────────────────────────────────────────────┤
│  💉 Nurse        │  Patient care & monitoring                    │
│                  │  • View/edit patients                         │
│                  │  • Record visits                              │
│                  │  • Lab orders                                 │
│                  │  • View prescriptions                         │
├──────────────────┼───────────────────────────────────────────────┤
│  💊 Pharmacist   │  Medication management                        │
│                  │  • View prescriptions                         │
│                  │  • Manage medications                         │
│                  │  • Dispense drugs                             │
├──────────────────┼───────────────────────────────────────────────┤
│  🏃 Physio       │  Specialized consultations                    │
│                  │  • Patient assessment                         │
│                  │  • Consultation forms                         │
│                  │  • Treatment plans                            │
├──────────────────┼───────────────────────────────────────────────┤
│  👔 Admin        │  Organization management                      │
│                  │  • User management                            │
│                  │  • All clinical features                      │
│                  │  • Audit logs                                 │
│                  │  • Reports                                    │
├──────────────────┼───────────────────────────────────────────────┤
│  👑 SuperAdmin   │  Full platform control                        │
│                  │  • Cross-organization access                  │
│                  │  • All permissions                            │
│                  │  • System configuration                       │
└──────────────────┴───────────────────────────────────────────────┘
```

---

## 🔑 Permission Categories

```
┌────────────────────────────────────────────────────────────────┐
│  Permission Categories                                         │
└────────────────────────────────────────────────────────────────┘

📋 PATIENT MANAGEMENT
   ├─ viewPatients       👁️  View patient records
   ├─ editPatients       ✏️  Edit patient information
   └─ createPatients     ➕  Register new patients

🏥 VISITS & CONSULTATIONS
   ├─ createVisit        📝  Record patient visits
   ├─ viewVisits         👁️  View visit history
   ├─ editVisits         ✏️  Modify visit records
   ├─ createConsultation 🩺  Specialist consultations
   ├─ viewConsultation   👁️  View consultations
   └─ createConsultationForm 📋  Consultation templates

🧪 LABORATORY
   ├─ createLabOrder     🧬  Order lab tests
   ├─ viewLabResults     👁️  View test results
   └─ editLabResults     ✏️  Enter/modify results

💊 MEDICATIONS
   ├─ viewMedications    👁️  View prescribed meds
   ├─ manageMedications  📦  Dispense medications
   ├─ createPrescription 📝  Write prescriptions
   └─ viewPrescriptions  👁️  View prescriptions

🔄 REFERRALS
   ├─ createReferral     ➡️  Refer patients
   ├─ viewReferrals      👁️  View referrals
   └─ manageReferrals    ✅  Accept/reject referrals

👥 USER MANAGEMENT
   ├─ manageUsers        🔧  Manage staff
   └─ viewUsers          👁️  View staff info

🏢 ORGANIZATIONS
   ├─ manageOrganizations ⚙️  Org settings
   └─ viewOrganizations   👁️  View org info

📁 FILES
   ├─ uploadFiles        ⬆️  Upload documents
   ├─ viewFiles          👁️  View/download files
   └─ deleteFiles        🗑️  Delete files

📊 ANALYTICS
   ├─ viewDashboard      📈  Access dashboard
   ├─ viewReports        📊  View analytics
   └─ viewAuditLogs      🔍  Security logs
```

---

## 📊 Role vs Permission Matrix

```
Permission             | Doctor | Nurse | Pharmacist | Physio | Admin
─────────────────────────────────────────────────────────────────────
viewPatients          |   ✅   |  ✅   |     ✅     |   ✅   |  ✅
editPatients          |   ✅   |  ✅   |     ❌     |   ✅   |  ✅
createPatients        |   ✅   |  ✅   |     ❌     |   ❌   |  ✅
─────────────────────────────────────────────────────────────────────
createVisit           |   ✅   |  ✅   |     ❌     |   ❌   |  ✅
viewVisits            |   ✅   |  ✅   |     ❌     |   ✅   |  ✅
editVisits            |   ✅   |  ❌   |     ❌     |   ❌   |  ✅
─────────────────────────────────────────────────────────────────────
createLabOrder        |   ✅   |  ✅   |     ❌     |   ❌   |  ✅
viewLabResults        |   ✅   |  ✅   |     ❌     |   ❌   |  ✅
editLabResults        |   ✅   |  ❌   |     ❌     |   ❌   |  ✅
─────────────────────────────────────────────────────────────────────
createPrescription    |   ✅   |  ❌   |     ❌     |   ❌   |  ✅
viewPrescriptions     |   ✅   |  ✅   |     ✅     |   ❌   |  ✅
manageMedications     |   ❌   |  ❌   |     ✅     |   ❌   |  ✅
─────────────────────────────────────────────────────────────────────
createConsultation    |   ✅   |  ❌   |     ❌     |   ✅   |  ✅
viewConsultation      |   ✅   |  ✅   |     ❌     |   ✅   |  ✅
─────────────────────────────────────────────────────────────────────
manageUsers           |   ❌   |  ❌   |     ❌     |   ❌   |  ✅
viewAuditLogs         |   ❌   |  ❌   |     ❌     |   ❌   |  ✅
```

---

## 🔄 Request Flow

```
1️⃣  User sends request
    │
    ├─ POST /api/patients
    ├─ Authorization: Bearer <JWT>
    └─ Body: { firstName, lastName, ... }
    
2️⃣  Authentication
    │
    ├─ Verify JWT signature ✅
    ├─ Check token expiration ✅
    └─ Load user from database ✅
    
3️⃣  Permission Check
    │
    ├─ Get user's role ID
    ├─ Query role_permissions table
    ├─ Check for 'createPatients' permission
    └─ ALLOW ✅ or DENY ❌
    
4️⃣  Execute Action
    │
    ├─ Insert patient record
    ├─ Log to audit_logs
    └─ Return response

5️⃣  Response sent
    │
    └─ 201 Created { patient data }
```

---

## 🛠️ Common Operations

### Create Role
```
HTTP POST /api/access-control/roles
────────────────────────────────────
{
  "name": "receptionist",
  "description": "Front desk staff",
  "permissionIds": [1, 2, 60]
}

Response: 201 Created
────────────────────────────────────
{
  "id": 7,
  "name": "receptionist",
  "description": "Front desk staff"
}
```

### Assign Role to User
```
HTTP PUT /api/access-control/users/5/role
────────────────────────────────────
{
  "roleId": 1
}

Response: 200 OK
────────────────────────────────────
{
  "id": 5,
  "username": "dr.smith",
  "roleId": 1,
  "role": "doctor"
}
```

### Get User Permissions
```
HTTP GET /api/access-control/users/5/permissions
────────────────────────────────────

Response: 200 OK
────────────────────────────────────
[
  { "id": 1, "name": "viewPatients", "description": "..." },
  { "id": 2, "name": "editPatients", "description": "..." },
  { "id": 3, "name": "createPatients", "description": "..." }
]
```

---

## 💻 Code Snippets

### Backend: Protect Route
```typescript
router.post('/patients',
  authenticateToken,              // ← Verify user
  checkPermission('createPatients'), // ← Check permission
  async (req, res) => {
    // Execute if allowed
  }
);
```

### Frontend: Show/Hide UI
```tsx
import { RoleGuard } from '@/components/role-guard';

<RoleGuard allowedRoles={['doctor', 'admin']}>
  <CreatePatientButton />
</RoleGuard>
```

### Frontend: Permission Check
```tsx
import { usePermissions } from '@/hooks/usePermissions';

const { hasPermission } = usePermissions();

{hasPermission('createPrescription') && (
  <PrescriptionForm />
)}
```

### SQL: Add Permission to Role
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'nurse'),
  (SELECT id FROM permissions WHERE name = 'editVisits');
```

---

## 🔐 Security Layers

```
Layer 1: Frontend UI
┌────────────────────────────────────┐
│  RoleGuard / useRole()             │
│  • Hides unauthorized UI           │
│  • UX improvement, NOT security    │
└────────────────┬───────────────────┘
                 ▼
Layer 2: Authentication
┌────────────────────────────────────┐
│  authenticateToken()               │
│  • Verify JWT                      │
│  • Check expiration                │
│  ✅ First security boundary        │
└────────────────┬───────────────────┘
                 ▼
Layer 3: Authorization
┌────────────────────────────────────┐
│  checkPermission()                 │
│  • Verify specific permission      │
│  • Check role-permission mapping   │
│  ✅ Second security boundary       │
└────────────────┬───────────────────┘
                 ▼
Layer 4: Business Logic
┌────────────────────────────────────┐
│  Route Handler                     │
│  • Resource ownership checks       │
│  • Data validation                 │
│  ✅ Final security boundary        │
└────────────────┬───────────────────┘
                 ▼
Layer 5: Audit Trail
┌────────────────────────────────────┐
│  Audit Logging                     │
│  • Record all actions              │
│  • Compliance & forensics          │
│  ✅ Monitoring                     │
└────────────────────────────────────┘
```

---

## 📈 Permission Statistics

```
┌────────────────────────────────────────────────────────┐
│  Permission Distribution by Role                       │
└────────────────────────────────────────────────────────┘

Doctor          ████████████████░░░░  17 permissions
Admin           ████████████████████  24 permissions
Nurse           ████████████░░░░░░░░  12 permissions
Physiotherapist █████████░░░░░░░░░░░   9 permissions
Pharmacist      █████░░░░░░░░░░░░░░░   5 permissions
SuperAdmin      ████████████████████  ALL permissions

┌────────────────────────────────────────────────────────┐
│  Most Common Permissions                               │
└────────────────────────────────────────────────────────┘

viewPatients      ████████████████  5 roles (83%)
viewDashboard     ██████████████░░  5 roles (83%)
viewFiles         ██████████████░░  5 roles (83%)
uploadFiles       ████████████░░░░  4 roles (67%)
viewVisits        ████████████░░░░  4 roles (67%)
```

---

## 🎯 Quick Decision Tree

```
Need to implement permission check?
│
├─ Backend Route?
│  └─ Use: checkPermission('permissionName')
│
├─ Frontend Component?
│  ├─ Whole component?
│  │  └─ Use: <RoleGuard allowedRoles={[...]} />
│  │
│  └─ Specific UI element?
│     └─ Use: usePermissions() hook
│
├─ Database Query?
│  └─ Add: WHERE organization_id = user.organizationId
│
└─ Custom Logic?
   └─ Use: getUserPermissions(userId)
```

---

## 📋 Checklist

### Setting Up RBAC

- [ ] Run `rbac_seed.sql` to create roles and permissions
- [ ] Verify 6 roles created
- [ ] Verify 30+ permissions created
- [ ] Test permission middleware
- [ ] Migrate existing users to RBAC roles
- [ ] Update frontend to use RoleGuard
- [ ] Add permission checks to all routes
- [ ] Enable audit logging
- [ ] Test with different user roles
- [ ] Document custom roles (if any)

### Adding New Feature

- [ ] Identify required permissions
- [ ] Create new permissions (if needed)
- [ ] Assign permissions to appropriate roles
- [ ] Add `checkPermission()` to backend routes
- [ ] Add permission checks to frontend
- [ ] Test with allowed roles
- [ ] Test with denied roles
- [ ] Add to audit logs
- [ ] Update documentation

### Troubleshooting

- [ ] Check user has role assigned (`users.role_id`)
- [ ] Verify role has permission (`role_permissions`)
- [ ] Confirm route has middleware
- [ ] Check organization scoping
- [ ] Verify token is valid
- [ ] Review audit logs
- [ ] Test with curl/Postman
- [ ] Check console for errors

---

## 📚 Documentation Quick Links

| Document | Best For |
|----------|----------|
| [RBAC_README.md](./RBAC_README.md) | 📖 Start here - Overview |
| [RBAC_SYSTEM_GUIDE.md](./RBAC_SYSTEM_GUIDE.md) | 📚 Complete reference |
| [RBAC_QUICK_REFERENCE.md](./RBAC_QUICK_REFERENCE.md) | ⚡ Fast lookups |
| [RBAC_ARCHITECTURE_DIAGRAM.md](./RBAC_ARCHITECTURE_DIAGRAM.md) | 🏗️ System design |
| [RBAC_IMPLEMENTATION_EXAMPLES.md](./RBAC_IMPLEMENTATION_EXAMPLES.md) | 💻 Code examples |
| [RBAC_VISUAL_SUMMARY.md](./RBAC_VISUAL_SUMMARY.md) | 👁️ Quick visual guide |

---

## 🎨 Color Legend

Throughout the documentation:

- 🩺 **Blue** - Doctor/Medical roles
- 💊 **Purple** - Pharmacist roles
- 👔 **Gray** - Administrative roles
- ✅ **Green** - Allowed/Success
- ❌ **Red** - Denied/Error
- ⚠️ **Yellow** - Warning/Caution
- 👁️ **Eye** - View permissions
- ✏️ **Pencil** - Edit permissions
- ➕ **Plus** - Create permissions
- 🗑️ **Trash** - Delete permissions

---

**Need more details?** See [RBAC_README.md](./RBAC_README.md) for documentation index.

