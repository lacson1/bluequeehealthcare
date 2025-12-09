import { db } from "../db";
import { vaccinations, patients } from "@shared/schema";
import { eq, desc, and, sql, lte, gte } from "drizzle-orm";
import { insertVaccinationSchema } from "@shared/schema";
import type { InsertVaccination } from "@shared/schema";

/**
 * VaccinationService - Business logic for vaccination operations
 */
export class VaccinationService {
  /**
   * Create a new vaccination
   */
  static async createVaccination(vaccinationData: InsertVaccination) {
    const validatedData = insertVaccinationSchema.parse(vaccinationData);
    const [newVaccination] = await db.insert(vaccinations).values(validatedData).returning();
    return newVaccination;
  }

  /**
   * Get vaccination by ID
   */
  static async getVaccinationById(vaccinationId: number, organizationId?: number) {
    let whereConditions = [eq(vaccinations.id, vaccinationId)];
    
    if (organizationId) {
      whereConditions.push(eq(vaccinations.organizationId, organizationId));
    }
    
    const [vaccination] = await db.select()
      .from(vaccinations)
      .where(and(...whereConditions))
      .limit(1);
    
    return vaccination || null;
  }

  /**
   * Get all vaccinations for a patient
   */
  static async getVaccinationsByPatient(patientId: number, organizationId?: number) {
    let whereConditions = [eq(vaccinations.patientId, patientId)];
    
    if (organizationId) {
      whereConditions.push(eq(vaccinations.organizationId, organizationId));
    }
    
    return await db.select()
      .from(vaccinations)
      .where(and(...whereConditions))
      .orderBy(desc(vaccinations.dateAdministered));
  }

  /**
   * Get all vaccinations (with patient info)
   */
  static async getAllVaccinations(organizationId: number, limit = 1000) {
    return await db.execute(sql`
      SELECT 
        v.id,
        v.patient_id as "patientId",
        p.first_name || ' ' || p.last_name as "patientName",
        v.vaccine_name as "vaccineName",
        v.date_administered as "dateAdministered",
        v.administered_by as "administeredBy",
        v.batch_number as "batchNumber",
        v.manufacturer,
        v.next_due_date as "nextDueDate",
        v.notes,
        v.organization_id as "organizationId",
        v.created_at as "createdAt"
      FROM vaccinations v
      INNER JOIN patients p ON v.patient_id = p.id
      WHERE v.organization_id = ${organizationId}
      ORDER BY v.date_administered DESC
      LIMIT ${limit}
    `);
  }

  /**
   * Update vaccination
   */
  static async updateVaccination(
    vaccinationId: number, 
    patientId: number,
    updateData: Partial<InsertVaccination>, 
    organizationId?: number
  ) {
    let whereConditions = [
      eq(vaccinations.id, vaccinationId),
      eq(vaccinations.patientId, patientId)
    ];
    
    if (organizationId) {
      whereConditions.push(eq(vaccinations.organizationId, organizationId));
    }
    
    const [updatedVaccination] = await db.update(vaccinations)
      .set(updateData)
      .where(and(...whereConditions))
      .returning();
    
    return updatedVaccination || null;
  }

  /**
   * Delete vaccination
   */
  static async deleteVaccination(
    vaccinationId: number,
    patientId: number,
    organizationId?: number
  ) {
    let whereConditions = [
      eq(vaccinations.id, vaccinationId),
      eq(vaccinations.patientId, patientId)
    ];
    
    if (organizationId) {
      whereConditions.push(eq(vaccinations.organizationId, organizationId));
    }
    
    const [deletedVaccination] = await db.delete(vaccinations)
      .where(and(...whereConditions))
      .returning();
    
    return deletedVaccination || null;
  }

  /**
   * Get vaccinations due soon
   */
  static async getVaccinationsDueSoon(organizationId: number, daysAhead = 30) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);

    return await db.execute(sql`
      SELECT 
        v.id,
        v.patient_id as "patientId",
        p.first_name || ' ' || p.last_name as "patientName",
        p.date_of_birth as "dateOfBirth",
        v.vaccine_name as "vaccineName",
        v.next_due_date as "nextDueDate",
        v.date_administered as "dateAdministered"
      FROM vaccinations v
      INNER JOIN patients p ON v.patient_id = p.id
      WHERE v.organization_id = ${organizationId}
        AND v.next_due_date IS NOT NULL
        AND v.next_due_date <= ${dueDate.toISOString()}
        AND v.next_due_date >= CURRENT_DATE
      ORDER BY v.next_due_date ASC
    `);
  }

  /**
   * Get vaccination statistics
   */
  static async getVaccinationStatistics(organizationId: number) {
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as "totalVaccinations",
        COUNT(DISTINCT patient_id) as "patientsVaccinated",
        COUNT(CASE WHEN next_due_date <= CURRENT_DATE THEN 1 END) as "overdue",
        COUNT(CASE WHEN next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as "dueSoon"
      FROM vaccinations
      WHERE organization_id = ${organizationId}
    `);

    return stats.rows[0] || {
      totalVaccinations: 0,
      patientsVaccinated: 0,
      overdue: 0,
      dueSoon: 0
    };
  }
}

