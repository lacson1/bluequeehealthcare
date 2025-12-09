import { db } from "../db";
import { visits, patients } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { insertVisitSchema } from "@shared/schema";
import type { InsertVisit } from "@shared/schema";

/**
 * VisitService - Business logic for visit operations
 */
export class VisitService {
  /**
   * Create a new visit
   */
  static async createVisit(visitData: InsertVisit) {
    const validatedData = insertVisitSchema.parse(visitData);
    const [newVisit] = await db.insert(visits).values(validatedData).returning();
    return newVisit;
  }

  /**
   * Get visit by ID
   */
  static async getVisitById(visitId: number) {
    const [visit] = await db.select().from(visits).where(eq(visits.id, visitId)).limit(1);
    return visit || null;
  }

  /**
   * Get all visits for a patient
   */
  static async getVisitsByPatient(patientId: number, organizationId?: number) {
    let whereConditions = [eq(visits.patientId, patientId)];
    
    if (organizationId) {
      whereConditions.push(eq(visits.organizationId, organizationId));
    }
    
    return await db.select()
      .from(visits)
      .where(and(...whereConditions))
      .orderBy(desc(visits.visitDate));
  }

  /**
   * Update visit
   */
  static async updateVisit(visitId: number, updateData: Partial<InsertVisit>, organizationId?: number) {
    let whereConditions = [eq(visits.id, visitId)];
    
    if (organizationId) {
      whereConditions.push(eq(visits.organizationId, organizationId));
    }
    
    const [updatedVisit] = await db.update(visits)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(...whereConditions))
      .returning();
    
    return updatedVisit || null;
  }

  /**
   * Finalize visit (change status from draft to final)
   */
  static async finalizeVisit(visitId: number, organizationId: number) {
    const [updatedVisit] = await db.update(visits)
      .set({ status: 'final' })
      .where(and(
        eq(visits.id, visitId),
        eq(visits.organizationId, organizationId)
      ))
      .returning();
    
    return updatedVisit || null;
  }

  /**
   * Get visits with filters
   */
  static async getVisits(filters: {
    organizationId: number;
    status?: string;
    patientId?: number;
    doctorId?: number;
    limit?: number;
  }) {
    const { organizationId, status, patientId, doctorId, limit = 50 } = filters;
    
    let whereConditions = [eq(visits.organizationId, organizationId)];
    
    if (status) {
      whereConditions.push(eq(visits.status, status));
    }
    if (patientId) {
      whereConditions.push(eq(visits.patientId, patientId));
    }
    if (doctorId) {
      whereConditions.push(eq(visits.doctorId, doctorId));
    }
    
    return await db.select()
      .from(visits)
      .where(and(...whereConditions))
      .orderBy(desc(visits.visitDate))
      .limit(Math.min(limit, 100));
  }

  /**
   * Get visit statistics for a patient
   */
  static async getVisitStatistics(patientId: number, organizationId: number) {
    const allVisits = await this.getVisitsByPatient(patientId, organizationId);
    
    const totalVisits = allVisits.length;
    const completedVisits = allVisits.filter(v => v.status === 'final').length;
    const draftVisits = allVisits.filter(v => v.status === 'draft').length;
    const lastVisit = allVisits[0] || null;
    
    return {
      totalVisits,
      completedVisits,
      draftVisits,
      lastVisit
    };
  }
}

