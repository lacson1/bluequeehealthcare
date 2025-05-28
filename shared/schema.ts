import { pgTable, text, serial, integer, date, timestamp, decimal, boolean, varchar, json } from "drizzle-orm/pg-core";
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
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // e.g., admin, nurse, doctor, pharmacist, physiotherapist
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  photoUrl: varchar('photo_url', { length: 255 }),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow()
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
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
  medicineId: integer("medicine_id").notNull().references(() => medicines.id),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions"),
  prescribedBy: text("prescribed_by").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
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

export const labTests = pgTable('lab_tests', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }), // e.g., "Blood Test"
  description: varchar('description', { length: 255 }),
  units: varchar('units', { length: 50 }),
  referenceRange: varchar('reference_range', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
});

export const labOrders = pgTable('lab_orders', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id),
  orderedBy: integer('ordered_by').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending'), // pending, in_progress, completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at')
});

export const labOrderItems = pgTable('lab_order_items', {
  id: serial('id').primaryKey(),
  labOrderId: integer('lab_order_id').notNull().references(() => labOrders.id),
  labTestId: integer('lab_test_id').notNull().references(() => labTests.id),
  result: text('result'),
  remarks: text('remarks'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, completed
  completedBy: integer('completed_by').references(() => users.id),
  completedAt: timestamp('completed_at')
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

// Consultation Forms - Specialist-specific form templates
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

// Consultation Records - Filled forms linked to patients
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

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  visits: many(visits),
  labResults: many(labResults),
  prescriptions: many(prescriptions),
  referrals: many(referrals),
  comments: many(comments),
  consultationRecords: many(consultationRecords),
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
  medicine: one(medicines, {
    fields: [prescriptions.medicineId],
    references: [medicines.id],
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

// Frontend form schema (without patientId for form validation)
export const visitFormSchema = z.object({
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

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

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export const insertLabTestSchema = createInsertSchema(labTests).omit({
  id: true,
  createdAt: true,
});

export type LabTest = typeof labTests.$inferSelect;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
