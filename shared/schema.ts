import { pgTable, text, serial, integer, date, timestamp, decimal, boolean, varchar, json, numeric } from "drizzle-orm/pg-core";
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

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
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
  medicationId: integer("medication_id").references(() => medicines.id), // Updated to reference medicines table
  medicationName: text("medication_name"), // For manual entries when medication is not in database
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
  category: varchar('category', { length: 50 }), // e.g., "Blood Test"
  description: varchar('description', { length: 255 }),
  units: varchar('units', { length: 50 }),
  referenceRange: varchar('reference_range', { length: 100 }),
  organizationId: integer('organization_id').references(() => organizations.id),
  isActive: boolean('is_active').default(true),
  priority: varchar('priority', { length: 20 }).default('routine'), // routine, urgent, stat
  sampleType: varchar('sample_type', { length: 50 }), // blood, urine, stool, etc.
  methodOfCollection: varchar('method_of_collection', { length: 100 }),
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
  replyToId: integer('reply_to_id').references(() => comments.id), // For threaded conversations
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
  assignmentId: integer('assignment_id').references(() => medicationReviewAssignments.id),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  reviewedBy: integer('reviewed_by').references(() => users.id).notNull(),
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

// Insert schemas for forms
export const insertPharmacySchema = createInsertSchema(pharmacies);
export const insertPharmacyActivitySchema = createInsertSchema(pharmacyActivities);
export const insertMedicationReviewSchema = createInsertSchema(medicationReviews);
export const insertErrorLogSchema = createInsertSchema(errorLogs);
export const insertSystemHealthSchema = createInsertSchema(systemHealth);

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  visits: many(visits),
  labResults: many(labResults),
  prescriptions: many(prescriptions),
  referrals: many(referrals),
  comments: many(comments),
  consultationRecords: many(consultationRecords),
  appointments: many(appointments),
  pharmacyActivities: many(pharmacyActivities),
  medicationReviews: many(medicationReviews),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  prescriptions: many(prescriptions),
}));

export const labResultsRelations = relations(labResults, ({ one }) => ({
  patient: one(patients, {
    fields: [labResults.patientId],
    references: [patients.id],
  }),
}));

export const medicinesRelations = relations(medicines, ({ many }) => ({
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  visit: one(visits, {
    fields: [prescriptions.visitId],
    references: [visits.id],
  }),
  medication: one(medications, {
    fields: [prescriptions.medicationId],
    references: [medications.id],
  }),
}));

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

export const labTestsRelations = relations(labTests, ({ many }) => ({
  labResults: many(labResults),
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

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  visitDate: true,
}).extend({
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
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Profile update schema (excludes password and username for security)
export const updateProfileSchema = createInsertSchema(users).omit({
  id: true,
  username: true,
  password: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  date: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Lab schema exports
export const insertLabTestSchema = createInsertSchema(labTests).omit({
  id: true,
  createdAt: true,
});

export const insertLabOrderSchema = createInsertSchema(labOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertLabOrderItemSchema = createInsertSchema(labOrderItems).omit({
  id: true,
  completedAt: true,
  verifiedAt: true,
});

export const insertLabDepartmentSchema = createInsertSchema(labDepartments).omit({
  id: true,
  createdAt: true,
});

export const insertLabEquipmentSchema = createInsertSchema(labEquipment).omit({
  id: true,
  createdAt: true,
});

export const insertLabWorksheetSchema = createInsertSchema(labWorksheets).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  verifiedAt: true,
});

export const insertWorksheetItemSchema = createInsertSchema(worksheetItems).omit({
  id: true,
  createdAt: true,
});

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
});



export type MedicationReviewAssignment = typeof medicationReviewAssignments.$inferSelect;
export type InsertMedicationReviewAssignment = z.infer<typeof insertMedicationReviewAssignmentSchema>;
export type MedicationReview = typeof medicationReviews.$inferSelect;
export type InsertMedicationReview = z.infer<typeof insertMedicationReviewSchema>;

// Consultation Forms Types
export const insertConsultationFormSchema = createInsertSchema(consultationForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsultationRecordSchema = createInsertSchema(consultationRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ConsultationForm = typeof consultationForms.$inferSelect;
export type InsertConsultationForm = z.infer<typeof insertConsultationFormSchema>;
export type ConsultationRecord = typeof consultationRecords.$inferSelect;
export type InsertConsultationRecord = z.infer<typeof insertConsultationRecordSchema>;

// Medical Records Insert Schemas
export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({
  id: true,
  createdAt: true,
});

export const insertAllergySchema = createInsertSchema(allergies).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalHistorySchema = createInsertSchema(medicalHistory).omit({
  id: true,
  createdAt: true,
});

// Medical Records Types
export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
export type Allergy = typeof allergies.$inferSelect;
export type InsertAllergy = z.infer<typeof insertAllergySchema>;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type InsertMedicalHistory = z.infer<typeof insertMedicalHistorySchema>;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  readAt: true,
  repliedAt: true,
});

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
});

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
});

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
});

export const insertConsentFormSchema = createInsertSchema(consentForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientConsentSchema = createInsertSchema(patientConsents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type ProceduralReport = typeof proceduralReports.$inferSelect;
export type InsertProceduralReport = z.infer<typeof insertProceduralReportSchema>;
export type ConsentForm = typeof consentForms.$inferSelect;
export type InsertConsentForm = z.infer<typeof insertConsentFormSchema>;
export type PatientConsent = typeof patientConsents.$inferSelect;
export type InsertPatientConsent = z.infer<typeof insertPatientConsentSchema>;

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type LabTest = typeof labTests.$inferSelect;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

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
});

export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type InsertSafetyAlert = z.infer<typeof insertSafetyAlertSchema>;

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
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertInsuranceClaimSchema = createInsertSchema(insuranceClaims).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServicePriceSchema = createInsertSchema(servicePrices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({
  id: true,
  createdAt: true,
});

export const insertBlackoutDateSchema = createInsertSchema(blackoutDates).omit({
  id: true,
  createdAt: true,
});

export type AppointmentReminder = typeof appointmentReminders.$inferSelect;
export type InsertAppointmentReminder = z.infer<typeof insertAppointmentReminderSchema>;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type BlackoutDate = typeof blackoutDates.$inferSelect;
export type InsertBlackoutDate = z.infer<typeof insertBlackoutDateSchema>;
