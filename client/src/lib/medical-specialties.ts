/**
 * Centralized Medical Specialties Constants
 * 
 * This file contains the single source of truth for medical specialties
 * used throughout the application. Import from here to avoid duplication.
 */

// Core medical specialties - alphabetically sorted
export const MEDICAL_SPECIALTIES = [
  'Anesthesiology',
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'ENT (Ear, Nose, Throat)',
  'Family Medicine',
  'Gastroenterology',
  'General Medicine',
  'General Surgery',
  'Gynecology',
  'Hematology',
  'Nephrology',
  'Neurology',
  'Obstetrics',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Surgery',
  'Urology',
] as const;

// Type for specialty values
export type MedicalSpecialty = typeof MEDICAL_SPECIALTIES[number];

// Specialty options with value/label format for select components
export const SPECIALTY_OPTIONS = MEDICAL_SPECIALTIES.map(specialty => ({
  value: specialty.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''),
  label: specialty,
}));

// Specialty options with "Other" option for referrals
export const SPECIALTY_OPTIONS_WITH_OTHER = [
  ...SPECIALTY_OPTIONS,
  { value: 'other', label: 'Other' },
];

// Simple specialty list with "Other" for quick selection
export const SPECIALTIES_WITH_OTHER = [...MEDICAL_SPECIALTIES, 'Other'] as const;

// Healthcare facilities in Nigeria (commonly used for referrals)
export const HEALTHCARE_FACILITIES = [
  'Lagos University Teaching Hospital (LUTH)',
  'University College Hospital (UCH), Ibadan',
  'Obafemi Awolowo University Teaching Hospital, Ile-Ife',
  'Lagos State University Teaching Hospital (LASUTH)',
  'Federal Medical Centre, Abeokuta',
  'Federal Medical Centre, Owo',
  'Olabisi Onabanjo University Teaching Hospital',
  'Irrua Specialist Teaching Hospital',
  'National Hospital, Abuja',
  'Lagos Island Maternity Hospital',
  'St. Nicholas Hospital, Lagos',
  'Reddington Hospital',
  'The Bridge Clinic',
  'Vedic Lifecare Hospital',
  'EKO Hospital',
] as const;

export type HealthcareFacility = typeof HEALTHCARE_FACILITIES[number];

