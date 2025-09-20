/**
 * Utility functions for patient and staff name formatting operations
 */

export interface PatientName {
  title?: string | null;
  firstName: string;
  lastName: string;
}

export interface StaffName {
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
  role?: string;
}

/**
 * Format patient name with title consistently across the application
 */
export function formatPatientName(patient: PatientName): string {
  const { title, firstName, lastName } = patient;
  
  // Build the full name with title if available
  const titlePart = title ? `${title} ` : '';
  const namePart = `${firstName} ${lastName}`.trim();
  
  return `${titlePart}${namePart}`;
}

/**
 * Format patient name for display in dropdowns or lists (shorter format)
 */
export function formatPatientNameShort(patient: PatientName): string {
  return formatPatientName(patient);
}

/**
 * Get patient initials for avatar display
 */
export function getPatientInitials(patient: PatientName): string {
  const firstName = patient.firstName || '';
  const lastName = patient.lastName || '';
  
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
}

/**
 * Format staff/doctor name with title consistently across the application
 */
export function formatStaffName(staff: StaffName): string {
  const { title, firstName, lastName, username, role } = staff;
  
  // If we have firstName and lastName, use them
  if (firstName && lastName) {
    const titlePart = title ? `${title} ` : (role === 'doctor' ? 'Dr. ' : '');
    return `${titlePart}${firstName} ${lastName}`.trim();
  }
  
  // Fallback to username if no proper name
  if (username) {
    const titlePart = title ? `${title} ` : (role === 'doctor' ? 'Dr. ' : '');
    return `${titlePart}${username}`.trim();
  }
  
  return 'Healthcare Staff';
}

/**
 * Get staff initials for avatar display
 */
export function getStaffInitials(staff: StaffName): string {
  const firstName = staff.firstName || '';
  const lastName = staff.lastName || '';
  const username = staff.username || '';
  
  if (firstName && lastName) {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  }
  
  if (username) {
    return username.charAt(0).toUpperCase() + (username.charAt(1) || '').toUpperCase();
  }
  
  return 'HS';
}