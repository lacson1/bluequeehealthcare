# Complete List of System Permissions

This document lists all available permissions in the ClinicConnect system, organized by category.

## 📋 Total Permissions: 30

---

## 👥 **Patients** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `viewPatients` | View patient data | Read-only access to patient profiles and medical history |
| `editPatients` | Edit patient data | Can modify patient information, demographics, and records |
| `createPatients` | Create new patient profiles | Can register new patients in the system |

---

## 📋 **Visits** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `createVisit` | Create patient visits | Can record new patient consultations and visits |
| `viewVisits` | View visit records | Read-only access to visit history and consultation notes |
| `editVisits` | Edit visit records | Can modify existing visit records and documentation |

---

## 🧪 **Lab** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `createLabOrder` | Create lab orders | Can order blood tests, lab work, and diagnostic tests |
| `viewLabResults` | View lab results | Read-only access to test results and lab reports |
| `editLabResults` | Update lab results | Can update lab results, add notes, and mark as reviewed |

---

## 📝 **Consultations** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `createConsultation` | Create specialist consultations | Can create specialist consultation records |
| `viewConsultation` | View consultation records | Read-only access to consultation history |
| `createConsultationForm` | Create consultation form templates | Can design and create custom consultation form templates |

---

## 💊 **Medications** (4 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `viewMedications` | View prescribed medications | Read-only access to medication database and prescriptions |
| `manageMedications` | Manage and dispense medications | Can add/edit medications in database and manage dispensing |
| `createPrescription` | Create prescriptions | Can prescribe medications to patients |
| `viewPrescriptions` | View prescription records | Read-only access to prescription history |

---

## ↗️ **Referrals** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `createReferral` | Create patient referrals | Can refer patients to specialists or other facilities |
| `viewReferrals` | View referral records | Read-only access to referral history |
| `manageReferrals` | Accept/reject referrals | Can accept, reject, or update referral status |

---

## 👤 **Users** (2 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `manageUsers` | Manage staff and user roles | Full user management - can add/edit staff, assign roles |
| `viewUsers` | View staff information | Read-only access to staff directory and profiles |

---

## 🏢 **Organizations** (2 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `manageOrganizations` | Manage organization settings | Can configure organization settings, branding, letterhead |
| `viewOrganizations` | View organization information | Read-only access to organization details |

---

## 📁 **Files** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `uploadFiles` | Upload files and documents | Can upload documents, images, reports to patient records |
| `viewFiles` | View and download files | Read-only access to uploaded files and documents |
| `deleteFiles` | Delete files | Can remove files from the system |

---

## 📊 **Dashboard & Analytics** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `viewDashboard` | Access the dashboard | Can view the main dashboard and overview |
| `viewReports` | View analytics and performance reports | Read-only access to analytics, reports, and statistics |
| `viewAuditLogs` | View system audit logs | Can view system activity logs and audit trails |

---

## 📅 **Appointments** (4 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `viewAppointments` | View appointment schedules | Read-only access to appointment calendar and schedules |
| `createAppointments` | Create and schedule appointments | Can book new appointments for patients |
| `editAppointments` | Modify existing appointments | Can update appointment details, times, and notes |
| `cancelAppointments` | Cancel appointments | Can cancel scheduled appointments |

---

## 💰 **Billing** (3 permissions)

| Permission Name | Description | Impact |
|----------------|-------------|--------|
| `viewBilling` | View invoices and billing information | Read-only access to invoices and billing records |
| `createInvoice` | Create invoices for patients | Can generate invoices for services rendered |
| `processPayment` | Process and record payments | Can record payments and update billing status |

---

## 📊 Permission Summary by Category

| Category | Count | Permissions |
|----------|-------|-------------|
| **Patients** | 3 | viewPatients, editPatients, createPatients |
| **Visits** | 3 | createVisit, viewVisits, editVisits |
| **Lab** | 3 | createLabOrder, viewLabResults, editLabResults |
| **Consultations** | 3 | createConsultation, viewConsultation, createConsultationForm |
| **Medications** | 4 | viewMedications, manageMedications, createPrescription, viewPrescriptions |
| **Referrals** | 3 | createReferral, viewReferrals, manageReferrals |
| **Users** | 2 | manageUsers, viewUsers |
| **Organizations** | 2 | manageOrganizations, viewOrganizations |
| **Files** | 3 | uploadFiles, viewFiles, deleteFiles |
| **Dashboard** | 3 | viewDashboard, viewReports, viewAuditLogs |
| **Appointments** | 4 | viewAppointments, createAppointments, editAppointments, cancelAppointments |
| **Billing** | 3 | viewBilling, createInvoice, processPayment |
| **TOTAL** | **30** | |

---

## 🔍 Quick Reference

### Permission Naming Convention

- **`view*`** - Read-only access (e.g., `viewPatients`, `viewVisits`)
- **`create*`** - Can create new records (e.g., `createVisit`, `createPrescription`)
- **`edit*`** - Can modify existing records (e.g., `editPatients`, `editVisits`)
- **`manage*`** - Full management capabilities (e.g., `manageUsers`, `manageMedications`)
- **`delete*`** - Can remove records (e.g., `deleteFiles`)

### Common Permission Patterns

1. **CRUD Operations**: Most entities have `view`, `create`, `edit` permissions
2. **Management**: Some entities have `manage` for full control
3. **Special Actions**: Some have specific actions like `cancelAppointments`, `processPayment`

---

## 💡 Usage Tips

1. **Principle of Least Privilege**: Only grant permissions necessary for the role
2. **View Permissions**: Usually safe to grant widely for transparency
3. **Edit/Create Permissions**: Grant to roles that need to modify data
4. **Manage Permissions**: Reserve for administrative roles
5. **Delete Permissions**: Use sparingly - only for roles that need cleanup capabilities

---

## 🔗 Related Documentation

- [RBAC System Guide](./RBAC_SYSTEM_GUIDE.md) - Complete RBAC documentation
- [RBAC Quick Reference](./RBAC_QUICK_REFERENCE.md) - Quick lookup guide
- [Role Management](./ROLE_MANAGEMENT_TEST_RESULTS.md) - Role management examples

---

**Last Updated**: Based on `rbac_seed.sql` and system schema

