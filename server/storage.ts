import { 
  patients, 
  visits, 
  labResults, 
  medicines,
  type Patient, 
  type InsertPatient,
  type Visit,
  type InsertVisit,
  type LabResult,
  type InsertLabResult,
  type Medicine,
  type InsertMedicine
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte, lte, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Patients
  getPatient(id: number): Promise<Patient | undefined>;
  getPatients(search?: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  
  // Visits
  getVisit(id: number): Promise<Visit | undefined>;
  getVisitsByPatient(patientId: number): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
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

  async getPatients(search?: string): Promise<Patient[]> {
    if (search) {
      return await db.select().from(patients)
        .where(
          or(
            ilike(patients.firstName, `%${search}%`),
            ilike(patients.lastName, `%${search}%`),
            ilike(patients.phone, `%${search}%`)
          )
        )
        .orderBy(desc(patients.createdAt));
    }
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values(insertPatient)
      .returning();
    return patient;
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
    const [visit] = await db
      .insert(visits)
      .values(insertVisit)
      .returning();
    return visit;
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

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalPatients: number;
    todayVisits: number;
    lowStockItems: number;
    pendingLabs: number;
  }> {
    const [totalPatientsResult] = await db.select({ count: patients.id }).from(patients);
    const todayVisitsResult = await this.getTodaysVisits();
    const lowStockResult = await this.getLowStockMedicines();
    const pendingLabsResult = await this.getPendingLabResults();

    return {
      totalPatients: totalPatientsResult?.count || 0,
      todayVisits: todayVisitsResult.length,
      lowStockItems: lowStockResult.length,
      pendingLabs: pendingLabsResult.length,
    };
  }
}

export const storage = new DatabaseStorage();
