import { 
  patients, 
  visits, 
  labResults, 
  medicines,
  medications,
  prescriptions,
  users,
  referrals,
  consultationForms,
  consultationRecords,
  vaccinations,
  allergies,
  medicalHistory,
  labTests,
  labOrders,
  labOrderItems,
  labDepartments,
  labEquipment,
  labWorksheets,
  worksheetItems,
  type Patient, 
  type InsertPatient,
  type Visit,
  type InsertVisit,
  type LabResult,
  type InsertLabResult,
  type Medicine,
  type InsertMedicine,
  type Prescription,
  type InsertPrescription,
  type User,
  type InsertUser,
  type Referral,
  type InsertReferral,
  type ConsultationForm,
  type InsertConsultationForm,
  type ConsultationRecord,
  type InsertConsultationRecord,
  type Vaccination,
  type InsertVaccination,
  type Allergy,
  type InsertAllergy,
  type MedicalHistory,
  type InsertMedicalHistory,
  type LabTest,
  type InsertLabTest,
  type LabOrder,
  type InsertLabOrder,
  type LabOrderItem,
  type InsertLabOrderItem,
  type LabDepartment,
  type InsertLabDepartment,
  type LabEquipment,
  type InsertLabEquipment,
  type LabWorksheet,
  type InsertLabWorksheet,
  type WorksheetItem,
  type InsertWorksheetItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // Patients
  getPatient(id: number): Promise<Patient | undefined>;
  getPatients(search?: string, organizationId?: number): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, data: Partial<InsertPatient>): Promise<Patient | undefined>;

  // Visits
  getVisit(id: number): Promise<Visit | undefined>;
  getVisitById(id: number): Promise<Visit | undefined>;
  getVisitsByPatient(patientId: number): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: number, data: Partial<InsertVisit>): Promise<Visit | undefined>;
  getTodaysVisits(): Promise<Visit[]>;

  // Lab Results
  getLabResult(id: number): Promise<LabResult | undefined>;
  getLabResultsByPatient(patientId: number): Promise<LabResult[]>;
  createLabResult(labResult: InsertLabResult): Promise<LabResult>;
  getPendingLabResults(): Promise<LabResult[]>;

  // Medicines
  getMedicine(id: number): Promise<Medicine | undefined>;
  getMedicines(): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicineQuantity(id: number, quantity: number): Promise<Medicine>;
  getLowStockMedicines(): Promise<Medicine[]>;

  // Prescriptions
  getPrescription(id: number): Promise<Prescription | undefined>;
  getAllPrescriptions(): Promise<Prescription[]>;
  getPrescriptionsByPatient(patientId: number): Promise<Prescription[]>;
  getPrescriptionsByVisit(visitId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescriptionStatus(id: number, status: string): Promise<Prescription>;
  getActivePrescriptionsByPatient(patientId: number): Promise<Prescription[]>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserWithOrganization(id: number): Promise<{ organizationId: number | null } | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Referrals
  getReferral(id: number): Promise<Referral | undefined>;
  getReferrals(filters?: { toRole?: string; fromUserId?: number; status?: string }): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferralStatus(id: number, status: string): Promise<Referral>;

  // Consultation Forms
  getConsultationForm(id: number): Promise<ConsultationForm | undefined>;
  getConsultationForms(filters?: { specialistRole?: string; isActive?: boolean }): Promise<ConsultationForm[]>;
  createConsultationForm(form: InsertConsultationForm): Promise<ConsultationForm>;
  updateConsultationForm(id: number, updates: Partial<InsertConsultationForm>): Promise<ConsultationForm>;

  // Consultation Records
  getConsultationRecord(id: number): Promise<ConsultationRecord | undefined>;
  getConsultationRecordsByPatient(patientId: number): Promise<ConsultationRecord[]>;
  createConsultationRecord(record: InsertConsultationRecord): Promise<ConsultationRecord>;

  // Medical Records
  getVaccinationsByPatient(patientId: number): Promise<Vaccination[]>;
  createVaccination(vaccination: InsertVaccination): Promise<Vaccination>;
  deleteVaccination(id: number): Promise<void>;

  getAllergiesByPatient(patientId: number): Promise<Allergy[]>;
  createAllergy(allergy: InsertAllergy): Promise<Allergy>;
  deleteAllergy(id: number): Promise<void>;

  getMedicalHistoryByPatient(patientId: number): Promise<MedicalHistory[]>;
  createMedicalHistory(history: InsertMedicalHistory): Promise<MedicalHistory>;
  deleteMedicalHistory(id: number): Promise<void>;

  // Laboratory Operations
  // Lab Tests
  getLabTests(organizationId?: number): Promise<LabTest[]>;
  getLabTest(id: number): Promise<LabTest | undefined>;
  createLabTest(test: InsertLabTest): Promise<LabTest>;
  updateLabTest(id: number, updates: Partial<InsertLabTest>): Promise<LabTest>;
  
  // Lab Orders
  getLabOrders(filters?: { 
    organizationId?: number; 
    patientId?: number; 
    status?: string; 
    priority?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LabOrder[]>;
  getLabOrder(id: number): Promise<LabOrder | undefined>;
  createLabOrder(order: InsertLabOrder): Promise<LabOrder>;
  updateLabOrder(id: number, updates: Partial<InsertLabOrder>): Promise<LabOrder>;
  
  // Lab Order Items
  getLabOrderItems(labOrderId: number): Promise<LabOrderItem[]>;
  getLabOrderItem(id: number): Promise<LabOrderItem | undefined>;
  createLabOrderItem(item: InsertLabOrderItem): Promise<LabOrderItem>;
  updateLabOrderItem(id: number, updates: Partial<InsertLabOrderItem>): Promise<LabOrderItem>;
  
  // Lab Departments
  getLabDepartments(organizationId?: number): Promise<LabDepartment[]>;
  getLabDepartment(id: number): Promise<LabDepartment | undefined>;
  createLabDepartment(dept: InsertLabDepartment): Promise<LabDepartment>;
  updateLabDepartment(id: number, updates: Partial<InsertLabDepartment>): Promise<LabDepartment>;
  
  // Lab Equipment
  getLabEquipment(filters?: { departmentId?: number; organizationId?: number; status?: string }): Promise<LabEquipment[]>;
  getLabEquipmentItem(id: number): Promise<LabEquipment | undefined>;
  createLabEquipment(equipment: InsertLabEquipment): Promise<LabEquipment>;
  updateLabEquipment(id: number, updates: Partial<InsertLabEquipment>): Promise<LabEquipment>;
  
  // Lab Worksheets
  getLabWorksheets(filters?: { 
    departmentId?: number; 
    organizationId?: number; 
    status?: string;
    technicianId?: number;
  }): Promise<LabWorksheet[]>;
  getLabWorksheet(id: number): Promise<LabWorksheet | undefined>;
  createLabWorksheet(worksheet: InsertLabWorksheet): Promise<LabWorksheet>;
  updateLabWorksheet(id: number, updates: Partial<InsertLabWorksheet>): Promise<LabWorksheet>;
  
  // Worksheet Items
  getWorksheetItems(worksheetId: number): Promise<WorksheetItem[]>;
  createWorksheetItem(item: InsertWorksheetItem): Promise<WorksheetItem>;
  removeWorksheetItem(id: number): Promise<void>;

  // Dashboard stats
  getDashboardStats(organizationId: number): Promise<{
    totalPatients: number;
    todayVisits: number;
    lowStockItems: number;
    pendingLabs: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Patients
  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatients(search?: string, organizationId?: number): Promise<Patient[]> {
    let query = db.select().from(patients);

    if (search) {
      const conditions = [
        ilike(patients.firstName, `%${search}%`),
        ilike(patients.lastName, `%${search}%`),
        ilike(patients.phone, `%${search}%`)
      ];
      query = query.where(or(...conditions));
    }

    const result = await query.orderBy(desc(patients.createdAt));
    return result;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
  }

  async updatePatient(id: number, data: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set(data)
      .where(eq(patients.id, id))
      .returning();
    return patient || undefined;
  }

  // Visits
  async getVisit(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit || undefined;
  }

  async getVisitsByPatient(patientId: number): Promise<Visit[]> {
    return await db.select({
      id: visits.id,
      patientId: visits.patientId,
      doctorId: visits.doctorId,
      visitDate: visits.visitDate,
      bloodPressure: visits.bloodPressure,
      heartRate: visits.heartRate,
      temperature: visits.temperature,
      weight: visits.weight,
      complaint: visits.complaint,
      diagnosis: visits.diagnosis,
      treatment: visits.treatment,
      followUpDate: visits.followUpDate,
      visitType: visits.visitType,
      status: visits.status,
      organizationId: visits.organizationId,
      createdAt: visits.createdAt,
      doctorName: users.username,
      doctorFirstName: users.firstName,
      doctorLastName: users.lastName,
      doctorRole: users.role
    }).from(visits)
      .leftJoin(users, eq(visits.doctorId, users.id))
      .where(eq(visits.patientId, patientId))
      .orderBy(desc(visits.visitDate));
  }

  async createVisit(insertVisit: InsertVisit): Promise<Visit> {
    try {
      console.log('Storage createVisit called with:', insertVisit);
      const [visit] = await db
        .insert(visits)
        .values(insertVisit)
        .returning();
      console.log('Visit created successfully:', visit);
      return visit;
    } catch (error) {
      console.error('Database error in createVisit:', error);
      throw error;
    }
  }

  async getVisitById(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit || undefined;
  }

  async updateVisit(id: number, data: Partial<InsertVisit>): Promise<Visit | undefined> {
    const [visit] = await db
      .update(visits)
      .set(data)
      .where(eq(visits.id, id))
      .returning();
    return visit || undefined;
  }

  async getTodaysVisits(): Promise<Visit[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db.select().from(visits)
      .where(
        and(
          gte(visits.visitDate, today),
          lte(visits.visitDate, tomorrow)
        )
      )
      .orderBy(desc(visits.visitDate));
  }

  // Lab Results
  async getLabResult(id: number): Promise<LabResult | undefined> {
    const [labResult] = await db.select().from(labResults).where(eq(labResults.id, id));
    return labResult || undefined;
  }

  async getLabResultsByPatient(patientId: number): Promise<LabResult[]> {
    return await db.select().from(labResults)
      .where(eq(labResults.patientId, patientId))
      .orderBy(desc(labResults.testDate));
  }

  async createLabResult(insertLabResult: InsertLabResult): Promise<LabResult> {
    const [labResult] = await db
      .insert(labResults)
      .values(insertLabResult)
      .returning();
    return labResult;
  }

  async getPendingLabResults(): Promise<LabResult[]> {
    return await db.select().from(labResults)
      .where(eq(labResults.status, "pending"))
      .orderBy(desc(labResults.testDate));
  }

  // Medicines
  async getMedicine(id: number): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    return medicine || undefined;
  }

  async getMedicines(): Promise<Medicine[]> {
    return await db.select().from(medicines).orderBy(medicines.name);
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const [medicine] = await db
      .insert(medicines)
      .values(insertMedicine)
      .returning();
    return medicine;
  }

  async updateMedicineQuantity(id: number, quantity: number): Promise<Medicine> {
    const [medicine] = await db
      .update(medicines)
      .set({ quantity })
      .where(eq(medicines.id, id))
      .returning();
    return medicine;
  }

  async getLowStockMedicines(): Promise<Medicine[]> {
    return await db.select().from(medicines)
      .where(lte(medicines.quantity, medicines.lowStockThreshold))
      .orderBy(medicines.quantity);
  }

  // Prescriptions
  async getPrescription(id: number): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription || undefined;
  }

  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    const results = await db.select({
      id: prescriptions.id,
      patientId: prescriptions.patientId,
      visitId: prescriptions.visitId,
      medicationId: prescriptions.medicationId,
      medicationName: prescriptions.medicationName,
      medicationDbName: medications.name,
      dosage: prescriptions.dosage,
      frequency: prescriptions.frequency,
      duration: prescriptions.duration,
      instructions: prescriptions.instructions,
      prescribedBy: prescriptions.prescribedBy,
      status: prescriptions.status,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      organizationId: prescriptions.organizationId,
      pharmacyId: prescriptions.pharmacyId,
      createdAt: prescriptions.createdAt
    })
    .from(prescriptions)
    .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.createdAt));

    // Combine medication names: use manual name if available, otherwise use database name
    return results.map(result => ({
      id: result.id,
      patientId: result.patientId,
      visitId: result.visitId,
      medicationId: result.medicationId,
      medicationName: result.medicationName || result.medicationDbName || 'Unknown Medication',
      dosage: result.dosage,
      frequency: result.frequency,
      duration: result.duration,
      instructions: result.instructions,
      prescribedBy: result.prescribedBy,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      organizationId: result.organizationId,
      pharmacyId: result.pharmacyId,
      createdAt: result.createdAt
    }));
  }

  async getPrescriptionsByVisit(visitId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(eq(prescriptions.visitId, visitId))
      .orderBy(desc(prescriptions.createdAt));
  }

  async getAllPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .orderBy(desc(prescriptions.createdAt));
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db
      .insert(prescriptions)
      .values(insertPrescription)
      .returning();
    return prescription;
  }

  async updatePrescriptionStatus(id: number, status: string): Promise<Prescription> {
    const [prescription] = await db
      .update(prescriptions)
      .set({ status })
      .where(eq(prescriptions.id, id))
      .returning();
    return prescription;
  }

  async getActivePrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(and(
        eq(prescriptions.patientId, patientId),
        eq(prescriptions.status, "active")
      ))
      .orderBy(desc(prescriptions.createdAt));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserWithOrganization(id: number): Promise<{ organizationId: number | null } | undefined> {
    const [user] = await db.select({
      organizationId: users.organizationId
    }).from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check if username already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, insertUser.username))
      .limit(1);
    
    if (existingUser.length > 0) {
      throw new Error('Username already exists');
    }
    
    // Check if email already exists (if email is provided)
    if (insertUser.email) {
      const existingEmail = await db.select()
        .from(users)
        .where(eq(users.email, insertUser.email))
        .limit(1);
      
      if (existingEmail.length > 0) {
        throw new Error('Email already exists');
      }
    }

    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Referrals
  async getReferral(id: number): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral || undefined;
  }

  async getReferrals(filters?: { toRole?: string; fromUserId?: number; status?: string }): Promise<Referral[]> {
    const conditions = [];
    if (filters?.toRole) {
      conditions.push(eq(referrals.toRole, filters.toRole));
    }
    if (filters?.fromUserId) {
      conditions.push(eq(referrals.fromUserId, filters.fromUserId));
    }
    if (filters?.status) {
      conditions.push(eq(referrals.status, filters.status));
    }

    const baseQuery = db.select({
      id: referrals.id,
      patientId: referrals.patientId,
      fromUserId: referrals.fromUserId,
      toRole: referrals.toRole,
      reason: referrals.reason,
      date: referrals.date,
      status: referrals.status,
      patient: {
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
      },
      fromUser: {
        id: users.id,
        username: users.username,
      }
    })
    .from(referrals)
    .leftJoin(patients, eq(referrals.patientId, patients.id))
    .leftJoin(users, eq(referrals.fromUserId, users.id));

    if (conditions.length > 0) {
      return await baseQuery
        .where(and(...conditions))
        .orderBy(desc(referrals.date));
    }

    return await baseQuery
      .orderBy(desc(referrals.date));
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values(insertReferral)
      .returning();
    return referral;
  }

  async updateReferralStatus(id: number, status: string): Promise<Referral> {
    const [referral] = await db
      .update(referrals)
      .set({ status })
      .where(eq(referrals.id, id))
      .returning();
    return referral;
  }

  // Consultation Forms
  async getConsultationForm(id: number): Promise<ConsultationForm | undefined> {
    const [form] = await db.select().from(consultationForms).where(eq(consultationForms.id, id));
    return form || undefined;
  }

  async getConsultationForms(filters?: { specialistRole?: string; isActive?: boolean }): Promise<ConsultationForm[]> {
    const conditions = [];

    if (filters?.specialistRole) {
      conditions.push(eq(consultationForms.specialistRole, filters.specialistRole));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(consultationForms.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      return await db.select()
        .from(consultationForms)
        .where(and(...conditions))
        .orderBy(desc(consultationForms.createdAt));
    }

    return await db.select()
      .from(consultationForms)
      .orderBy(desc(consultationForms.createdAt));
  }

  async createConsultationForm(insertForm: InsertConsultationForm): Promise<ConsultationForm> {
    const [form] = await db
      .insert(consultationForms)
      .values(insertForm)
      .returning();
    return form;
  }

  async updateConsultationForm(id: number, updates: Partial<InsertConsultationForm>): Promise<ConsultationForm> {
    const [form] = await db
      .update(consultationForms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(consultationForms.id, id))
      .returning();
    return form;
  }

  // Consultation Records
  async getConsultationRecord(id: number): Promise<ConsultationRecord | undefined> {
    const [record] = await db.select().from(consultationRecords).where(eq(consultationRecords.id, id));
    return record || undefined;
  }

  async getConsultationRecordsByPatient(patientId: number): Promise<ConsultationRecord[]> {
    return await db.select()
      .from(consultationRecords)
      .where(eq(consultationRecords.patientId, patientId))
      .orderBy(desc(consultationRecords.createdAt));
  }

  async createConsultationRecord(insertRecord: InsertConsultationRecord): Promise<ConsultationRecord> {
    const [record] = await db
      .insert(consultationRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  // Dashboard stats
  async getDashboardStats(organizationId: number): Promise<{
    totalPatients: number;
    todayVisits: number;
    lowStockItems: number;
    pendingLabs: number;
  }> {
    // Organization-filtered patient count
    const totalPatientsResult = await db.select()
      .from(patients)
      .where(eq(patients.organizationId, organizationId));
    
    // Organization-filtered today's visits
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayVisitsResult = await db.select()
      .from(visits)
      .leftJoin(patients, eq(visits.patientId, patients.id))
      .where(
        and(
          eq(patients.organizationId, organizationId),
          gte(visits.visitDate, startOfDay),
          lte(visits.visitDate, endOfDay)
        )
      );
    
    // Organization-filtered low stock medicines
    const lowStockResult = await db.select()
      .from(medicines)
      .where(
        and(
          eq(medicines.organizationId, organizationId),
          lte(medicines.quantity, 10)
        )
      );
    
    // Organization-filtered pending lab results
    const pendingLabsResult = await db.select()
      .from(labResults)
      .leftJoin(patients, eq(labResults.patientId, patients.id))
      .where(
        and(
          eq(patients.organizationId, organizationId),
          eq(labResults.status, 'pending')
        )
      );

    return {
      totalPatients: totalPatientsResult.length,
      todayVisits: todayVisitsResult.length,
      lowStockItems: lowStockResult.length,
      pendingLabs: pendingLabsResult.length,
    };
  }

  // Medical Records Implementation
  async getVaccinationsByPatient(patientId: number): Promise<Vaccination[]> {
    return await db.select().from(vaccinations).where(eq(vaccinations.patientId, patientId));
  }

  async createVaccination(insertVaccination: InsertVaccination): Promise<Vaccination> {
    const [vaccination] = await db
      .insert(vaccinations)
      .values(insertVaccination)
      .returning();
    return vaccination;
  }

  async deleteVaccination(id: number): Promise<void> {
    await db.delete(vaccinations).where(eq(vaccinations.id, id));
  }

  async getAllergiesByPatient(patientId: number): Promise<Allergy[]> {
    return await db.select().from(allergies).where(eq(allergies.patientId, patientId));
  }

  async createAllergy(insertAllergy: InsertAllergy): Promise<Allergy> {
    const [allergy] = await db
      .insert(allergies)
      .values(insertAllergy)
      .returning();
    return allergy;
  }

  async deleteAllergy(id: number): Promise<void> {
    await db.delete(allergies).where(eq(allergies.id, id));
  }

  async getMedicalHistoryByPatient(patientId: number): Promise<MedicalHistory[]> {
    return await db.select().from(medicalHistory).where(eq(medicalHistory.patientId, patientId));
  }

  async createMedicalHistory(insertHistory: InsertMedicalHistory): Promise<MedicalHistory> {
    const [history] = await db
      .insert(medicalHistory)
      .values(insertHistory)
      .returning();
    return history;
  }

  async deleteMedicalHistory(id: number): Promise<void> {
    await db.delete(medicalHistory).where(eq(medicalHistory.id, id));
  }

  // Laboratory Operations Implementation
  // Lab Tests
  async getLabTests(organizationId?: number): Promise<LabTest[]> {
    let query = db.select().from(labTests);
    
    if (organizationId) {
      query = query.where(and(
        eq(labTests.organizationId, organizationId),
        eq(labTests.isActive, true)
      ));
    } else {
      query = query.where(eq(labTests.isActive, true));
    }
    
    return await query.orderBy(labTests.category, labTests.name);
  }

  async getLabTest(id: number): Promise<LabTest | undefined> {
    const [test] = await db.select().from(labTests).where(eq(labTests.id, id));
    return test || undefined;
  }

  async createLabTest(insertTest: InsertLabTest): Promise<LabTest> {
    const [test] = await db
      .insert(labTests)
      .values(insertTest)
      .returning();
    return test;
  }

  async updateLabTest(id: number, updates: Partial<InsertLabTest>): Promise<LabTest> {
    const [test] = await db
      .update(labTests)
      .set(updates)
      .where(eq(labTests.id, id))
      .returning();
    return test;
  }

  // Lab Orders
  async getLabOrders(filters?: { 
    organizationId?: number; 
    patientId?: number; 
    status?: string; 
    priority?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LabOrder[]> {
    const conditions = [];

    if (filters?.organizationId) {
      conditions.push(eq(labOrders.organizationId, filters.organizationId));
    }
    if (filters?.patientId) {
      conditions.push(eq(labOrders.patientId, filters.patientId));
    }
    if (filters?.status) {
      conditions.push(eq(labOrders.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(labOrders.priority, filters.priority));
    }
    if (filters?.startDate) {
      conditions.push(gte(labOrders.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(labOrders.createdAt, filters.endDate));
    }

    let query = db.select().from(labOrders);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(labOrders.createdAt));
  }

  async getLabOrder(id: number): Promise<LabOrder | undefined> {
    const [order] = await db.select().from(labOrders).where(eq(labOrders.id, id));
    return order || undefined;
  }

  async createLabOrder(insertOrder: InsertLabOrder): Promise<LabOrder> {
    const [order] = await db
      .insert(labOrders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateLabOrder(id: number, updates: Partial<InsertLabOrder>): Promise<LabOrder> {
    const [order] = await db
      .update(labOrders)
      .set(updates)
      .where(eq(labOrders.id, id))
      .returning();
    return order;
  }

  // Lab Order Items
  async getLabOrderItems(labOrderId: number): Promise<LabOrderItem[]> {
    return await db.select()
      .from(labOrderItems)
      .where(eq(labOrderItems.labOrderId, labOrderId))
      .orderBy(labOrderItems.id);
  }

  async getLabOrderItem(id: number): Promise<LabOrderItem | undefined> {
    const [item] = await db.select().from(labOrderItems).where(eq(labOrderItems.id, id));
    return item || undefined;
  }

  async createLabOrderItem(insertItem: InsertLabOrderItem): Promise<LabOrderItem> {
    const [item] = await db
      .insert(labOrderItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateLabOrderItem(id: number, updates: Partial<InsertLabOrderItem>): Promise<LabOrderItem> {
    const [item] = await db
      .update(labOrderItems)
      .set(updates)
      .where(eq(labOrderItems.id, id))
      .returning();
    return item;
  }

  // Lab Departments
  async getLabDepartments(organizationId?: number): Promise<LabDepartment[]> {
    let query = db.select().from(labDepartments);
    
    if (organizationId) {
      query = query.where(and(
        eq(labDepartments.organizationId, organizationId),
        eq(labDepartments.isActive, true)
      ));
    } else {
      query = query.where(eq(labDepartments.isActive, true));
    }
    
    return await query.orderBy(labDepartments.name);
  }

  async getLabDepartment(id: number): Promise<LabDepartment | undefined> {
    const [dept] = await db.select().from(labDepartments).where(eq(labDepartments.id, id));
    return dept || undefined;
  }

  async createLabDepartment(insertDept: InsertLabDepartment): Promise<LabDepartment> {
    const [dept] = await db
      .insert(labDepartments)
      .values(insertDept)
      .returning();
    return dept;
  }

  async updateLabDepartment(id: number, updates: Partial<InsertLabDepartment>): Promise<LabDepartment> {
    const [dept] = await db
      .update(labDepartments)
      .set(updates)
      .where(eq(labDepartments.id, id))
      .returning();
    return dept;
  }

  // Lab Equipment
  async getLabEquipment(filters?: { departmentId?: number; organizationId?: number; status?: string }): Promise<LabEquipment[]> {
    const conditions = [];

    if (filters?.departmentId) {
      conditions.push(eq(labEquipment.departmentId, filters.departmentId));
    }
    if (filters?.organizationId) {
      conditions.push(eq(labEquipment.organizationId, filters.organizationId));
    }
    if (filters?.status) {
      conditions.push(eq(labEquipment.status, filters.status));
    }

    let query = db.select().from(labEquipment);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(labEquipment.name);
  }

  async getLabEquipmentItem(id: number): Promise<LabEquipment | undefined> {
    const [equipment] = await db.select().from(labEquipment).where(eq(labEquipment.id, id));
    return equipment || undefined;
  }

  async createLabEquipment(insertEquipment: InsertLabEquipment): Promise<LabEquipment> {
    const [equipment] = await db
      .insert(labEquipment)
      .values(insertEquipment)
      .returning();
    return equipment;
  }

  async updateLabEquipment(id: number, updates: Partial<InsertLabEquipment>): Promise<LabEquipment> {
    const [equipment] = await db
      .update(labEquipment)
      .set(updates)
      .where(eq(labEquipment.id, id))
      .returning();
    return equipment;
  }

  // Lab Worksheets
  async getLabWorksheets(filters?: { 
    departmentId?: number; 
    organizationId?: number; 
    status?: string;
    technicianId?: number;
  }): Promise<LabWorksheet[]> {
    const conditions = [];

    if (filters?.departmentId) {
      conditions.push(eq(labWorksheets.departmentId, filters.departmentId));
    }
    if (filters?.organizationId) {
      conditions.push(eq(labWorksheets.organizationId, filters.organizationId));
    }
    if (filters?.status) {
      conditions.push(eq(labWorksheets.status, filters.status));
    }
    if (filters?.technicianId) {
      conditions.push(eq(labWorksheets.technicianId, filters.technicianId));
    }

    let query = db.select().from(labWorksheets);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(labWorksheets.createdAt));
  }

  async getLabWorksheet(id: number): Promise<LabWorksheet | undefined> {
    const [worksheet] = await db.select().from(labWorksheets).where(eq(labWorksheets.id, id));
    return worksheet || undefined;
  }

  async createLabWorksheet(insertWorksheet: InsertLabWorksheet): Promise<LabWorksheet> {
    const [worksheet] = await db
      .insert(labWorksheets)
      .values(insertWorksheet)
      .returning();
    return worksheet;
  }

  async updateLabWorksheet(id: number, updates: Partial<InsertLabWorksheet>): Promise<LabWorksheet> {
    const [worksheet] = await db
      .update(labWorksheets)
      .set(updates)
      .where(eq(labWorksheets.id, id))
      .returning();
    return worksheet;
  }

  // Worksheet Items
  async getWorksheetItems(worksheetId: number): Promise<WorksheetItem[]> {
    return await db.select()
      .from(worksheetItems)
      .where(eq(worksheetItems.worksheetId, worksheetId))
      .orderBy(worksheetItems.position);
  }

  async createWorksheetItem(insertItem: InsertWorksheetItem): Promise<WorksheetItem> {
    const [item] = await db
      .insert(worksheetItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async removeWorksheetItem(id: number): Promise<void> {
    await db.delete(worksheetItems).where(eq(worksheetItems.id, id));
  }
}

export const storage = new DatabaseStorage();