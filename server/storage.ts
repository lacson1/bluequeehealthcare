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
  type InsertMedicalHistory
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
  getPrescriptionsByPatient(patientId: number): Promise<Prescription[]>;
  getPrescriptionsByVisit(visitId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescriptionStatus(id: number, status: string): Promise<Prescription>;
  getActivePrescriptionsByPatient(patientId: number): Promise<Prescription[]>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

  // Dashboard stats
  getDashboardStats(): Promise<{
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
    return await db.select().from(visits)
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
      createdAt: prescriptions.createdAt
    })
    .from(prescriptions)
    .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.createdAt));

    // Combine medication names: use manual name if available, otherwise use database name
    return results.map(result => ({
      ...result,
      medicationName: result.medicationName || result.medicationDbName || 'Unknown Medication'
    }));
  }

  async getPrescriptionsByVisit(visitId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(eq(prescriptions.visitId, visitId))
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

  async createUser(insertUser: InsertUser): Promise<User> {
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
  async getDashboardStats(): Promise<{
    totalPatients: number;
    todayVisits: number;
    lowStockItems: number;
    pendingLabs: number;
  }> {
    const totalPatientsResult = await db.select().from(patients);
    const todayVisitsResult = await this.getTodaysVisits();
    const lowStockResult = await this.getLowStockMedicines();
    const pendingLabsResult = await this.getPendingLabResults();

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
}

export const storage = new DatabaseStorage();