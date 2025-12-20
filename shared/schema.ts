import { pgTable, text, serial, integer, date, timestamp, decimal, boolean, varchar, json, numeric, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations (Multi-tenant support)
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).default('clinic'), // clinic, hospital, health_center
  logoUrl: varchar('logo_url', { length: 255 }),
  themeColor: varchar('theme_color', { length: 20 }).default('#3B82F6'),
  address: varchar('address', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  website: varchar('website', { length: 255 }),
  // Enhanced letterhead configuration
  letterheadConfig: json('letterhead_config').$type<{
    logo?: string;
    tagline?: string;
    accreditation?: string;
    certifications?: string[];
    footerNote?: string;
    disclaimer?: string;
    primaryColor?: string;
    secondaryColor?: string;
    contactLayout?: 'horizontal' | 'vertical';
    showLogo?: boolean;
    showTagline?: boolean;
    showAccreditation?: boolean;
    showCertifications?: boolean;
    headerHeight?: number;
    footerHeight?: number;
  }>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// RBAC System Tables
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id).notNull()
});

// User-Organization membership table (for multi-organization support)
export const userOrganizations = pgTable('user_organizations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  roleId: integer('role_id').references(() => roles.id), // Role within this organization
  isDefault: boolean('is_default').default(false), // Default organization for this user
  joinedAt: timestamp('joined_at').defaultNow()
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  profileImageUrl: varchar('profile_image_url', { length: 255 }),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // Keep for backward compatibility
  roleId: integer('role_id').references(() => roles.id), // New RBAC role reference
  title: varchar('title', { length: 10 }), // Dr., Mr., Mrs., Ms., Prof., etc.
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  photoUrl: varchar('photo_url', { length: 255 }),
  organizationId: integer('organization_id').references(() => organizations.id),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  passwordResetToken: varchar('password_reset_token', { length: 100 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  twoFactorSecret: varchar('two_factor_secret', { length: 100 }),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 10 }), // Mr., Mrs., Ms., Dr., Prof., etc.
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  // Industry-standard patient identification fields
  bloodType: varchar("blood_type", { length: 5 }), // A+, A-, B+, B-, AB+, AB-, O+, O-
  preferredLanguage: varchar("preferred_language", { length: 50 }).default('English'),
  interpreterNeeded: boolean("interpreter_needed").default(false),
  // Primary Care Provider
  primaryCareProviderId: integer("primary_care_provider_id").references(() => users.id),
  // Emergency Contact Information
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 50 }),
  // Code Status (for inpatient/acute settings)
  codeStatus: varchar("code_status", { length: 20 }).default('full'), // full, dnr, dni, dnr_dni, comfort
  // Additional identifiers
  nationalId: varchar("national_id", { length: 50 }),
  insuranceId: varchar("insurance_id", { length: 50 }),

  // === Nigeria-Specific Optional Fields ===
  // Nigerian Address Structure (all optional)
  state: varchar("state", { length: 50 }), // Nigerian state (e.g., Lagos, Kano, FCT)
  lga: varchar("lga", { length: 100 }), // Local Government Area
  town: varchar("town", { length: 100 }), // Town/City
  streetAddress: varchar("street_address", { length: 255 }), // Street address
  landmark: varchar("landmark", { length: 200 }), // Nearby landmark for easier location
  postalCode: varchar("postal_code", { length: 10 }), // Nigerian postal code

  // Nigerian National Identification (all optional)
  ninNumber: varchar("nin_number", { length: 11 }), // National Identification Number (11 digits)
  bvnNumber: varchar("bvn_number", { length: 11 }), // Bank Verification Number (11 digits)

  // Secondary phone (common in Nigeria to have multiple lines)
  secondaryPhone: varchar("secondary_phone", { length: 20 }),

  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").references(() => users.id),
  visitDate: timestamp("visit_date").defaultNow().notNull(),
  bloodPressure: text("blood_pressure"),
  heartRate: integer("heart_rate"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  complaint: text("complaint"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  followUpDate: date("follow_up_date"),
  visitType: text("visit_type").notNull().default("consultation"),
  status: text("status").notNull().default("draft"), // 'draft' | 'final'
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const labResults = pgTable("lab_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  testName: text("test_name").notNull(),
  testDate: timestamp("test_date").defaultNow().notNull(),
  result: text("result").notNull(),
  normalRange: text("normal_range"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  expiryDate: date("expiry_date"),
  supplier: text("supplier"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  // Smart auto-fill fields for faster prescribing
  defaultDosage: text("default_dosage"), // e.g., "500mg", "1 tablet"
  defaultFrequency: text("default_frequency"), // e.g., "Twice daily", "Every 8 hours"
  defaultDuration: text("default_duration"), // e.g., "7 days", "2 weeks"
  defaultInstructions: text("default_instructions"), // e.g., "Take with food", "Before meals"
  commonConditions: text("common_conditions"), // JSON array of conditions this treats
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  visitId: integer("visit_id").references(() => visits.id),
  medicationId: integer("medication_id"), // Optional reference - DO NOT use foreign key to allow flexibility
  medicationDatabaseId: integer("medication_database_id").references(() => medications.id), // Reference to comprehensive medications database
  medicationName: text("medication_name").notNull(), // For manual entries when medication is not in database OR to store name from medicines/medications
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions"),
  prescribedBy: text("prescribed_by").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  pharmacyId: integer("pharmacy_id").references(() => pharmacies.id), // Reference to selected pharmacy
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable('referrals', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id),
  fromUserId: integer('from_user_id').references(() => users.id),
  toRole: varchar('to_role', { length: 20 }),
  reason: varchar('reason', { length: 255 }),
  date: date('date').defaultNow(),
  status: varchar('status', { length: 20 }).default('pending')
});

export const vitalSigns = pgTable('vital_signs', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  bloodPressureSystolic: integer('blood_pressure_systolic'),
  bloodPressureDiastolic: integer('blood_pressure_diastolic'),
  heartRate: integer('heart_rate'),
  temperature: decimal('temperature', { precision: 4, scale: 1 }),
  respiratoryRate: integer('respiratory_rate'),
  oxygenSaturation: integer('oxygen_saturation'),
  weight: decimal('weight', { precision: 5, scale: 2 }),
  height: decimal('height', { precision: 5, scale: 2 }),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  recordedBy: varchar('recorded_by', { length: 100 }).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id)
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // 'patient', 'visit', 'prescription', etc.
  entityId: integer('entity_id'), // ID of the affected record
  details: text('details'), // JSON string with additional details
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4/IPv6 support
  userAgent: varchar('user_agent', { length: 500 }),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// Patient-Staff Secure Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  staffId: integer('staff_id').references(() => users.id),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('general').notNull(), // general, medical, appointment, lab_result
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // low, normal, high, urgent
  status: varchar('status', { length: 20 }).default('sent').notNull(), // sent, read, replied, archived
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
  repliedAt: timestamp('replied_at'),
  recipientType: varchar('recipient_type', { length: 50 }).default('Healthcare Team').notNull(),
  recipientRole: varchar('recipient_role', { length: 50 }),
  assignedTo: integer('assigned_to').references(() => users.id),
  routingReason: text('routing_reason'),
  organizationId: integer('organization_id').references(() => organizations.id),
});

export const labTests = pgTable('lab_tests', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }), // Test code (e.g., "HGB", "CBC")
  loincCode: varchar('loinc_code', { length: 50 }), // LOINC standard code
  category: varchar('category', { length: 50 }), // e.g., "Blood Test"
  description: varchar('description', { length: 255 }),
  units: varchar('units', { length: 50 }),
  referenceRange: varchar('reference_range', { length: 100 }),
  departmentId: integer('department_id').references(() => labDepartments.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  isActive: boolean('is_active').default(true),
  priority: varchar('priority', { length: 20 }).default('routine'), // routine, urgent, stat
  sampleType: varchar('sample_type', { length: 50 }), // blood, urine, stool, etc.
  methodOfCollection: varchar('method_of_collection', { length: 100 }),
  preparationInstructions: text('preparation_instructions'), // Patient preparation
  estimatedTime: varchar('estimated_time', { length: 50 }), // e.g., "2-4 hours"
  cost: decimal('cost', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const labOrders = pgTable('lab_orders', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  orderedBy: integer('ordered_by').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending'), // pending, in_progress, completed, cancelled
  priority: varchar('priority', { length: 20 }).default('routine'), // routine, urgent, stat
  clinicalNotes: text('clinical_notes'),
  diagnosis: text('diagnosis'),
  organizationId: integer('organization_id').references(() => organizations.id),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  specimenCollectedAt: timestamp('specimen_collected_at'),
  specimenCollectedBy: integer('specimen_collected_by').references(() => users.id),
  reportedAt: timestamp('reported_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at')
});

export const labOrderItems = pgTable('lab_order_items', {
  id: serial('id').primaryKey(),
  labOrderId: integer('lab_order_id').notNull().references(() => labOrders.id),
  labTestId: integer('lab_test_id').notNull().references(() => labTests.id),
  result: text('result'),
  numericResult: decimal('numeric_result', { precision: 15, scale: 4 }),
  isAbnormal: boolean('is_abnormal').default(false),
  abnormalFlags: varchar('abnormal_flags', { length: 50 }), // H, L, HH, LL, etc.
  remarks: text('remarks'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, in_progress, completed, cancelled
  completedBy: integer('completed_by').references(() => users.id),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  completedAt: timestamp('completed_at')
});

// Lab departments/sections
export const labDepartments = pgTable('lab_departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }), // Department code (e.g., "HEM", "CHEM")
  description: text('description'),
  headOfDepartment: integer('head_of_department').references(() => users.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Lab equipment/instruments
export const labEquipment = pgTable('lab_equipment', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  model: varchar('model', { length: 50 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  departmentId: integer('department_id').references(() => labDepartments.id),
  status: varchar('status', { length: 20 }).default('active'), // active, maintenance, out_of_order
  lastMaintenanceDate: date('last_maintenance_date'),
  nextMaintenanceDate: date('next_maintenance_date'),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Lab worksheets/batches for processing multiple samples together
export const labWorksheets = pgTable('lab_worksheets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  departmentId: integer('department_id').references(() => labDepartments.id),
  equipmentId: integer('equipment_id').references(() => labEquipment.id),
  technicianId: integer('technician_id').references(() => users.id),
  status: varchar('status', { length: 20 }).default('open'), // open, in_progress, completed, verified
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Track which lab order items are processed in which worksheet
export const worksheetItems = pgTable('worksheet_items', {
  id: serial('id').primaryKey(),
  worksheetId: integer('worksheet_id').notNull().references(() => labWorksheets.id),
  labOrderItemId: integer('lab_order_item_id').notNull().references(() => labOrderItems.id),
  position: integer('position'), // Position in the worksheet
  createdAt: timestamp('created_at').defaultNow()
});

// Lab panels - Common test groupings (CBC, BMP, Lipid Panel, etc.)
export const labPanels = pgTable('lab_panels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Complete Blood Count (CBC)"
  code: varchar('code', { length: 50 }), // Panel code (e.g., "CBC", "BMP")
  description: text('description'),
  category: varchar('category', { length: 50 }), // Hematology, Chemistry, Immunology
  departmentId: integer('department_id').references(() => labDepartments.id),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  estimatedTime: varchar('estimated_time', { length: 50 }), // e.g., "4-6 hours"
  sampleType: varchar('sample_type', { length: 50 }), // blood, urine, etc.
  preparationInstructions: text('preparation_instructions'), // e.g., "Fast for 12 hours"
  isCommon: boolean('is_common').default(false), // Flag for frequently ordered panels
  organizationId: integer('organization_id').references(() => organizations.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Junction table linking panels to individual tests
export const labPanelTests = pgTable('lab_panel_tests', {
  id: serial('id').primaryKey(),
  panelId: integer('panel_id').notNull().references(() => labPanels.id),
  testId: integer('test_id').notNull().references(() => labTests.id),
  isRequired: boolean('is_required').default(true), // Some tests in panel may be optional
  displayOrder: integer('display_order'), // Order to display tests in panel
  createdAt: timestamp('created_at').defaultNow()
});

export const medications = pgTable('medications', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  genericName: varchar('generic_name', { length: 150 }),
  brandName: varchar('brand_name', { length: 150 }),
  category: varchar('category', { length: 50 }), // e.g., "Antibiotic", "Analgesic"
  dosageForm: varchar('dosage_form', { length: 50 }), // e.g., "Tablet", "Syrup", "Injection"
  strength: varchar('strength', { length: 50 }), // e.g., "500mg", "250mg/5ml"
  manufacturer: varchar('manufacturer', { length: 100 }),
  activeIngredient: varchar('active_ingredient', { length: 200 }),
  indications: text('indications'), // What it's used for
  contraindications: text('contraindications'), // When not to use
  sideEffects: text('side_effects'),
  dosageAdult: varchar('dosage_adult', { length: 100 }),
  dosageChild: varchar('dosage_child', { length: 100 }),
  frequency: varchar('frequency', { length: 50 }), // e.g., "twice daily", "every 8 hours"
  routeOfAdministration: varchar('route_of_administration', { length: 50 }), // oral, IV, IM, etc.
  storageConditions: varchar('storage_conditions', { length: 100 }),
  shelfLife: varchar('shelf_life', { length: 50 }),
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
  isControlled: boolean('is_controlled').default(false), // For controlled substances
  prescriptionRequired: boolean('prescription_required').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Specialty Assessments - Specialist-specific assessment templates
export const consultationForms = pgTable('consultation_forms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Cardiology Assessment"
  description: text('description'),
  specialistRole: varchar('specialist_role', { length: 50 }).notNull(), // doctor, nurse, physiotherapist
  createdBy: integer('created_by').references(() => users.id).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  formStructure: json('form_structure').notNull(), // JSON structure defining fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Consultation Records - Completed specialty assessments linked to patients
export const consultationRecords = pgTable('consultation_records', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  formId: integer('form_id').references(() => consultationForms.id).notNull(),
  visitId: integer('visit_id').references(() => visits.id),
  filledBy: integer('filled_by').references(() => users.id).notNull(),
  formData: json('form_data').notNull(), // JSON data with filled responses
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, completed, reviewed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const vaccinations = pgTable('vaccinations', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  vaccineName: varchar('vaccine_name', { length: 100 }).notNull(),
  dateAdministered: date('date_administered').notNull(),
  administeredBy: varchar('administered_by', { length: 100 }).notNull(),
  batchNumber: varchar('batch_number', { length: 50 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  notes: text('notes'),
  nextDueDate: date('next_due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const allergies = pgTable('allergies', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  allergen: varchar('allergen', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'drug', 'food', 'environmental'
  severity: varchar('severity', { length: 20 }).notNull(), // 'mild', 'moderate', 'severe'
  reaction: text('reaction').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const medicalHistory = pgTable('medical_history', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  condition: varchar('condition', { length: 200 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // 'diagnosis', 'surgery', 'hospitalization', 'chronic_condition'
  dateOccurred: date('date_occurred').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'active', 'resolved', 'ongoing'
  description: text('description').notNull(),
  treatment: text('treatment'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dischargeLetters = pgTable('discharge_letters', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  visitId: integer('visit_id').references(() => visits.id),
  admissionDate: date('admission_date').notNull(),
  dischargeDate: date('discharge_date').notNull(),
  diagnosis: text('diagnosis').notNull(),
  treatmentSummary: text('treatment_summary').notNull(),
  medicationsOnDischarge: text('medications_on_discharge'),
  followUpInstructions: text('follow_up_instructions'),
  followUpDate: date('follow_up_date'),
  attendingPhysicianId: integer('attending_physician_id').references(() => users.id),
  dischargeCondition: varchar('discharge_condition', { length: 50 }).notNull(), // 'improved', 'stable', 'unchanged', 'deceased'
  specialInstructions: text('special_instructions'),
  restrictions: text('restrictions'),
  dietaryAdvice: text('dietary_advice'),
  warningSymptoms: text('warning_symptoms'),
  emergencyContact: varchar('emergency_contact', { length: 100 }),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // 'draft', 'finalized', 'sent'
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => users.id).notNull(),
  appointmentDate: date('appointment_date').notNull(),
  appointmentTime: varchar('appointment_time', { length: 10 }).notNull(), // "09:00", "14:30"
  duration: integer('duration').default(30).notNull(), // in minutes
  type: varchar('type', { length: 50 }).default('consultation').notNull(),
  status: varchar('status', { length: 20 }).default('scheduled').notNull(), // scheduled, confirmed, in-progress, completed, cancelled
  notes: text('notes'),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(), // low, medium, high, urgent
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  isPrivate: boolean('is_private').default(false).notNull(), // Internal staff notes vs family-visible
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // normal, urgent, critical
  commentType: varchar('comment_type', { length: 50 }).default('general').notNull(), // general, medical_note, care_instruction, family_update
  replyToId: integer('reply_to_id'), // For threaded conversations, self-reference added below
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Pharmacy Activity Logs
export const pharmacyActivities = pgTable('pharmacy_activities', {
  id: serial('id').primaryKey(),
  pharmacistId: integer('pharmacist_id').references(() => users.id).notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // dispensing, restocking, review, consultation, inventory_check
  patientId: integer('patient_id').references(() => patients.id), // Optional for patient-specific activities
  medicineId: integer('medicine_id').references(() => medicines.id), // Optional for medicine-specific activities
  prescriptionId: integer('prescription_id').references(() => prescriptions.id), // Optional for prescription-related activities
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity'), // For dispensing/restocking activities
  comments: text('comments'),
  status: varchar('status', { length: 20 }).default('completed').notNull(), // pending, completed, cancelled
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // low, normal, high, urgent
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Pharmacies table for prescription routing
export const pharmacies = pgTable('pharmacies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 100 }),
  licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
  pharmacistInCharge: varchar('pharmacist_in_charge', { length: 100 }).notNull(),
  operatingHours: varchar('operating_hours', { length: 100 }), // e.g., "Mon-Fri: 8AM-8PM, Sat: 9AM-5PM"
  isActive: boolean('is_active').default(true).notNull(),
  isPartner: boolean('is_partner').default(false).notNull(), // Partner pharmacy with direct integration
  deliveryAvailable: boolean('delivery_available').default(false).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Medication Review Assignments
export const medicationReviewAssignments = pgTable('medication_review_assignments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  prescriptionId: integer('prescription_id').references(() => prescriptions.id),
  assignedBy: integer('assigned_by').references(() => users.id).notNull(),
  assignedTo: integer('assigned_to').references(() => users.id).notNull(),
  reviewType: varchar('review_type', { length: 50 }).default('routine').notNull(), // routine, urgent, medication_safety, dosage_adjustment
  dueDate: date('due_date').notNull(),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, in_progress, completed, cancelled
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // low, normal, high, urgent
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at')
});

// Enhanced Medication Reviews
export const medicationReviews = pgTable('medication_reviews', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  pharmacistId: integer('pharmacist_id').references(() => users.id).notNull(),
  visitId: integer('visit_id').references(() => visits.id),
  reviewType: varchar('review_type', { length: 50 }).default('comprehensive').notNull(), // comprehensive, drug_interaction, allergy_check, adherence

  // Clinical Assessment Fields
  drugInteractions: text('drug_interactions'),
  allergyCheck: text('allergy_check'),
  dosageReview: text('dosage_review'),
  contraindications: text('contraindications'),
  sideEffectsMonitoring: text('side_effects_monitoring'),

  // Patient Counseling Fields
  patientCounseling: text('patient_counseling'),
  medicationReconciliation: text('medication_reconciliation'),
  adherenceAssessment: text('adherence_assessment'),
  dispensingInstructions: text('dispensing_instructions'),

  // Professional Assessment
  pharmacistRecommendations: text('pharmacist_recommendations'),
  clinicalNotes: text('clinical_notes'),
  followUpRequired: text('follow_up_required'),
  costConsiderations: text('cost_considerations'),
  therapeuticAlternatives: text('therapeutic_alternatives'),

  // Review Metadata
  prescriptionsReviewed: integer('prescriptions_reviewed').default(0),
  reviewDuration: integer('review_duration'), // in minutes
  status: varchar('status', { length: 20 }).default('completed').notNull(), // draft, completed, reviewed, approved
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Pinned Consultation Forms
export const pinnedConsultationForms = pgTable('pinned_consultation_forms', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  consultationFormId: integer('consultation_form_id').references(() => consultationForms.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Error Tracking Tables
export const errorLogs = pgTable('error_logs', {
  id: serial('id').primaryKey(),
  errorId: varchar('error_id', { length: 100 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(), // NETWORK, VALIDATION, AUTHENTICATION, etc.
  severity: varchar('severity', { length: 20 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  message: text('message').notNull(),
  stack: text('stack'),
  userId: integer('user_id').references(() => users.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  patientId: integer('patient_id').references(() => patients.id),
  sessionId: varchar('session_id', { length: 100 }),
  url: varchar('url', { length: 500 }),
  userAgent: text('user_agent'),
  action: varchar('action', { length: 100 }),
  component: varchar('component', { length: 100 }),
  resolved: boolean('resolved').default(false),
  retryable: boolean('retryable').default(false),
  metadata: json('metadata'), // Additional error context
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at')
});

export const systemHealth = pgTable('system_health', {
  id: serial('id').primaryKey(),
  metric: varchar('metric', { length: 50 }).notNull(), // response_time, error_rate, memory_usage, etc.
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }), // ms, %, MB, etc.
  organizationId: integer('organization_id').references(() => organizations.id),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// =====================
// LONGEVITY ASSESSMENT TABLES
// Evidence-based data points for comprehensive health & longevity tracking
// =====================

// Lifestyle Assessment - Exercise, Sleep, Smoking, Alcohol, Diet
export const lifestyleAssessments = pgTable('lifestyle_assessments', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  
  // Exercise & Physical Activity
  exerciseFrequency: varchar('exercise_frequency', { length: 50 }), // none, 1-2x/week, 3-4x/week, 5+/week
  exerciseType: varchar('exercise_type', { length: 100 }), // cardio, strength, mixed, flexibility
  exerciseDurationMinutes: integer('exercise_duration_minutes'), // average per session
  dailySteps: integer('daily_steps'), // average daily steps
  vo2MaxEstimate: decimal('vo2_max_estimate', { precision: 5, scale: 2 }), // ml/kg/min
  
  // Sleep Quality
  sleepDurationHours: decimal('sleep_duration_hours', { precision: 3, scale: 1 }), // average hours
  sleepQuality: varchar('sleep_quality', { length: 50 }), // poor, fair, good, excellent
  sleepLatencyMinutes: integer('sleep_latency_minutes'), // time to fall asleep
  sleepDisturbances: integer('sleep_disturbances'), // times waking per night
  usingSleepAids: boolean('using_sleep_aids').default(false),
  
  // Smoking Status
  smokingStatus: varchar('smoking_status', { length: 50 }), // never, former, current
  cigarettesPerDay: integer('cigarettes_per_day'),
  yearsSmoked: integer('years_smoked'),
  yearsSinceQuit: integer('years_since_quit'),
  packYears: decimal('pack_years', { precision: 5, scale: 2 }), // calculated: (cigs/day * years) / 20
  
  // Alcohol Consumption
  alcoholStatus: varchar('alcohol_status', { length: 50 }), // none, occasional, moderate, heavy
  drinksPerWeek: integer('drinks_per_week'),
  bingeEpisodesPerMonth: integer('binge_episodes_per_month'),
  
  // Diet & Nutrition
  dietType: varchar('diet_type', { length: 100 }), // omnivore, vegetarian, vegan, mediterranean, keto, etc.
  vegetableServingsPerDay: integer('vegetable_servings_per_day'),
  fruitServingsPerDay: integer('fruit_servings_per_day'),
  processedFoodFrequency: varchar('processed_food_frequency', { length: 50 }), // rarely, sometimes, often, daily
  sugarIntake: varchar('sugar_intake', { length: 50 }), // low, moderate, high
  waterIntakeLiters: decimal('water_intake_liters', { precision: 3, scale: 1 }),
  caffeineIntakeMg: integer('caffeine_intake_mg'),
  
  // Fasting & Meal Patterns
  intermittentFasting: boolean('intermittent_fasting').default(false),
  fastingWindowHours: integer('fasting_window_hours'),
  mealsPerDay: integer('meals_per_day'),
  
  // Supplements
  takingSupplements: boolean('taking_supplements').default(false),
  supplementsList: text('supplements_list'), // JSON array of supplements
  
  // Assessment metadata
  assessmentDate: timestamp('assessment_date').defaultNow().notNull(),
  assessedBy: varchar('assessed_by', { length: 100 }),
  notes: text('notes')
});

// Body Composition - Detailed body measurements beyond basic vitals
export const bodyComposition = pgTable('body_composition', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  
  // Core Measurements
  weight: decimal('weight', { precision: 5, scale: 2 }), // kg
  height: decimal('height', { precision: 5, scale: 2 }), // cm
  bmi: decimal('bmi', { precision: 4, scale: 1 }), // calculated
  
  // Body Composition
  bodyFatPercentage: decimal('body_fat_percentage', { precision: 4, scale: 1 }),
  visceralFatLevel: integer('visceral_fat_level'), // 1-59 scale
  muscleMassKg: decimal('muscle_mass_kg', { precision: 5, scale: 2 }),
  boneMassKg: decimal('bone_mass_kg', { precision: 4, scale: 2 }),
  waterPercentage: decimal('water_percentage', { precision: 4, scale: 1 }),
  metabolicAge: integer('metabolic_age'),
  basalMetabolicRate: integer('basal_metabolic_rate'), // calories/day
  
  // Circumference Measurements
  waistCircumferenceCm: decimal('waist_circumference_cm', { precision: 5, scale: 1 }),
  hipCircumferenceCm: decimal('hip_circumference_cm', { precision: 5, scale: 1 }),
  waistToHipRatio: decimal('waist_to_hip_ratio', { precision: 3, scale: 2 }),
  neckCircumferenceCm: decimal('neck_circumference_cm', { precision: 4, scale: 1 }),
  
  // Fitness Metrics
  gripStrengthKg: decimal('grip_strength_kg', { precision: 4, scale: 1 }), // dominant hand
  sitToStandSeconds: decimal('sit_to_stand_seconds', { precision: 4, scale: 1 }), // 5 reps
  balanceTestSeconds: integer('balance_test_seconds'), // single leg stand
  flexibilityReachCm: decimal('flexibility_reach_cm', { precision: 4, scale: 1 }), // sit-and-reach
  
  // Measurement metadata
  measurementMethod: varchar('measurement_method', { length: 100 }), // DEXA, BIA, skinfold, etc.
  measuredAt: timestamp('measured_at').defaultNow().notNull(),
  measuredBy: varchar('measured_by', { length: 100 }),
  notes: text('notes')
});

// Mental Health Screening - Depression, Anxiety, Stress, Cognition
export const mentalHealthScreenings = pgTable('mental_health_screenings', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  
  // Depression Screening (PHQ-9)
  phq9Score: integer('phq9_score'), // 0-27
  phq9Severity: varchar('phq9_severity', { length: 50 }), // minimal, mild, moderate, moderately_severe, severe
  phq9Responses: text('phq9_responses'), // JSON array of 9 responses (0-3 each)
  
  // Anxiety Screening (GAD-7)
  gad7Score: integer('gad7_score'), // 0-21
  gad7Severity: varchar('gad7_severity', { length: 50 }), // minimal, mild, moderate, severe
  gad7Responses: text('gad7_responses'), // JSON array of 7 responses (0-3 each)
  
  // Perceived Stress Scale (PSS-10)
  pssScore: integer('pss_score'), // 0-40
  pssCategory: varchar('pss_category', { length: 50 }), // low, moderate, high
  
  // Sleep & Fatigue
  insomniaScore: integer('insomnia_score'), // ISI 0-28
  fatigueScore: integer('fatigue_score'), // FSS 9-63
  
  // Cognitive Assessment
  cognitiveScreenType: varchar('cognitive_screen_type', { length: 50 }), // MMSE, MoCA, Mini-Cog
  cognitiveScore: integer('cognitive_score'),
  cognitiveMaxScore: integer('cognitive_max_score'),
  memoryComplaint: boolean('memory_complaint').default(false),
  
  // Wellbeing & Life Satisfaction
  wellbeingScore: integer('wellbeing_score'), // WHO-5 0-25
  lifeSatisfactionScore: integer('life_satisfaction_score'), // 1-10
  purposeScore: integer('purpose_score'), // 1-10
  
  // Resilience & Coping
  resilienceScore: integer('resilience_score'), // Brief Resilience Scale
  copingStyle: varchar('coping_style', { length: 100 }), // adaptive, maladaptive, mixed
  
  // Risk Factors
  suicidalIdeation: boolean('suicidal_ideation').default(false),
  substanceUseRisk: varchar('substance_use_risk', { length: 50 }), // none, low, moderate, high
  socialIsolationRisk: varchar('social_isolation_risk', { length: 50 }), // none, low, moderate, high
  
  // Screening metadata
  screeningDate: timestamp('screening_date').defaultNow().notNull(),
  screenedBy: varchar('screened_by', { length: 100 }),
  referralMade: boolean('referral_made').default(false),
  notes: text('notes')
});

// Social Determinants of Health - Social factors affecting longevity
export const socialDeterminants = pgTable('social_determinants', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  
  // Social Connections
  maritalStatus: varchar('marital_status', { length: 50 }), // single, married, divorced, widowed, partnered
  livingArrangement: varchar('living_arrangement', { length: 100 }), // alone, spouse, family, assisted
  closeRelationshipsCount: integer('close_relationships_count'), // close friends/family
  socialInteractionFrequency: varchar('social_interaction_frequency', { length: 50 }), // daily, weekly, monthly, rarely
  belongsToGroups: boolean('belongs_to_groups').default(false), // clubs, religious, community
  lonelinessScore: integer('loneliness_score'), // UCLA Loneliness Scale 3-9
  
  // Education & Cognitive Engagement
  educationLevel: varchar('education_level', { length: 100 }), // primary, secondary, bachelors, masters, doctorate
  yearsOfEducation: integer('years_of_education'),
  currentlyLearning: boolean('currently_learning').default(false), // taking courses, reading, puzzles
  cognitiveActivities: text('cognitive_activities'), // JSON array
  
  // Employment & Financial
  employmentStatus: varchar('employment_status', { length: 50 }), // employed, unemployed, retired, disabled
  occupationType: varchar('occupation_type', { length: 100 }), // sedentary, active, manual
  financialStress: varchar('financial_stress', { length: 50 }), // none, low, moderate, high
  hasHealthInsurance: boolean('has_health_insurance').default(false),
  
  // Living Environment
  housingType: varchar('housing_type', { length: 100 }), // house, apartment, nursing_home
  housingStability: varchar('housing_stability', { length: 50 }), // stable, at_risk, unstable
  accessToHealthcare: varchar('access_to_healthcare', { length: 50 }), // easy, moderate, difficult
  accessToHealthyFood: varchar('access_to_healthy_food', { length: 50 }), // easy, moderate, difficult
  neighborhoodSafety: varchar('neighborhood_safety', { length: 50 }), // safe, somewhat_safe, unsafe
  
  // Purpose & Meaning
  senseOfPurpose: integer('sense_of_purpose'), // 1-10 scale
  lifeGoals: text('life_goals'), // free text or JSON
  volunteerWork: boolean('volunteer_work').default(false),
  religiousOrSpiritual: boolean('religious_or_spiritual').default(false),
  
  // Adverse Experiences
  childhoodAdverseExperiences: integer('childhood_adverse_experiences'), // ACE score 0-10
  recentMajorLifeEvents: integer('recent_major_life_events'), // count in past year
  chronicStressors: text('chronic_stressors'), // JSON array
  
  // Assessment metadata
  assessmentDate: timestamp('assessment_date').defaultNow().notNull(),
  assessedBy: varchar('assessed_by', { length: 100 }),
  notes: text('notes')
});

// Advanced Biomarkers - Specialized longevity markers
export const advancedBiomarkers = pgTable('advanced_biomarkers', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  
  // Hormonal Panel
  tshMiuL: decimal('tsh_miu_l', { precision: 6, scale: 3 }), // Thyroid
  freeT3PgMl: decimal('free_t3_pg_ml', { precision: 5, scale: 2 }),
  freeT4NgDl: decimal('free_t4_ng_dl', { precision: 4, scale: 2 }),
  testosteroneNgDl: decimal('testosterone_ng_dl', { precision: 6, scale: 1 }), // Total testosterone
  freeTestosteronePgMl: decimal('free_testosterone_pg_ml', { precision: 5, scale: 2 }),
  estradiolPgMl: decimal('estradiol_pg_ml', { precision: 6, scale: 1 }),
  dheaSUgDl: decimal('dhea_s_ug_dl', { precision: 6, scale: 1 }), // DHEA-Sulfate
  cortisolUgDl: decimal('cortisol_ug_dl', { precision: 5, scale: 2 }), // AM cortisol
  igf1NgMl: decimal('igf1_ng_ml', { precision: 6, scale: 1 }), // Insulin-like Growth Factor
  insulinMiuL: decimal('insulin_miu_l', { precision: 6, scale: 2 }), // Fasting insulin
  homaIr: decimal('homa_ir', { precision: 5, scale: 2 }), // Insulin resistance
  
  // Cardiovascular Risk Markers
  apoBMgDl: decimal('apo_b_mg_dl', { precision: 5, scale: 1 }), // Apolipoprotein B
  lpANmolL: decimal('lp_a_nmol_l', { precision: 6, scale: 1 }), // Lipoprotein(a)
  homocysteineMmolL: decimal('homocysteine_mmol_l', { precision: 5, scale: 2 }),
  fibrinogenMgDl: decimal('fibrinogen_mg_dl', { precision: 6, scale: 1 }),
  dDimerNgMl: decimal('d_dimer_ng_ml', { precision: 6, scale: 1 }),
  bnpPgMl: decimal('bnp_pg_ml', { precision: 6, scale: 1 }), // Brain Natriuretic Peptide
  coronaryCalciumScore: integer('coronary_calcium_score'), // Agatston score
  
  // Inflammatory Markers
  hscrpMgL: decimal('hscrp_mg_l', { precision: 5, scale: 2 }), // High-sensitivity CRP
  il6PgMl: decimal('il6_pg_ml', { precision: 5, scale: 2 }), // Interleukin-6
  tnfAlphaPgMl: decimal('tnf_alpha_pg_ml', { precision: 5, scale: 2 }), // TNF-alpha
  ferritinNgMl: decimal('ferritin_ng_ml', { precision: 6, scale: 1 }),
  
  // Kidney Function
  cystatinCMgL: decimal('cystatin_c_mg_l', { precision: 4, scale: 2 }),
  uricAcidMgDl: decimal('uric_acid_mg_dl', { precision: 4, scale: 1 }),
  microalbuminMgL: decimal('microalbumin_mg_l', { precision: 5, scale: 1 }),
  
  // Liver Function Extended
  ggtUL: integer('ggt_u_l'), // Gamma-glutamyl transferase
  albuminGDl: decimal('albumin_g_dl', { precision: 3, scale: 1 }),
  
  // Nutritional Markers
  vitaminDNgMl: decimal('vitamin_d_ng_ml', { precision: 5, scale: 1 }), // 25-OH Vitamin D
  vitaminB12PgMl: decimal('vitamin_b12_pg_ml', { precision: 6, scale: 1 }),
  folatengMl: decimal('folate_ng_ml', { precision: 5, scale: 1 }),
  magnesiumMgDl: decimal('magnesium_mg_dl', { precision: 3, scale: 1 }),
  zincUgDl: decimal('zinc_ug_dl', { precision: 5, scale: 1 }),
  omega3Index: decimal('omega3_index', { precision: 4, scale: 1 }), // % of fatty acids
  
  // Epigenetic / Advanced Aging Markers
  telomereLength: decimal('telomere_length', { precision: 6, scale: 2 }), // T/S ratio or kb
  dnaMethodAge: decimal('dna_meth_age', { precision: 5, scale: 1 }), // Horvath clock
  phenoAge: decimal('pheno_age', { precision: 5, scale: 1 }), // Levine PhenoAge
  grimAge: decimal('grim_age', { precision: 5, scale: 1 }), // GrimAge clock
  
  // Test metadata
  testDate: timestamp('test_date').defaultNow().notNull(),
  labName: varchar('lab_name', { length: 200 }),
  notes: text('notes')
});

// Heart Rate Variability - Important longevity & autonomic health marker
export const heartRateVariability = pgTable('heart_rate_variability', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  
  // Time Domain Measures
  sdnnMs: decimal('sdnn_ms', { precision: 6, scale: 2 }), // Standard deviation of NN intervals
  rmssdMs: decimal('rmssd_ms', { precision: 6, scale: 2 }), // Root mean square of successive differences
  pnn50Percent: decimal('pnn50_percent', { precision: 5, scale: 2 }), // % successive intervals > 50ms
  
  // Frequency Domain Measures
  lfPowerMs2: decimal('lf_power_ms2', { precision: 8, scale: 2 }), // Low frequency power
  hfPowerMs2: decimal('hf_power_ms2', { precision: 8, scale: 2 }), // High frequency power
  lfHfRatio: decimal('lf_hf_ratio', { precision: 5, scale: 2 }), // LF/HF ratio
  
  // Recovery & Readiness
  hrvScore: integer('hrv_score'), // 1-100 composite score
  readinessScore: integer('readiness_score'), // 1-100
  recoveryStatus: varchar('recovery_status', { length: 50 }), // optimal, adequate, compromised
  
  // Context
  measurementContext: varchar('measurement_context', { length: 100 }), // morning, post_exercise, sleep
  deviceUsed: varchar('device_used', { length: 100 }),
  measuredAt: timestamp('measured_at').defaultNow().notNull(),
  notes: text('notes')
});

// Type definitions for new tables
export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = typeof pharmacies.$inferInsert;
export type PharmacyActivity = typeof pharmacyActivities.$inferSelect;
export type InsertPharmacyActivity = typeof pharmacyActivities.$inferInsert;
export type MedicationReview = typeof medicationReviews.$inferSelect;
export type InsertMedicationReview = typeof medicationReviews.$inferInsert;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
export type SystemHealth = typeof systemHealth.$inferSelect;
export type InsertSystemHealth = typeof systemHealth.$inferInsert;
export type PinnedConsultationForm = typeof pinnedConsultationForms.$inferSelect;
export type InsertPinnedConsultationForm = typeof pinnedConsultationForms.$inferInsert;

// Longevity Assessment Types
export type LifestyleAssessment = typeof lifestyleAssessments.$inferSelect;
export type InsertLifestyleAssessment = typeof lifestyleAssessments.$inferInsert;
export type BodyComposition = typeof bodyComposition.$inferSelect;
export type InsertBodyComposition = typeof bodyComposition.$inferInsert;
export type MentalHealthScreening = typeof mentalHealthScreenings.$inferSelect;
export type InsertMentalHealthScreening = typeof mentalHealthScreenings.$inferInsert;
export type SocialDeterminant = typeof socialDeterminants.$inferSelect;
export type InsertSocialDeterminant = typeof socialDeterminants.$inferInsert;
export type AdvancedBiomarker = typeof advancedBiomarkers.$inferSelect;
export type InsertAdvancedBiomarker = typeof advancedBiomarkers.$inferInsert;
export type HeartRateVariability = typeof heartRateVariability.$inferSelect;
export type InsertHeartRateVariability = typeof heartRateVariability.$inferInsert;

// Insert schemas for forms
export const insertPharmacySchema = createInsertSchema(pharmacies);
export const insertPharmacyActivitySchema = createInsertSchema(pharmacyActivities);
export const insertMedicationReviewSchema = createInsertSchema(medicationReviews);
export const insertErrorLogSchema = createInsertSchema(errorLogs);
export const insertSystemHealthSchema = createInsertSchema(systemHealth);

// Longevity Assessment Insert Schemas
export const insertLifestyleAssessmentSchema = createInsertSchema(lifestyleAssessments);
export const insertBodyCompositionSchema = createInsertSchema(bodyComposition);
export const insertMentalHealthScreeningSchema = createInsertSchema(mentalHealthScreenings);
export const insertSocialDeterminantSchema = createInsertSchema(socialDeterminants);
export const insertAdvancedBiomarkerSchema = createInsertSchema(advancedBiomarkers);
export const insertHeartRateVariabilitySchema = createInsertSchema(heartRateVariability);

export const insertPinnedConsultationFormSchema = createInsertSchema(pinnedConsultationForms).omit({
  id: true,
  createdAt: true
} as never);

// Relations
// patientsRelations moved below to include all relations

// visitsRelations moved below to include all relations

export const labResultsRelations = relations(labResults, ({ one }) => ({
  patient: one(patients, {
    fields: [labResults.patientId],
    references: [patients.id],
  }),
}));

export const medicinesRelations = relations(medicines, ({ many }) => ({
  prescriptions: many(prescriptions),
}));

// prescriptionsRelations moved below to include all relations

export const referralsRelations = relations(referrals, ({ one }) => ({
  patient: one(patients, {
    fields: [referrals.patientId],
    references: [patients.id],
  }),
  fromUser: one(users, {
    fields: [referrals.fromUserId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// labTestsRelations moved below to include all relations

export const labPanelsRelations = relations(labPanels, ({ one, many }) => ({
  department: one(labDepartments, {
    fields: [labPanels.departmentId],
    references: [labDepartments.id],
  }),
  panelTests: many(labPanelTests),
}));

export const labPanelTestsRelations = relations(labPanelTests, ({ one }) => ({
  panel: one(labPanels, {
    fields: [labPanelTests.panelId],
    references: [labPanels.id],
  }),
  test: one(labTests, {
    fields: [labPanelTests.testId],
    references: [labTests.id],
  }),
}));

export const medicationsRelations = relations(medications, ({ many }) => ({
  prescriptions: many(prescriptions),
}));

// Consultation Forms Relations
export const consultationFormsRelations = relations(consultationForms, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [consultationForms.createdBy],
    references: [users.id],
  }),
  consultationRecords: many(consultationRecords),
  pinnedByUsers: many(pinnedConsultationForms),
}));

export const pinnedConsultationFormsRelations = relations(pinnedConsultationForms, ({ one }) => ({
  user: one(users, {
    fields: [pinnedConsultationForms.userId],
    references: [users.id],
  }),
  consultationForm: one(consultationForms, {
    fields: [pinnedConsultationForms.consultationFormId],
    references: [consultationForms.id],
  }),
}));

export const consultationRecordsRelations = relations(consultationRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [consultationRecords.patientId],
    references: [patients.id],
  }),
  form: one(consultationForms, {
    fields: [consultationRecords.formId],
    references: [consultationForms.id],
  }),
  visit: one(visits, {
    fields: [consultationRecords.visitId],
    references: [visits.id],
  }),
  filledBy: one(users, {
    fields: [consultationRecords.filledBy],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [comments.patientId],
    references: [patients.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  replyTo: one(comments, {
    fields: [comments.replyToId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
  reminders: many(appointmentReminders),
  organization: one(organizations, {
    fields: [appointments.organizationId],
    references: [organizations.id],
  }),
}));

// Appointment Reminders Relations - moved below after table definition

// Availability Slots Relations - moved below after table definition
// Blackout Dates Relations - moved below after table definition

// Telemedicine Sessions Relations - moved below after table definition

// API Keys Relations - moved below after table definition

// AI Consultations Relations - moved below after table definition
// Clinical Notes Relations - moved below after table definition
// Dismissed Notifications Relations - moved below after table definition
// Tab Configs Relations - moved below after table definition
// Tab Presets Relations - moved below after table definition
// Tab Preset Items Relations - moved below after table definition

// Safety Alerts Relations - moved below after table definition

// Medical Documents Relations - moved below after table definition
// Performance Metrics Relations - moved below after table definition

// Vital Signs Relations
export const vitalSignsRelations = relations(vitalSigns, ({ one }) => ({
  patient: one(patients, {
    fields: [vitalSigns.patientId],
    references: [patients.id],
  }),
  organization: one(organizations, {
    fields: [vitalSigns.organizationId],
    references: [organizations.id],
  }),
}));

// Messages Relations
export const messagesRelations = relations(messages, ({ one }) => ({
  patient: one(patients, {
    fields: [messages.patientId],
    references: [patients.id],
  }),
  staff: one(users, {
    fields: [messages.staffId],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [messages.assignedTo],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [messages.organizationId],
    references: [organizations.id],
  }),
}));

// Lab Orders Relations
export const labOrdersRelations = relations(labOrders, ({ one, many }) => ({
  patient: one(patients, {
    fields: [labOrders.patientId],
    references: [patients.id],
  }),
  orderedBy: one(users, {
    fields: [labOrders.orderedBy],
    references: [users.id],
  }),
  specimenCollectedBy: one(users, {
    fields: [labOrders.specimenCollectedBy],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [labOrders.reviewedBy],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [labOrders.organizationId],
    references: [organizations.id],
  }),
  items: many(labOrderItems),
}));

// Lab Order Items Relations
export const labOrderItemsRelations = relations(labOrderItems, ({ one, many }) => ({
  labOrder: one(labOrders, {
    fields: [labOrderItems.labOrderId],
    references: [labOrders.id],
  }),
  labTest: one(labTests, {
    fields: [labOrderItems.labTestId],
    references: [labTests.id],
  }),
  completedBy: one(users, {
    fields: [labOrderItems.completedBy],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [labOrderItems.verifiedBy],
    references: [users.id],
  }),
  worksheetItems: many(worksheetItems),
}));

// Lab Departments Relations
export const labDepartmentsRelations = relations(labDepartments, ({ one, many }) => ({
  headOfDepartment: one(users, {
    fields: [labDepartments.headOfDepartment],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [labDepartments.organizationId],
    references: [organizations.id],
  }),
  tests: many(labTests),
  panels: many(labPanels),
  equipment: many(labEquipment),
  worksheets: many(labWorksheets),
}));

// Lab Equipment Relations
export const labEquipmentRelations = relations(labEquipment, ({ one, many }) => ({
  department: one(labDepartments, {
    fields: [labEquipment.departmentId],
    references: [labDepartments.id],
  }),
  organization: one(organizations, {
    fields: [labEquipment.organizationId],
    references: [organizations.id],
  }),
  worksheets: many(labWorksheets),
}));

// Lab Worksheets Relations
export const labWorksheetsRelations = relations(labWorksheets, ({ one, many }) => ({
  department: one(labDepartments, {
    fields: [labWorksheets.departmentId],
    references: [labDepartments.id],
  }),
  equipment: one(labEquipment, {
    fields: [labWorksheets.equipmentId],
    references: [labEquipment.id],
  }),
  technician: one(users, {
    fields: [labWorksheets.technicianId],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [labWorksheets.verifiedBy],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [labWorksheets.organizationId],
    references: [organizations.id],
  }),
  items: many(worksheetItems),
}));

// Worksheet Items Relations
export const worksheetItemsRelations = relations(worksheetItems, ({ one }) => ({
  worksheet: one(labWorksheets, {
    fields: [worksheetItems.worksheetId],
    references: [labWorksheets.id],
  }),
  labOrderItem: one(labOrderItems, {
    fields: [worksheetItems.labOrderItemId],
    references: [labOrderItems.id],
  }),
}));

// Lab Tests Relations - Update existing
export const labTestsRelations = relations(labTests, ({ one, many }) => ({
  department: one(labDepartments, {
    fields: [labTests.departmentId],
    references: [labDepartments.id],
  }),
  organization: one(organizations, {
    fields: [labTests.organizationId],
    references: [organizations.id],
  }),
  labResults: many(labResults),
  panelTests: many(labPanelTests),
  orderItems: many(labOrderItems),
}));

// Medication Review Assignments Relations
export const medicationReviewAssignmentsRelations = relations(medicationReviewAssignments, ({ one }) => ({
  patient: one(patients, {
    fields: [medicationReviewAssignments.patientId],
    references: [patients.id],
  }),
  prescription: one(prescriptions, {
    fields: [medicationReviewAssignments.prescriptionId],
    references: [prescriptions.id],
  }),
  assignedBy: one(users, {
    fields: [medicationReviewAssignments.assignedBy],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [medicationReviewAssignments.assignedTo],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [medicationReviewAssignments.organizationId],
    references: [organizations.id],
  }),
}));

// Medication Reviews Relations
export const medicationReviewsRelations = relations(medicationReviews, ({ one }) => ({
  patient: one(patients, {
    fields: [medicationReviews.patientId],
    references: [patients.id],
  }),
  pharmacist: one(users, {
    fields: [medicationReviews.pharmacistId],
    references: [users.id],
  }),
  visit: one(visits, {
    fields: [medicationReviews.visitId],
    references: [visits.id],
  }),
  organization: one(organizations, {
    fields: [medicationReviews.organizationId],
    references: [organizations.id],
  }),
}));

// Pharmacies Relations
export const pharmaciesRelations = relations(pharmacies, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [pharmacies.organizationId],
    references: [organizations.id],
  }),
  prescriptions: many(prescriptions),
}));

// Pharmacy Activities Relations
export const pharmacyActivitiesRelations = relations(pharmacyActivities, ({ one }) => ({
  pharmacist: one(users, {
    fields: [pharmacyActivities.pharmacistId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [pharmacyActivities.patientId],
    references: [patients.id],
  }),
  medicine: one(medicines, {
    fields: [pharmacyActivities.medicineId],
    references: [medicines.id],
  }),
  prescription: one(prescriptions, {
    fields: [pharmacyActivities.prescriptionId],
    references: [prescriptions.id],
  }),
  organization: one(organizations, {
    fields: [pharmacyActivities.organizationId],
    references: [organizations.id],
  }),
}));

// Users Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  userOrganizations: many(userOrganizations),
  visits: many(visits),
  prescriptions: many(prescriptions),
  referrals: many(referrals),
  auditLogs: many(auditLogs),
  consultationForms: many(consultationForms),
  consultationRecords: many(consultationRecords),
  comments: many(comments),
  appointments: many(appointments),
  pharmacyActivities: many(pharmacyActivities),
  medicationReviews: many(medicationReviews),
  medicationReviewAssignments: many(medicationReviewAssignments),
  labOrders: many(labOrders),
  messages: many(messages),
  medicalDocuments: many(medicalDocuments),
  performanceMetrics: many(performanceMetrics),
  proceduralReports: many(proceduralReports),
  patientConsents: many(patientConsents),
  patientReferrals: many(patientReferrals),
  safetyAlerts: many(safetyAlerts),
  invoices: many(invoices),
  payments: many(payments),
  insuranceClaims: many(insuranceClaims),
  servicePrices: many(servicePrices),
  availabilitySlots: many(availabilitySlots),
  blackoutDates: many(blackoutDates),
  telemedicineSessions: many(telemedicineSessions),
  apiKeys: many(apiKeys),
  aiConsultations: many(aiConsultations),
  dismissedNotifications: many(dismissedNotifications),
  tabConfigs: many(tabConfigs),
  tabPresets: many(tabPresets),
  labDepartments: many(labDepartments),
  labWorksheets: many(labWorksheets),
  labOrderItems: many(labOrderItems),
}));

// Organizations Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  patients: many(patients),
  visits: many(visits),
  labResults: many(labResults),
  medicines: many(medicines),
  prescriptions: many(prescriptions),
  messages: many(messages),
  labTests: many(labTests),
  labOrders: many(labOrders),
  labDepartments: many(labDepartments),
  labEquipment: many(labEquipment),
  labWorksheets: many(labWorksheets),
  labPanels: many(labPanels),
  pharmacies: many(pharmacies),
  pharmacyActivities: many(pharmacyActivities),
  medicationReviewAssignments: many(medicationReviewAssignments),
  medicationReviews: many(medicationReviews),
  errorLogs: many(errorLogs),
  systemHealth: many(systemHealth),
  medicalDocuments: many(medicalDocuments),
  performanceMetrics: many(performanceMetrics),
  proceduralReports: many(proceduralReports),
  consentForms: many(consentForms),
  patientConsents: many(patientConsents),
  patientInsurance: many(patientInsurance),
  patientReferrals: many(patientReferrals),
  dischargeLetters: many(dischargeLetters),
  appointments: many(appointments),
  appointmentReminders: many(appointmentReminders),
  availabilitySlots: many(availabilitySlots),
  blackoutDates: many(blackoutDates),
  telemedicineSessions: many(telemedicineSessions),
  apiKeys: many(apiKeys),
  aiConsultations: many(aiConsultations),
  clinicalNotes: many(clinicalNotes),
  dismissedNotifications: many(dismissedNotifications),
  tabConfigs: many(tabConfigs),
  tabPresets: many(tabPresets),
  invoices: many(invoices),
  payments: many(payments),
  insuranceClaims: many(insuranceClaims),
  servicePrices: many(servicePrices),
  userOrganizations: many(userOrganizations),
  vitalSigns: many(vitalSigns),
}));

// Roles Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  userOrganizations: many(userOrganizations),
  rolePermissions: many(rolePermissions),
  tabConfigs: many(tabConfigs),
}));

// Permissions Relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

// Role Permissions Relations
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// User Organizations Relations
export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [userOrganizations.roleId],
    references: [roles.id],
  }),
}));

// Vaccinations Relations
export const vaccinationsRelations = relations(vaccinations, ({ one }) => ({
  patient: one(patients, {
    fields: [vaccinations.patientId],
    references: [patients.id],
  }),
}));

// Allergies Relations
export const allergiesRelations = relations(allergies, ({ one }) => ({
  patient: one(patients, {
    fields: [allergies.patientId],
    references: [patients.id],
  }),
}));

// Medical History Relations
export const medicalHistoryRelations = relations(medicalHistory, ({ one }) => ({
  patient: one(patients, {
    fields: [medicalHistory.patientId],
    references: [patients.id],
  }),
}));

// Discharge Letters Relations
export const dischargeLettersRelations = relations(dischargeLetters, ({ one }) => ({
  patient: one(patients, {
    fields: [dischargeLetters.patientId],
    references: [patients.id],
  }),
  visit: one(visits, {
    fields: [dischargeLetters.visitId],
    references: [visits.id],
  }),
  attendingPhysician: one(users, {
    fields: [dischargeLetters.attendingPhysicianId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [dischargeLetters.organizationId],
    references: [organizations.id],
  }),
}));

// Patients Relations - Update existing
export const patientsRelations = relations(patients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [patients.organizationId],
    references: [organizations.id],
  }),
  primaryCareProvider: one(users, {
    fields: [patients.primaryCareProviderId],
    references: [users.id],
  }),
  visits: many(visits),
  labResults: many(labResults),
  prescriptions: many(prescriptions),
  referrals: many(referrals),
  comments: many(comments),
  consultationRecords: many(consultationRecords),
  appointments: many(appointments),
  pharmacyActivities: many(pharmacyActivities),
  medicationReviews: many(medicationReviews),
  medicationReviewAssignments: many(medicationReviewAssignments),
  vaccinations: many(vaccinations),
  allergies: many(allergies),
  medicalHistory: many(medicalHistory),
  dischargeLetters: many(dischargeLetters),
  messages: many(messages),
  labOrders: many(labOrders),
  medicalDocuments: many(medicalDocuments),
  proceduralReports: many(proceduralReports),
  patientConsents: many(patientConsents),
  patientInsurance: many(patientInsurance),
  patientReferrals: many(patientReferrals),
  safetyAlerts: many(safetyAlerts),
  invoices: many(invoices),
  payments: many(payments),
  insuranceClaims: many(insuranceClaims),
  telemedicineSessions: many(telemedicineSessions),
  aiConsultations: many(aiConsultations),
  vitalSigns: many(vitalSigns),
}));

// Visits Relations - Update existing
export const visitsRelations = relations(visits, ({ one, many }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [visits.doctorId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [visits.organizationId],
    references: [organizations.id],
  }),
  prescriptions: many(prescriptions),
  consultationRecords: many(consultationRecords),
  dischargeLetters: many(dischargeLetters),
  medicationReviews: many(medicationReviews),
}));

// Prescriptions Relations - Update existing
export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  visit: one(visits, {
    fields: [prescriptions.visitId],
    references: [visits.id],
  }),
  medicationDatabase: one(medications, {
    fields: [prescriptions.medicationDatabaseId],
    references: [medications.id],
  }),
  pharmacy: one(pharmacies, {
    fields: [prescriptions.pharmacyId],
    references: [pharmacies.id],
  }),
  organization: one(organizations, {
    fields: [prescriptions.organizationId],
    references: [organizations.id],
  }),
}));

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
} as never);

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  visitDate: true,
} as never).extend({
  patientId: z.number(),
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.coerce.number().optional().nullable(),
  temperature: z.coerce.number().optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  complaint: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatment: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  visitType: z.string().default("consultation"),
  status: z.string().default("final"),
}).transform(data => ({
  ...data,
  // Handle empty string to null conversions
  bloodPressure: data.bloodPressure === "" ? null : data.bloodPressure,
  complaint: data.complaint === "" ? null : data.complaint,
  diagnosis: data.diagnosis === "" ? null : data.diagnosis,
  treatment: data.treatment === "" ? null : data.treatment,
  followUpDate: data.followUpDate === "" ? null : data.followUpDate,
}));

// Frontend form schema (without patientId for form validation) - No restrictions
export const visitFormSchema = z.object({
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.union([z.string(), z.number()]).optional().nullable(),
  temperature: z.union([z.string(), z.number()]).optional().nullable(),
  weight: z.union([z.string(), z.number()]).optional().nullable(),
  complaint: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatment: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  visitType: z.string().optional(),
  status: z.string().optional(),
});

export const insertLabResultSchema = createInsertSchema(labResults).omit({
  id: true,
  testDate: true,
} as never);

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
} as never);

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
} as never);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
} as never);

// Profile update schema (excludes password and username for security)
export const updateProfileSchema = createInsertSchema(users).omit({
  id: true,
  username: true,
  password: true,
  createdAt: true,
} as never);

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  date: true,
} as never);

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

// Lab schema exports
export const insertLabTestSchema = createInsertSchema(labTests).omit({
  id: true,
  createdAt: true,
} as never);

export const insertLabOrderSchema = createInsertSchema(labOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
} as never);

export const insertLabOrderItemSchema = createInsertSchema(labOrderItems).omit({
  id: true,
  completedAt: true,
  verifiedAt: true,
} as never);

export const insertLabPanelSchema = createInsertSchema(labPanels).omit({
  id: true,
  createdAt: true,
} as never);

export const insertLabPanelTestSchema = createInsertSchema(labPanelTests).omit({
  id: true,
  createdAt: true,
} as never);

export const insertLabDepartmentSchema = createInsertSchema(labDepartments).omit({
  id: true,
  createdAt: true,
} as never);

export const insertLabEquipmentSchema = createInsertSchema(labEquipment).omit({
  id: true,
  createdAt: true,
} as never);

export const insertLabWorksheetSchema = createInsertSchema(labWorksheets).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  verifiedAt: true,
} as never);

export const insertWorksheetItemSchema = createInsertSchema(worksheetItems).omit({
  id: true,
  createdAt: true,
} as never);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type LabResult = typeof labResults.$inferSelect;

// Lab system types
export type LabOrder = typeof labOrders.$inferSelect;
export type InsertLabOrder = z.infer<typeof insertLabOrderSchema>;
export type LabOrderItem = typeof labOrderItems.$inferSelect;
export type InsertLabOrderItem = z.infer<typeof insertLabOrderItemSchema>;
export type LabPanel = typeof labPanels.$inferSelect;
export type InsertLabPanel = z.infer<typeof insertLabPanelSchema>;
export type LabPanelTest = typeof labPanelTests.$inferSelect;
export type InsertLabPanelTest = z.infer<typeof insertLabPanelTestSchema>;
export type LabDepartment = typeof labDepartments.$inferSelect;
export type InsertLabDepartment = z.infer<typeof insertLabDepartmentSchema>;
export type LabEquipment = typeof labEquipment.$inferSelect;
export type InsertLabEquipment = z.infer<typeof insertLabEquipmentSchema>;
export type LabWorksheet = typeof labWorksheets.$inferSelect;
export type InsertLabWorksheet = z.infer<typeof insertLabWorksheetSchema>;
export type WorksheetItem = typeof worksheetItems.$inferSelect;
export type InsertWorksheetItem = z.infer<typeof insertWorksheetItemSchema>;

// Type for lab results from lab order items (for completed results)
export type LabResultFromOrder = {
  id: number;
  patientId: number;
  testName: string;
  testDate: Date | null;
  result: string | null;
  normalRange: string | null;
  status: string;
  notes: string | null;
  organizationId: number | null;
  createdAt: Date | null;
};
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Medication Review Assignment Types
export const insertMedicationReviewAssignmentSchema = createInsertSchema(medicationReviewAssignments).omit({
  id: true,
  createdAt: true,
  assignedAt: true,
  startedAt: true,
  completedAt: true,
  assignedBy: true,
  organizationId: true,
} as never);



export type MedicationReviewAssignment = typeof medicationReviewAssignments.$inferSelect;
export type InsertMedicationReviewAssignment = z.infer<typeof insertMedicationReviewAssignmentSchema>;

// Consultation Forms Types
export const insertConsultationFormSchema = createInsertSchema(consultationForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export const insertConsultationRecordSchema = createInsertSchema(consultationRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export type ConsultationForm = typeof consultationForms.$inferSelect;
export type InsertConsultationForm = z.infer<typeof insertConsultationFormSchema>;
export type ConsultationRecord = typeof consultationRecords.$inferSelect;
export type InsertConsultationRecord = z.infer<typeof insertConsultationRecordSchema>;

// Medical Records Insert Schemas
export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({
  id: true,
  createdAt: true,
} as never);

export const insertAllergySchema = createInsertSchema(allergies).omit({
  id: true,
  createdAt: true,
} as never);

export const insertMedicalHistorySchema = createInsertSchema(medicalHistory).omit({
  id: true,
  createdAt: true,
} as never);

export const insertDischargeLetterSchema = createInsertSchema(dischargeLetters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

// Medical Records Types
export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
export type Allergy = typeof allergies.$inferSelect;
export type InsertAllergy = z.infer<typeof insertAllergySchema>;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type InsertMedicalHistory = z.infer<typeof insertMedicalHistorySchema>;
export type DischargeLetter = typeof dischargeLetters.$inferSelect;
export type InsertDischargeLetter = z.infer<typeof insertDischargeLetterSchema>;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
} as never);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  readAt: true,
  repliedAt: true,
} as never);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Medical Documents Table
export const medicalDocuments = pgTable('medical_documents', {
  id: serial('id').primaryKey(),
  fileName: varchar('file_name', { length: 255 }).notNull().unique(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // lab-results, prescriptions, medical-records, etc.
  patientId: integer('patient_id').references(() => patients.id),
  uploadedBy: integer('uploaded_by').references(() => users.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
});

export const insertMedicalDocumentSchema = createInsertSchema(medicalDocuments).omit({
  id: true,
  uploadedAt: true,
} as never);

export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type InsertMedicalDocument = z.infer<typeof insertMedicalDocumentSchema>;

// Performance Metrics Table
export const performanceMetrics = pgTable('performance_metrics', {
  id: serial('id').primaryKey(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  responseTime: integer('response_time').notNull(), // milliseconds
  statusCode: integer('status_code').notNull(),
  memoryUsage: numeric('memory_usage').notNull(), // MB
  cpuUsage: numeric('cpu_usage').notNull(), // milliseconds
  userId: integer('user_id').references(() => users.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  timestamp: true,
} as never);

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;

// Procedural Reports
export const proceduralReports = pgTable('procedural_reports', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  performedBy: integer('performed_by').references(() => users.id).notNull(),
  assistedBy: json('assisted_by').$type<number[]>().default([]), // Array of user IDs
  procedureType: varchar('procedure_type', { length: 100 }).notNull(), // Surgery, Endoscopy, Biopsy, etc.
  procedureName: varchar('procedure_name', { length: 200 }).notNull(),
  indication: text('indication').notNull(), // Reason for procedure
  preOpDiagnosis: text('pre_op_diagnosis'),
  postOpDiagnosis: text('post_op_diagnosis'),
  procedureDetails: text('procedure_details').notNull(), // Detailed description
  findings: text('findings'), // What was found during procedure
  complications: text('complications'), // Any complications
  specimens: text('specimens'), // Specimens taken
  anesthesia: varchar('anesthesia', { length: 100 }), // Type of anesthesia
  duration: integer('duration'), // Duration in minutes
  bloodLoss: integer('blood_loss'), // In ml
  status: varchar('status', { length: 20 }).default('completed'), // scheduled, in_progress, completed, cancelled
  scheduledDate: timestamp('scheduled_date'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  postOpInstructions: text('post_op_instructions'),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: date('follow_up_date'),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Consent Forms
export const consentForms = pgTable('consent_forms', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // procedure, treatment, research, photography, etc.
  consentType: varchar('consent_type', { length: 50 }).notNull(), // informed, surgical, anesthesia, research, etc.
  template: json('template').notNull(), // Form structure
  riskFactors: json('risk_factors').$type<string[]>().default([]),
  benefits: json('benefits').$type<string[]>().default([]),
  alternatives: json('alternatives').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Patient Consents (Signed consent records)
export const patientConsents = pgTable('patient_consents', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  consentFormId: integer('consent_form_id').references(() => consentForms.id).notNull(),
  proceduralReportId: integer('procedural_report_id').references(() => proceduralReports.id), // Link to procedure if applicable
  consentGivenBy: varchar('consent_given_by', { length: 100 }).notNull(), // patient, guardian, next_of_kin
  guardianName: varchar('guardian_name', { length: 100 }), // If consent given by guardian
  guardianRelationship: varchar('guardian_relationship', { length: 50 }), // relationship to patient
  witnessId: integer('witness_id').references(() => users.id), // Staff member who witnessed
  interpreterUsed: boolean('interpreter_used').default(false),
  interpreterName: varchar('interpreter_name', { length: 100 }),
  consentData: json('consent_data').notNull(), // Filled form data
  digitalSignature: text('digital_signature'), // Base64 signature
  signatureDate: timestamp('signature_date').notNull(),
  expiryDate: timestamp('expiry_date'), // Some consents expire
  status: varchar('status', { length: 20 }).default('active'), // active, expired, withdrawn, superseded
  withdrawnDate: timestamp('withdrawn_date'),
  withdrawnReason: text('withdrawn_reason'),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Relations for procedural reports
export const proceduralReportsRelations = relations(proceduralReports, ({ one, many }) => ({
  patient: one(patients, { fields: [proceduralReports.patientId], references: [patients.id] }),
  performer: one(users, { fields: [proceduralReports.performedBy], references: [users.id] }),
  organization: one(organizations, { fields: [proceduralReports.organizationId], references: [organizations.id] }),
  consents: many(patientConsents)
}));

// Relations for consent forms
export const consentFormsRelations = relations(consentForms, ({ one, many }) => ({
  organization: one(organizations, { fields: [consentForms.organizationId], references: [organizations.id] }),
  patientConsents: many(patientConsents)
}));

// Relations for patient consents
export const patientConsentsRelations = relations(patientConsents, ({ one }) => ({
  patient: one(patients, { fields: [patientConsents.patientId], references: [patients.id] }),
  consentForm: one(consentForms, { fields: [patientConsents.consentFormId], references: [consentForms.id] }),
  proceduralReport: one(proceduralReports, { fields: [patientConsents.proceduralReportId], references: [proceduralReports.id] }),
  witness: one(users, { fields: [patientConsents.witnessId], references: [users.id] }),
  organization: one(organizations, { fields: [patientConsents.organizationId], references: [organizations.id] })
}));

// Insert schemas for new tables
export const insertProceduralReportSchema = createInsertSchema(proceduralReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export const insertConsentFormSchema = createInsertSchema(consentForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export const insertPatientConsentSchema = createInsertSchema(patientConsents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

// Patient Insurance
export const patientInsurance = pgTable('patient_insurance', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  provider: varchar('provider', { length: 200 }).notNull(),
  policyNumber: varchar('policy_number', { length: 100 }).notNull(),
  groupNumber: varchar('group_number', { length: 100 }),
  membershipNumber: varchar('membership_number', { length: 100 }),
  coverageType: varchar('coverage_type', { length: 20 }).notNull(), // primary, secondary, tertiary
  policyStatus: varchar('policy_status', { length: 20 }).notNull(), // active, inactive, suspended, expired
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date'),
  deductible: decimal('deductible', { precision: 10, scale: 2 }),
  copay: decimal('copay', { precision: 8, scale: 2 }),
  coinsurance: decimal('coinsurance', { precision: 5, scale: 2 }),
  maximumBenefit: decimal('maximum_benefit', { precision: 12, scale: 2 }),
  notes: text('notes'),
  providerPhone: varchar('provider_phone', { length: 20 }),
  providerEmail: varchar('provider_email', { length: 100 }),
  providerAddress: text('provider_address'),
  coverageDetails: text('coverage_details'),
  preAuthRequired: boolean('pre_auth_required').default(false),
  referralRequired: boolean('referral_required').default(false),

  // === NHIS (Nigeria) Specific Optional Fields ===
  isNhis: boolean('is_nhis').default(false), // Flag to identify NHIS insurance
  nhisEnrolleeId: varchar('nhis_enrollee_id', { length: 20 }), // NHIS Enrollee ID (format: XXX-XXXXXXX)
  nhisCategory: varchar('nhis_category', { length: 30 }), // formal_sector, informal_sector, vulnerable_groups, armed_forces, students
  hmoProvider: varchar('hmo_provider', { length: 100 }), // HMO managing the NHIS (e.g., Hygeia, Leadway, etc.)
  primaryHealthcareFacility: varchar('primary_healthcare_facility', { length: 200 }), // Registered primary facility
  principalMemberName: varchar('principal_member_name', { length: 100 }), // If patient is a dependant
  relationshipToPrincipal: varchar('relationship_to_principal', { length: 20 }), // self, spouse, child, dependant
  employerName: varchar('employer_name', { length: 100 }), // For formal sector NHIS
  employerNhisCode: varchar('employer_nhis_code', { length: 20 }), // Employer's NHIS registration code
  dependantsCount: integer('dependants_count'), // Number of dependants covered

  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Patient Referrals
export const patientReferrals = pgTable('patient_referrals', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  referringDoctorId: integer('referring_doctor_id').references(() => users.id).notNull(),
  referredToDoctor: varchar('referred_to_doctor', { length: 200 }),
  referredToFacility: varchar('referred_to_facility', { length: 200 }),
  specialty: varchar('specialty', { length: 100 }),
  reason: text('reason').notNull(),
  urgency: varchar('urgency', { length: 20 }).default('routine'), // urgent, routine, non-urgent
  status: varchar('status', { length: 20 }).default('pending'), // pending, scheduled, completed, cancelled
  referralDate: date('referral_date').defaultNow(),
  appointmentDate: date('appointment_date'),
  notes: text('notes'),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: date('follow_up_date'),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Relations for new tables
export const patientInsuranceRelations = relations(patientInsurance, ({ one }) => ({
  patient: one(patients, { fields: [patientInsurance.patientId], references: [patients.id] }),
  organization: one(organizations, { fields: [patientInsurance.organizationId], references: [organizations.id] })
}));

export const patientReferralsRelations = relations(patientReferrals, ({ one }) => ({
  patient: one(patients, { fields: [patientReferrals.patientId], references: [patients.id] }),
  referringDoctor: one(users, { fields: [patientReferrals.referringDoctorId], references: [users.id] }),
  organization: one(organizations, { fields: [patientReferrals.organizationId], references: [organizations.id] })
}));

// Insert schemas for new tables
export const insertPatientInsuranceSchema = createInsertSchema(patientInsurance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export const insertPatientReferralSchema = createInsertSchema(patientReferrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

// Types for new tables
export type ProceduralReport = typeof proceduralReports.$inferSelect;
export type InsertProceduralReport = z.infer<typeof insertProceduralReportSchema>;
export type ConsentForm = typeof consentForms.$inferSelect;
export type InsertConsentForm = z.infer<typeof insertConsentFormSchema>;
export type PatientConsent = typeof patientConsents.$inferSelect;
export type InsertPatientConsent = z.infer<typeof insertPatientConsentSchema>;
export type PatientInsurance = typeof patientInsurance.$inferSelect;
export type InsertPatientInsurance = z.infer<typeof insertPatientInsuranceSchema>;
export type PatientReferral = typeof patientReferrals.$inferSelect;
export type InsertPatientReferral = z.infer<typeof insertPatientReferralSchema>;

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type LabTest = typeof labTests.$inferSelect;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
} as never);

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

// Patient Safety Alerts
export const safetyAlerts = pgTable('safety_alerts', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'critical', 'warning', 'info'
  category: varchar('category', { length: 50 }).notNull(), // 'allergy', 'condition', 'medication', 'vitals'
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // 'high', 'medium', 'low'
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  dateAdded: timestamp('date_added').defaultNow(),
  dateResolved: timestamp('date_resolved'),
  resolvedBy: integer('resolved_by').references(() => users.id),
  metadata: json('metadata'), // Additional data like vital readings, lab values, etc.
});

export const insertSafetyAlertSchema = createInsertSchema(safetyAlerts).omit({
  id: true,
  dateAdded: true,
} as never);

export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type InsertSafetyAlert = z.infer<typeof insertSafetyAlertSchema>;

// Safety Alerts Relations
export const safetyAlertsRelations = relations(safetyAlerts, ({ one }) => ({
  patient: one(patients, {
    fields: [safetyAlerts.patientId],
    references: [patients.id],
  }),
  createdByUser: one(users, {
    fields: [safetyAlerts.createdBy],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [safetyAlerts.resolvedBy],
    references: [users.id],
  }),
}));

// Billing and Invoicing System
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  status: varchar('status', { length: 20 }).default('draft'), // draft, sent, paid, overdue, cancelled
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0.00'),
  balanceAmount: decimal('balance_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(), // consultation, lab, procedure, medication, etc.
  serviceId: integer('service_id'), // Reference to specific service (visit, lab order, etc.)
  quantity: decimal('quantity', { precision: 8, scale: 2 }).default('1.00'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // cash, card, transfer, insurance, mobile_money
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  transactionId: varchar('transaction_id', { length: 100 }),
  paymentDate: timestamp('payment_date').defaultNow(),
  status: varchar('status', { length: 20 }).default('completed'), // pending, completed, failed, refunded
  notes: text('notes'),
  processedBy: integer('processed_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const insuranceClaims = pgTable('insurance_claims', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  invoiceId: integer('invoice_id').references(() => invoices.id),
  claimNumber: varchar('claim_number', { length: 50 }).notNull().unique(),
  insuranceProvider: varchar('insurance_provider', { length: 100 }).notNull(),
  policyNumber: varchar('policy_number', { length: 100 }).notNull(),
  claimAmount: decimal('claim_amount', { precision: 10, scale: 2 }).notNull(),
  approvedAmount: decimal('approved_amount', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('submitted'), // submitted, processing, approved, rejected, paid
  submissionDate: timestamp('submission_date').defaultNow(),
  approvalDate: timestamp('approval_date'),
  paymentDate: timestamp('payment_date'),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const servicePrices = pgTable('service_prices', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(), // consultation, lab_test, procedure, medication
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  serviceCode: varchar('service_code', { length: 50 }),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  isActive: boolean('is_active').default(true),
  effectiveDate: date('effective_date').notNull(),
  expiryDate: date('expiry_date'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Relations for billing tables
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, { fields: [invoices.patientId], references: [patients.id] }),
  organization: one(organizations, { fields: [invoices.organizationId], references: [organizations.id] }),
  creator: one(users, { fields: [invoices.createdBy], references: [users.id] }),
  items: many(invoiceItems),
  payments: many(payments),
  insuranceClaims: many(insuranceClaims)
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  patient: one(patients, { fields: [payments.patientId], references: [patients.id] }),
  organization: one(organizations, { fields: [payments.organizationId], references: [organizations.id] }),
  processor: one(users, { fields: [payments.processedBy], references: [users.id] })
}));

export const insuranceClaimsRelations = relations(insuranceClaims, ({ one }) => ({
  patient: one(patients, { fields: [insuranceClaims.patientId], references: [patients.id] }),
  organization: one(organizations, { fields: [insuranceClaims.organizationId], references: [organizations.id] }),
  invoice: one(invoices, { fields: [insuranceClaims.invoiceId], references: [invoices.id] }),
  creator: one(users, { fields: [insuranceClaims.createdBy], references: [users.id] })
}));

export const servicePricesRelations = relations(servicePrices, ({ one }) => ({
  organization: one(organizations, { fields: [servicePrices.organizationId], references: [organizations.id] }),
  creator: one(users, { fields: [servicePrices.createdBy], references: [users.id] })
}));

// Insert schemas for billing
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
} as never);

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
} as never);

export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

export const insertServicePriceSchema = createInsertSchema(servicePrices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
} as never);

// Types for billing
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type InsertInsuranceClaim = z.infer<typeof insertInsuranceClaimSchema>;
export type ServicePrice = typeof servicePrices.$inferSelect;
export type InsertServicePrice = z.infer<typeof insertServicePriceSchema>;

// Appointment Reminders
export const appointmentReminders = pgTable('appointment_reminders', {
  id: serial('id').primaryKey(),
  appointmentId: integer('appointment_id').references(() => appointments.id).notNull(),
  reminderType: varchar('reminder_type', { length: 20 }).notNull(), // 'sms', 'email', 'push'
  scheduledTime: timestamp('scheduled_time').notNull(), // When to send the reminder
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'sent', 'failed'
  sentAt: timestamp('sent_at'),
  failureReason: text('failure_reason'),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Appointment Availability Slots
export const availabilitySlots = pgTable('availability_slots', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => users.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: varchar('start_time', { length: 8 }).notNull(), // "09:00:00"
  endTime: varchar('end_time', { length: 8 }).notNull(), // "17:00:00"
  slotDuration: integer('slot_duration').default(30).notNull(), // minutes
  isActive: boolean('is_active').default(true),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Holiday/Blackout Dates
export const blackoutDates = pgTable('blackout_dates', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => users.id), // null means clinic-wide
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: varchar('reason', { length: 100 }).notNull(),
  isRecurring: boolean('is_recurring').default(false), // for annual holidays
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow()
});

export const insertAppointmentReminderSchema = createInsertSchema(appointmentReminders).omit({
  id: true,
  createdAt: true,
} as never);

// Appointment Reminders Relations
export const appointmentRemindersRelations = relations(appointmentReminders, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentReminders.appointmentId],
    references: [appointments.id],
  }),
  organization: one(organizations, {
    fields: [appointmentReminders.organizationId],
    references: [organizations.id],
  }),
}));

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({
  id: true,
  createdAt: true,
} as never);

export const insertBlackoutDateSchema = createInsertSchema(blackoutDates).omit({
  id: true,
  createdAt: true,
} as never);

// Availability Slots Relations
export const availabilitySlotsRelations = relations(availabilitySlots, ({ one }) => ({
  doctor: one(users, {
    fields: [availabilitySlots.doctorId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [availabilitySlots.organizationId],
    references: [organizations.id],
  }),
}));

// Blackout Dates Relations
export const blackoutDatesRelations = relations(blackoutDates, ({ one }) => ({
  doctor: one(users, {
    fields: [blackoutDates.doctorId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [blackoutDates.organizationId],
    references: [organizations.id],
  }),
}));

export type AppointmentReminder = typeof appointmentReminders.$inferSelect;
export type InsertAppointmentReminder = z.infer<typeof insertAppointmentReminderSchema>;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type BlackoutDate = typeof blackoutDates.$inferSelect;
export type InsertBlackoutDate = z.infer<typeof insertBlackoutDateSchema>;

// Telemedicine Sessions
export const telemedicineSessions = pgTable('telemedicine_sessions', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => users.id).notNull(),
  appointmentId: integer('appointment_id').references(() => appointments.id), // Optional link to appointment
  scheduledTime: timestamp('scheduled_time').notNull(),
  status: varchar('status', { length: 20 }).default('scheduled').notNull(), // 'scheduled', 'active', 'completed', 'cancelled'
  type: varchar('type', { length: 20 }).default('video').notNull(), // 'video', 'audio', 'chat'
  sessionUrl: varchar('session_url', { length: 500 }),
  notes: text('notes'),
  duration: integer('duration'), // in minutes
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

export const insertTelemedicineSessionSchema = createInsertSchema(telemedicineSessions).omit({
  id: true,
  createdAt: true,
  completedAt: true
} as never).extend({
  doctorId: z.number().optional(),
  organizationId: z.number().optional(),
  scheduledTime: z.string().or(z.date())
});

export type TelemedicineSession = typeof telemedicineSessions.$inferSelect;
export type InsertTelemedicineSession = z.infer<typeof insertTelemedicineSessionSchema>;

// Telemedicine Sessions Relations
export const telemedicineSessionsRelations = relations(telemedicineSessions, ({ one }) => ({
  patient: one(patients, {
    fields: [telemedicineSessions.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [telemedicineSessions.doctorId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [telemedicineSessions.appointmentId],
    references: [appointments.id],
  }),
  organization: one(organizations, {
    fields: [telemedicineSessions.organizationId],
    references: [organizations.id],
  }),
}));

// API Keys for Public API Access
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 64 }).notNull().unique(), // SHA-256 hash of the key
  name: varchar('name', { length: 100 }).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: integer('user_id').references(() => users.id), // Optional: who created it
  permissions: json('permissions').$type<string[]>().default([]), // Array of allowed endpoints
  rateLimit: integer('rate_limit').default(1000), // Requests per hour
  isActive: boolean('is_active').default(true),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsedAt: true
} as never);

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// API Keys Relations
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// AI-Powered Consultations - Reference: blueprint:javascript_openai_ai_integrations
export const aiConsultations = pgTable('ai_consultations', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  providerId: integer('provider_id').references(() => users.id).notNull(),
  transcript: json('transcript').$type<Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>>().default([]),
  status: varchar('status', { length: 30 }).default('in_progress').notNull(), // 'in_progress', 'completed', 'review_pending', 'auto_draft_ready', 'cancelled', 'archived'
  chiefComplaint: text('chief_complaint'),
  // Context data injected into AI
  contextData: json('context_data').$type<{
    vitals?: { temperature?: string; bloodPressure?: string; heartRate?: string; weight?: string; };
    recentVisits?: Array<{ date: string; diagnosis: string; }>;
    currentMedications?: Array<{ name: string; dosage: string; }>;
    allergies?: string[];
    labResults?: Array<{ test: string; result: string; date: string; }>;
  }>(),
  // AI-generated insights
  aiInsights: json('ai_insights').$type<{
    differentialDiagnoses?: Array<{ diagnosis: string; probability: number; reasoning: string; }>;
    redFlags?: string[];
    suggestedQuestions?: string[];
    clinicalRecommendations?: string[];
    confidenceScore?: number; // 0-100
  }>(),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow()
});

// AI Consultations Relations
export const aiConsultationsRelations = relations(aiConsultations, ({ one, many }) => ({
  patient: one(patients, {
    fields: [aiConsultations.patientId],
    references: [patients.id],
  }),
  provider: one(users, {
    fields: [aiConsultations.providerId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [aiConsultations.organizationId],
    references: [organizations.id],
  }),
  clinicalNotes: many(clinicalNotes),
}));

export const clinicalNotes = pgTable('clinical_notes', {
  id: serial('id').primaryKey(),
  consultationId: integer('consultation_id').references(() => aiConsultations.id).notNull(),
  // SOAP Format
  subjective: text('subjective'), // Patient's story in their own words
  objective: text('objective'), // Physical examination findings
  assessment: text('assessment'), // Diagnosis or differential diagnoses
  plan: text('plan'), // Treatment plan and follow-up
  // Additional structured data
  chiefComplaint: text('chief_complaint'),
  historyOfPresentIllness: text('history_of_present_illness'),
  pastMedicalHistory: text('past_medical_history'),
  medications: json('medications').$type<Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    reasoning?: string;
  }>>().default([]),
  vitalSigns: json('vital_signs').$type<{
    temperature?: string;
    bloodPressure?: string;
    heartRate?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
  }>(),
  diagnosis: text('diagnosis'),
  // Enhanced AI features
  differentialDiagnoses: json('differential_diagnoses').$type<Array<{
    diagnosis: string;
    icdCode?: string;
    probability: number;
    reasoning: string;
  }>>().default([]),
  icdCodes: json('icd_codes').$type<Array<{
    code: string;
    description: string;
    category: string;
  }>>().default([]),
  suggestedLabTests: json('suggested_lab_tests').$type<Array<{
    test: string;
    reasoning: string;
    urgency: 'routine' | 'urgent' | 'stat';
  }>>().default([]),
  clinicalWarnings: json('clinical_warnings').$type<Array<{
    type: 'contraindication' | 'drug_interaction' | 'allergy' | 'red_flag';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>>().default([]),
  confidenceScore: integer('confidence_score'), // 0-100
  recommendations: text('recommendations'),
  followUpInstructions: text('follow_up_instructions'),
  followUpDate: date('follow_up_date'),
  addedToPatientRecord: boolean('added_to_patient_record').default(false),
  addedToRecordAt: timestamp('added_to_record_at'),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const insertAiConsultationSchema = createInsertSchema(aiConsultations).omit({
  id: true,
  createdAt: true,
  completedAt: true
} as never);

export const insertClinicalNoteSchema = createInsertSchema(clinicalNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
} as never);

// Dismissed Notifications - Track which notifications users have dismissed
export const dismissedNotifications = pgTable('dismissed_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  notificationId: varchar('notification_id', { length: 255 }).notNull(), // e.g., "visit-123", "prescription-456"
  dismissedAt: timestamp('dismissed_at').defaultNow()
});

export const insertDismissedNotificationSchema = createInsertSchema(dismissedNotifications).omit({
  id: true,
  dismissedAt: true
} as never);

export type AiConsultation = typeof aiConsultations.$inferSelect;
export type InsertAiConsultation = z.infer<typeof insertAiConsultationSchema>;
export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type InsertClinicalNote = z.infer<typeof insertClinicalNoteSchema>;
export type DismissedNotification = typeof dismissedNotifications.$inferSelect;
export type InsertDismissedNotification = z.infer<typeof insertDismissedNotificationSchema>;

// UserOrganizations schemas
export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({
  id: true,
  joinedAt: true
} as never);

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

// Tab Configurations for customizable patient overview tabs
export const tabConfigs = pgTable('tab_configs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  scope: varchar('scope', { length: 20 }).notNull(), // 'system', 'organization', 'role', 'user'
  roleId: integer('role_id').references(() => roles.id),
  userId: integer('user_id').references(() => users.id),
  key: varchar('key', { length: 100 }).notNull(), // Unique key for built-in components (e.g., 'overview', 'medications')
  label: varchar('label', { length: 100 }).notNull(), // Display name
  icon: varchar('icon', { length: 50 }), // Lucide icon name
  contentType: varchar('content_type', { length: 30 }).notNull(), // 'builtin_component', 'query_widget', 'markdown', 'iframe'
  settings: json('settings').$type<{
    componentName?: string; // For builtin_component
    query?: string; // For query_widget
    markdown?: string; // For markdown
    iframeUrl?: string; // For iframe
    allowedDomains?: string[]; // For iframe security
    customStyles?: Record<string, string>;
  }>(),
  isVisible: boolean('is_visible').default(true),
  isSystemDefault: boolean('is_system_default').default(false), // True for built-in tabs
  isMandatory: boolean('is_mandatory').default(false), // Cannot be hidden even by user overrides
  category: varchar('category', { length: 50 }), // e.g., 'clinical', 'administrative', 'custom'
  displayOrder: integer('display_order').notNull(), // Sort order (use multiples of 10 for easier reordering)
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const insertTabConfigSchema = createInsertSchema(tabConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
} as never);

export type TabConfig = typeof tabConfigs.$inferSelect;
export type InsertTabConfig = z.infer<typeof insertTabConfigSchema>;

// Tab Presets - predefined tab configurations for different user roles/workflows
export const tabPresets = pgTable('tab_presets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Doctor's View", "Nurse's View"
  description: text('description'), // What this preset is for
  scope: varchar('scope', { length: 20 }).notNull(), // 'system', 'organization'
  organizationId: integer('organization_id').references(() => organizations.id), // null for system presets
  icon: varchar('icon', { length: 50 }), // Lucide icon name
  isDefault: boolean('is_default').default(false), // Default preset for new users
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const insertTabPresetSchema = createInsertSchema(tabPresets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
} as never);

export type TabPreset = typeof tabPresets.$inferSelect;
export type InsertTabPreset = z.infer<typeof insertTabPresetSchema>;

// Tab Preset Items - which tabs are included in each preset
export const tabPresetItems = pgTable('tab_preset_items', {
  id: serial('id').primaryKey(),
  presetId: integer('preset_id').references(() => tabPresets.id).notNull(),
  tabKey: varchar('tab_key', { length: 100 }).notNull(), // References tab_configs.key
  isVisible: boolean('is_visible').default(true),
  displayOrder: integer('display_order').notNull(),
  customLabel: varchar('custom_label', { length: 100 }), // Override default label
  customIcon: varchar('custom_icon', { length: 50 }), // Override default icon
  customSettings: json('custom_settings').$type<Record<string, any>>(), // Override default settings
});

export const insertTabPresetItemSchema = createInsertSchema(tabPresetItems).omit({
  id: true
} as never);

export type TabPresetItem = typeof tabPresetItems.$inferSelect;
export type InsertTabPresetItem = z.infer<typeof insertTabPresetItemSchema>;

// Dismissed Notifications Relations
export const dismissedNotificationsRelations = relations(dismissedNotifications, ({ one }) => ({
  user: one(users, {
    fields: [dismissedNotifications.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [dismissedNotifications.organizationId],
    references: [organizations.id],
  }),
}));

// Tab Configs Relations
export const tabConfigsRelations = relations(tabConfigs, ({ one }) => ({
  organization: one(organizations, {
    fields: [tabConfigs.organizationId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [tabConfigs.roleId],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [tabConfigs.userId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tabConfigs.createdBy],
    references: [users.id],
  }),
}));

// Tab Presets Relations
export const tabPresetsRelations = relations(tabPresets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tabPresets.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [tabPresets.createdBy],
    references: [users.id],
  }),
  items: many(tabPresetItems),
}));

// Tab Preset Items Relations
export const tabPresetItemsRelations = relations(tabPresetItems, ({ one }) => ({
  preset: one(tabPresets, {
    fields: [tabPresetItems.presetId],
    references: [tabPresets.id],
  }),
}));
