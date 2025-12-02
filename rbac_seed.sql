-- RBAC Seed Data for Clinic Management System
-- Run this in your PostgreSQL database to set up roles and permissions

-- 1. Insert Roles
INSERT INTO roles (name, description) VALUES
('doctor', 'Can view and edit patient data, consultations, prescriptions, and lab results'),
('nurse', 'Can view and update basic patient data, vitals, and lab orders'),
('pharmacist', 'Can view prescriptions and manage medication dispensing'),
('physiotherapist', 'Can view patients and create specialized consultation forms'),
('receptionist', 'Front desk staff handling patient registration and appointments'),
('admin', 'Can manage staff, patients, and organization settings'),
('superadmin', 'Full platform access across all organizations');

-- 2. Insert Permissions
INSERT INTO permissions (name, description) VALUES
-- Patient Data
('viewPatients', 'View patient data'),
('editPatients', 'Edit patient data'),
('createPatients', 'Create new patient profiles'),

-- Visits & Consultations
('createVisit', 'Create patient visits'),
('viewVisits', 'View visit records'),
('editVisits', 'Edit visit records'),

-- Lab Orders & Results
('createLabOrder', 'Create lab orders'),
('viewLabResults', 'View lab results'),
('editLabResults', 'Update lab results'),

-- Consultations & Forms
('createConsultation', 'Create specialist consultations'),
('viewConsultation', 'View consultation records'),
('createConsultationForm', 'Create consultation form templates'),

-- Medications & Prescriptions
('viewMedications', 'View prescribed medications'),
('manageMedications', 'Manage and dispense medications'),
('createPrescription', 'Create prescriptions'),
('viewPrescriptions', 'View prescription records'),

-- Referrals
('createReferral', 'Create patient referrals'),
('viewReferrals', 'View referral records'),
('manageReferrals', 'Accept/reject referrals'),

-- Staff & Users
('manageUsers', 'Manage staff and user roles'),
('viewUsers', 'View staff information'),

-- Organizations
('manageOrganizations', 'Manage organization settings'),
('viewOrganizations', 'View organization information'),

-- File Management
('uploadFiles', 'Upload files and documents'),
('viewFiles', 'View and download files'),
('deleteFiles', 'Delete files'),

-- Dashboard & Analytics
('viewDashboard', 'Access the dashboard'),
('viewReports', 'View analytics and performance reports'),
('viewAuditLogs', 'View system audit logs'),

-- Appointments
('viewAppointments', 'View appointment schedules'),
('createAppointments', 'Create and schedule appointments'),
('editAppointments', 'Modify existing appointments'),
('cancelAppointments', 'Cancel appointments'),

-- Billing (for receptionist)
('viewBilling', 'View invoices and billing information'),
('createInvoice', 'Create invoices for patients'),
('processPayment', 'Process and record payments');

-- 3. Assign Role-Permission Mappings

-- Doctor Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE name IN (
    'viewPatients', 'editPatients', 'createPatients',
    'createVisit', 'viewVisits', 'editVisits',
    'createLabOrder', 'viewLabResults', 'editLabResults',
    'createConsultation', 'viewConsultation', 'createConsultationForm',
    'viewMedications', 'createPrescription', 'viewPrescriptions',
    'createReferral', 'viewReferrals', 'manageReferrals',
    'viewAppointments', 'createAppointments', 'editAppointments',
    'uploadFiles', 'viewFiles',
    'viewDashboard', 'viewReports'
);

-- Nurse Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN (
    'viewPatients', 'editPatients', 'createPatients',
    'createVisit', 'viewVisits',
    'createLabOrder', 'viewLabResults',
    'viewConsultation',
    'viewMedications', 'viewPrescriptions',
    'createReferral', 'viewReferrals',
    'viewAppointments', 'createAppointments',
    'uploadFiles', 'viewFiles',
    'viewDashboard'
);

-- Pharmacist Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
    'viewPatients',
    'viewMedications', 'manageMedications', 'viewPrescriptions',
    'viewFiles',
    'viewDashboard'
);

-- Physiotherapist Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE name IN (
    'viewPatients', 'editPatients',
    'viewVisits',
    'createConsultation', 'viewConsultation', 'createConsultationForm',
    'viewReferrals', 'manageReferrals',
    'uploadFiles', 'viewFiles',
    'viewDashboard'
);

-- Receptionist Permissions (Front Desk)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE name IN (
    'viewPatients', 'createPatients', 'editPatients',
    'viewVisits',
    'viewAppointments', 'createAppointments', 'editAppointments', 'cancelAppointments',
    'viewPrescriptions',
    'viewBilling', 'createInvoice', 'processPayment',
    'viewFiles', 'uploadFiles',
    'viewDashboard'
);

-- Admin Permissions (Organization-level)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 6, id FROM permissions WHERE name IN (
    'viewPatients', 'editPatients', 'createPatients',
    'createVisit', 'viewVisits', 'editVisits',
    'createLabOrder', 'viewLabResults', 'editLabResults',
    'createConsultation', 'viewConsultation', 'createConsultationForm',
    'viewMedications', 'manageMedications', 'createPrescription', 'viewPrescriptions',
    'createReferral', 'viewReferrals', 'manageReferrals',
    'manageUsers', 'viewUsers',
    'viewOrganizations',
    'viewAppointments', 'createAppointments', 'editAppointments', 'cancelAppointments',
    'viewBilling', 'createInvoice', 'processPayment',
    'uploadFiles', 'viewFiles', 'deleteFiles',
    'viewDashboard', 'viewReports', 'viewAuditLogs'
);

-- Superadmin Permissions (All permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 7, id FROM permissions;

-- Display created roles and their permission counts
SELECT 
    r.name as role_name,
    r.description,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.description
ORDER BY r.id;