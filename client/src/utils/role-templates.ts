/**
 * Role Templates - Predefined role configurations for quick role creation
 */

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  permissionPatterns: string[]; // Permission name patterns to match
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'doctor',
    name: 'Doctor',
    description: 'Full clinical access - patient management, prescriptions, lab orders, consultations',
    icon: 'Stethoscope',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    permissionPatterns: [
      'patients',
      'visits',
      'prescriptions',
      'lab',
      'consultations',
      'referrals',
      'view',
      'create',
      'edit'
    ]
  },
  {
    id: 'nurse',
    name: 'Nurse',
    description: 'Patient care - view patients, create visits, record vitals, view lab results',
    icon: 'Heart',
    color: 'bg-green-50 text-green-700 border-green-200',
    permissionPatterns: [
      'patients.view',
      'visits.create',
      'visits.view',
      'lab.view',
      'vitals',
      'view'
    ]
  },
  {
    id: 'pharmacist',
    name: 'Pharmacist',
    description: 'Medication management - view prescriptions, manage medications, dispense drugs',
    icon: 'Pill',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    permissionPatterns: [
      'prescriptions',
      'medications',
      'dispense',
      'view',
      'manage'
    ]
  },
  {
    id: 'physiotherapist',
    name: 'Physiotherapist',
    description: 'Physical therapy - consultations, forms, patient assessments',
    icon: 'Activity',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    permissionPatterns: [
      'consultations',
      'forms',
      'patients.view',
      'visits.view',
      'create'
    ]
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Front desk - patient registration, appointments, basic patient viewing',
    icon: 'ClipboardList',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    permissionPatterns: [
      'patients.create',
      'patients.view',
      'appointments',
      'view'
    ]
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Organization management - staff, settings, reports, full access',
    icon: 'Shield',
    color: 'bg-red-50 text-red-700 border-red-200',
    permissionPatterns: [
      'users',
      'organizations',
      'settings',
      'reports',
      'manage',
      'view',
      'create',
      'edit'
    ]
  },
  {
    id: 'lab-technician',
    name: 'Lab Technician',
    description: 'Laboratory operations - create lab orders, update results, view patient data',
    icon: 'FlaskConical',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    permissionPatterns: [
      'lab',
      'results',
      'orders',
      'create',
      'edit',
      'view'
    ]
  },
  {
    id: 'read-only',
    name: 'Read-Only Viewer',
    description: 'View-only access - can view data but cannot create or edit',
    icon: 'Eye',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    permissionPatterns: [
      'view'
    ]
  }
];

/**
 * Get permission IDs that match the template patterns
 */
export function getTemplatePermissionIds(
  template: RoleTemplate,
  allPermissions: Array<{ id: number; name: string }>
): number[] {
  return allPermissions
    .filter(perm => 
      template.permissionPatterns.some(pattern => 
        perm.name.toLowerCase().includes(pattern.toLowerCase())
      )
    )
    .map(perm => perm.id);
}

