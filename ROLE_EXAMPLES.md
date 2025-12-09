# Role Examples

This document shows examples of roles in the ClinicConnect RBAC system.

## Role Structure

A role in the system has the following structure:

```json
{
  "id": 1,
  "name": "doctor",
  "description": "Can view and edit patient data, consultations, prescriptions, and lab results",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "userCount": 15,
  "permissions": [
    {
      "id": 1,
      "name": "viewPatients",
      "description": "View patient data"
    },
    {
      "id": 2,
      "name": "editPatients",
      "description": "Edit patient data"
    },
    {
      "id": 3,
      "name": "createPatients",
      "description": "Create new patient profiles"
    }
    // ... more permissions
  ]
}
```

## Predefined Role Examples

### 1. Doctor Role

**Purpose:** Full clinical access for medical practitioners

```json
{
  "id": 1,
  "name": "doctor",
  "description": "Can view and edit patient data, consultations, prescriptions, and lab results",
  "userCount": 12,
  "permissions": [
    {
      "id": 1,
      "name": "viewPatients",
      "description": "View patient data"
    },
    {
      "id": 2,
      "name": "editPatients",
      "description": "Edit patient data"
    },
    {
      "id": 3,
      "name": "createPatients",
      "description": "Create new patient profiles"
    },
    {
      "id": 4,
      "name": "createVisit",
      "description": "Create patient visits"
    },
    {
      "id": 5,
      "name": "viewVisits",
      "description": "View visit records"
    },
    {
      "id": 6,
      "name": "editVisits",
      "description": "Edit visit records"
    },
    {
      "id": 7,
      "name": "createLabOrder",
      "description": "Create lab orders"
    },
    {
      "id": 8,
      "name": "viewLabResults",
      "description": "View lab results"
    },
    {
      "id": 9,
      "name": "editLabResults",
      "description": "Update lab results"
    },
    {
      "id": 10,
      "name": "createConsultation",
      "description": "Create specialist consultations"
    },
    {
      "id": 11,
      "name": "viewConsultation",
      "description": "View consultation records"
    },
    {
      "id": 12,
      "name": "createConsultationForm",
      "description": "Create consultation form templates"
    },
    {
      "id": 13,
      "name": "viewMedications",
      "description": "View prescribed medications"
    },
    {
      "id": 14,
      "name": "createPrescription",
      "description": "Create prescriptions"
    },
    {
      "id": 15,
      "name": "viewPrescriptions",
      "description": "View prescription records"
    },
    {
      "id": 16,
      "name": "createReferral",
      "description": "Create patient referrals"
    },
    {
      "id": 17,
      "name": "viewReferrals",
      "description": "View referral records"
    },
    {
      "id": 18,
      "name": "manageReferrals",
      "description": "Accept/reject referrals"
    },
    {
      "id": 19,
      "name": "uploadFiles",
      "description": "Upload files and documents"
    },
    {
      "id": 20,
      "name": "viewFiles",
      "description": "View and download files"
    },
    {
      "id": 21,
      "name": "viewDashboard",
      "description": "Access the dashboard"
    },
    {
      "id": 22,
      "name": "viewReports",
      "description": "View analytics and performance reports"
    }
  ]
}
```

### 2. Nurse Role

**Purpose:** Patient care and vital monitoring

```json
{
  "id": 2,
  "name": "nurse",
  "description": "Can view and update basic patient data, vitals, and lab orders",
  "userCount": 8,
  "permissions": [
    {
      "id": 1,
      "name": "viewPatients",
      "description": "View patient data"
    },
    {
      "id": 2,
      "name": "editPatients",
      "description": "Edit patient data"
    },
    {
      "id": 3,
      "name": "createPatients",
      "description": "Create new patient profiles"
    },
    {
      "id": 4,
      "name": "createVisit",
      "description": "Create patient visits"
    },
    {
      "id": 5,
      "name": "viewVisits",
      "description": "View visit records"
    },
    {
      "id": 7,
      "name": "createLabOrder",
      "description": "Create lab orders"
    },
    {
      "id": 8,
      "name": "viewLabResults",
      "description": "View lab results"
    },
    {
      "id": 11,
      "name": "viewConsultation",
      "description": "View consultation records"
    },
    {
      "id": 13,
      "name": "viewMedications",
      "description": "View prescribed medications"
    },
    {
      "id": 15,
      "name": "viewPrescriptions",
      "description": "View prescription records"
    },
    {
      "id": 16,
      "name": "createReferral",
      "description": "Create patient referrals"
    },
    {
      "id": 17,
      "name": "viewReferrals",
      "description": "View referral records"
    },
    {
      "id": 19,
      "name": "uploadFiles",
      "description": "Upload files and documents"
    },
    {
      "id": 20,
      "name": "viewFiles",
      "description": "View and download files"
    },
    {
      "id": 21,
      "name": "viewDashboard",
      "description": "Access the dashboard"
    }
  ]
}
```

### 3. Pharmacist Role

**Purpose:** Medication management and dispensing

```json
{
  "id": 3,
  "name": "pharmacist",
  "description": "Can view prescriptions and manage medication dispensing",
  "userCount": 3,
  "permissions": [
    {
      "id": 1,
      "name": "viewPatients",
      "description": "View patient data"
    },
    {
      "id": 13,
      "name": "viewMedications",
      "description": "View prescribed medications"
    },
    {
      "id": 14,
      "name": "manageMedications",
      "description": "Manage and dispense medications"
    },
    {
      "id": 15,
      "name": "viewPrescriptions",
      "description": "View prescription records"
    },
    {
      "id": 20,
      "name": "viewFiles",
      "description": "View and download files"
    },
    {
      "id": 21,
      "name": "viewDashboard",
      "description": "Access the dashboard"
    }
  ]
}
```

### 4. Receptionist Role

**Purpose:** Front desk staff handling patient registration

```json
{
  "id": 4,
  "name": "receptionist",
  "description": "Front desk staff handling patient registration and appointments",
  "userCount": 5,
  "permissions": [
    {
      "id": 1,
      "name": "viewPatients",
      "description": "View patient data"
    },
    {
      "id": 3,
      "name": "createPatients",
      "description": "Create new patient profiles"
    },
    {
      "id": 4,
      "name": "createVisit",
      "description": "Create patient visits"
    },
    {
      "id": 5,
      "name": "viewVisits",
      "description": "View visit records"
    },
    {
      "id": 21,
      "name": "viewDashboard",
      "description": "Access the dashboard"
    }
  ]
}
```

### 5. Admin Role

**Purpose:** Organization management and staff administration

```json
{
  "id": 5,
  "name": "admin",
  "description": "Can manage staff, patients, and organization settings",
  "userCount": 2,
  "permissions": [
    // All patient permissions
    { "id": 1, "name": "viewPatients" },
    { "id": 2, "name": "editPatients" },
    { "id": 3, "name": "createPatients" },
    
    // All visit permissions
    { "id": 4, "name": "createVisit" },
    { "id": 5, "name": "viewVisits" },
    { "id": 6, "name": "editVisits" },
    
    // All lab permissions
    { "id": 7, "name": "createLabOrder" },
    { "id": 8, "name": "viewLabResults" },
    { "id": 9, "name": "editLabResults" },
    
    // All consultation permissions
    { "id": 10, "name": "createConsultation" },
    { "id": 11, "name": "viewConsultation" },
    { "id": 12, "name": "createConsultationForm" },
    
    // All medication permissions
    { "id": 13, "name": "viewMedications" },
    { "id": 14, "name": "manageMedications" },
    { "id": 15, "name": "viewPrescriptions" },
    
    // All referral permissions
    { "id": 16, "name": "createReferral" },
    { "id": 17, "name": "viewReferrals" },
    { "id": 18, "name": "manageReferrals" },
    
    // User management
    { "id": 23, "name": "manageUsers", "description": "Manage staff and user roles" },
    { "id": 24, "name": "viewUsers", "description": "View staff information" },
    
    // Organization management
    { "id": 25, "name": "manageOrganizations", "description": "Manage organization settings" },
    { "id": 26, "name": "viewOrganizations", "description": "View organization information" },
    
    // File management
    { "id": 19, "name": "uploadFiles" },
    { "id": 20, "name": "viewFiles" },
    { "id": 21, "name": "deleteFiles" },
    
    // Dashboard and reports
    { "id": 21, "name": "viewDashboard" },
    { "id": 27, "name": "viewReports" },
    { "id": 28, "name": "viewAuditLogs" }
  ]
}
```

## Custom Role Example

### Lab Technician Role

**Purpose:** Custom role for laboratory staff

```json
{
  "id": 10,
  "name": "lab_technician",
  "description": "Laboratory tests and analysis",
  "userCount": 4,
  "permissions": [
    {
      "id": 1,
      "name": "viewPatients",
      "description": "View patient data"
    },
    {
      "id": 7,
      "name": "createLabOrder",
      "description": "Create lab orders"
    },
    {
      "id": 8,
      "name": "viewLabResults",
      "description": "View lab results"
    },
    {
      "id": 9,
      "name": "editLabResults",
      "description": "Update lab results"
    },
    {
      "id": 20,
      "name": "viewFiles",
      "description": "View and download files"
    },
    {
      "id": 21,
      "name": "viewDashboard",
      "description": "Access the dashboard"
    }
  ]
}
```

## API Response Examples

### Get All Roles

```bash
GET /api/access-control/roles
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "doctor",
    "description": "Can view and edit patient data...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "userCount": 12,
    "permissions": [...]
  },
  {
    "id": 2,
    "name": "nurse",
    "description": "Can view and update basic patient data...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "userCount": 8,
    "permissions": [...]
  }
]
```

### Get Single Role

```bash
GET /api/access-control/roles/1
```

**Response:**
```json
{
  "id": 1,
  "name": "doctor",
  "description": "Can view and edit patient data, consultations, prescriptions, and lab results",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "userCount": 12,
  "permissions": [
    {
      "id": 1,
      "name": "viewPatients",
      "description": "View patient data"
    },
    {
      "id": 2,
      "name": "editPatients",
      "description": "Edit patient data"
    }
    // ... more permissions
  ]
}
```

### Create Role

```bash
POST /api/access-control/roles
Content-Type: application/json

{
  "name": "lab_technician",
  "description": "Laboratory tests and analysis",
  "permissionIds": [1, 7, 8, 9, 20, 21]
}
```

**Response:**
```json
{
  "id": 10,
  "name": "lab_technician",
  "description": "Laboratory tests and analysis",
  "createdAt": "2024-12-08T09:00:00.000Z"
}
```

## Database Schema

### Roles Table

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Role-Permissions Junction Table

```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) NOT NULL,
  permission_id INTEGER REFERENCES permissions(id) NOT NULL
);
```

## Role Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | number | Unique role identifier |
| `name` | string | Role name (unique, max 50 chars) |
| `description` | string | Human-readable role description |
| `createdAt` | timestamp | When the role was created |
| `userCount` | number | Number of users assigned to this role |
| `permissions` | array | List of permissions assigned to this role |

## Permission Categories

Permissions are grouped by category (prefix before the dot):

- **Patient Management**: `viewPatients`, `editPatients`, `createPatients`
- **Visits**: `createVisit`, `viewVisits`, `editVisits`
- **Laboratory**: `createLabOrder`, `viewLabResults`, `editLabResults`
- **Consultations**: `createConsultation`, `viewConsultation`, `createConsultationForm`
- **Medications**: `viewMedications`, `manageMedications`, `createPrescription`, `viewPrescriptions`
- **Referrals**: `createReferral`, `viewReferrals`, `manageReferrals`
- **Users**: `manageUsers`, `viewUsers`
- **Organizations**: `manageOrganizations`, `viewOrganizations`
- **Files**: `uploadFiles`, `viewFiles`, `deleteFiles`
- **Dashboard**: `viewDashboard`, `viewReports`, `viewAuditLogs`

## See Also

- [RBAC System Guide](./RBAC_SYSTEM_GUIDE.md) - Complete system documentation
- [RBAC Quick Reference](./RBAC_QUICK_REFERENCE.md) - Quick lookup guide
- [Role Management Test Results](./ROLE_MANAGEMENT_TEST_RESULTS.md) - Test coverage

