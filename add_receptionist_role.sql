-- Add Receptionist Role to Existing Database
-- Run this if you already have the base RBAC setup and just need to add the receptionist role

-- 1. Add new permissions for appointments and billing (if they don't exist)
INSERT INTO permissions (name, description) 
SELECT 'viewAppointments', 'View appointment schedules'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'viewAppointments');

INSERT INTO permissions (name, description) 
SELECT 'createAppointments', 'Create and schedule appointments'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'createAppointments');

INSERT INTO permissions (name, description) 
SELECT 'editAppointments', 'Modify existing appointments'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'editAppointments');

INSERT INTO permissions (name, description) 
SELECT 'cancelAppointments', 'Cancel appointments'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'cancelAppointments');

INSERT INTO permissions (name, description) 
SELECT 'viewBilling', 'View invoices and billing information'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'viewBilling');

INSERT INTO permissions (name, description) 
SELECT 'createInvoice', 'Create invoices for patients'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'createInvoice');

INSERT INTO permissions (name, description) 
SELECT 'processPayment', 'Process and record payments'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'processPayment');

-- 2. Add the Receptionist role (if it doesn't exist)
INSERT INTO roles (name, description) 
SELECT 'receptionist', 'Front desk staff handling patient registration and appointments'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'receptionist');

-- 3. Get the receptionist role ID and assign permissions
DO $$
DECLARE
    receptionist_role_id INTEGER;
BEGIN
    -- Get the receptionist role ID
    SELECT id INTO receptionist_role_id FROM roles WHERE name = 'receptionist';
    
    -- Delete existing permissions for this role (clean slate)
    DELETE FROM role_permissions WHERE role_id = receptionist_role_id;
    
    -- Insert receptionist permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT receptionist_role_id, id FROM permissions WHERE name IN (
        'viewPatients', 
        'createPatients', 
        'editPatients',
        'viewVisits',
        'viewAppointments', 
        'createAppointments', 
        'editAppointments', 
        'cancelAppointments',
        'viewPrescriptions',
        'viewBilling', 
        'createInvoice', 
        'processPayment',
        'viewFiles', 
        'uploadFiles',
        'viewDashboard'
    );
    
    RAISE NOTICE 'Receptionist role created with % permissions', 
        (SELECT COUNT(*) FROM role_permissions WHERE role_id = receptionist_role_id);
END $$;

-- 4. Also add appointment permissions to Doctor role
DO $$
DECLARE
    doctor_role_id INTEGER;
BEGIN
    SELECT id INTO doctor_role_id FROM roles WHERE name = 'doctor';
    
    -- Add appointment permissions if not already assigned
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT doctor_role_id, id FROM permissions 
    WHERE name IN ('viewAppointments', 'createAppointments', 'editAppointments')
    AND id NOT IN (SELECT permission_id FROM role_permissions WHERE role_id = doctor_role_id);
END $$;

-- 5. Add appointment permissions to Nurse role
DO $$
DECLARE
    nurse_role_id INTEGER;
BEGIN
    SELECT id INTO nurse_role_id FROM roles WHERE name = 'nurse';
    
    -- Add appointment permissions if not already assigned
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT nurse_role_id, id FROM permissions 
    WHERE name IN ('viewAppointments', 'createAppointments')
    AND id NOT IN (SELECT permission_id FROM role_permissions WHERE role_id = nurse_role_id);
END $$;

-- 6. Display results
SELECT 
    r.name as role_name,
    r.description,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name IN ('doctor', 'nurse', 'pharmacist', 'receptionist')
GROUP BY r.id, r.name, r.description
ORDER BY r.name;

-- Show receptionist permissions
SELECT 
    'receptionist' as role,
    p.name as permission,
    p.description
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'receptionist'
ORDER BY p.name;

