import { storage } from "../storage";
import { db } from "../db";
import { patients } from "@shared/schema";
import { eq, and, or, ilike, desc, ne } from "drizzle-orm";
import { insertPatientSchema, type Patient, type Visit, type InsertPatient } from "@shared/schema";
import { z } from "zod";

/**
 * Patient business logic service
 * Centralizes patient-related operations and business rules
 */
export class PatientService {
  
  /**
   * Create a new patient with validation and duplicate checking
   */
  static async createPatient(patientData: InsertPatient, organizationId: number): Promise<Patient> {
    // Validate organization ID
    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    // Check if patient with same phone already exists in this organization
    if (patientData.phone) {
      const existingPatient = await db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.phone, patientData.phone),
            eq(patients.organizationId, organizationId)
          )
        )
        .limit(1);

      if (existingPatient.length > 0) {
        throw new Error("A patient with this phone number already exists in this organization.");
      }
    }

    // Add organization ID to patient data
    const patientDataWithOrg = {
      ...patientData,
      organizationId: organizationId
    };

    // Validate with Zod schema
    const validatedData = insertPatientSchema.parse(patientDataWithOrg);

    // Create patient via storage layer
    const patient = await storage.createPatient(validatedData);
    return patient;
  }

  /**
   * Get patient by ID with organization validation
   */
  static async getPatientById(patientId: number, organizationId?: number): Promise<Patient | null> {
    const patient = await storage.getPatient(patientId);
    
    if (!patient) {
      return null;
    }

    // If organization ID provided, verify patient belongs to that organization
    if (organizationId && patient.organizationId !== organizationId) {
      return null;
    }

    return patient;
  }

  /**
   * Search patients with filters and organization scoping
   */
  static async searchPatients(
    query?: string, 
    organizationId?: number,
    limit?: number,
    offset?: number
  ): Promise<Patient[]> {
    // Use storage layer which handles search and organization filtering
    const results = await storage.getPatients(query, organizationId);
    
    // Apply pagination if provided
    if (limit !== undefined || offset !== undefined) {
      const start = offset || 0;
      const end = limit !== undefined ? start + limit : undefined;
      return results.slice(start, end);
    }

    return results;
  }

  /**
   * Update patient information with validation
   */
  static async updatePatient(
    patientId: number, 
    updates: Partial<InsertPatient>,
    organizationId?: number
  ): Promise<Patient> {
    // Verify patient exists and belongs to organization if specified
    const existingPatient = await this.getPatientById(patientId, organizationId);
    if (!existingPatient) {
      throw new Error("Patient not found");
    }

    // If phone is being updated, check for duplicates
    if (updates.phone && updates.phone !== existingPatient.phone) {
      const orgId = organizationId || existingPatient.organizationId;
      if (orgId) {
        const duplicatePatient = await db
          .select()
          .from(patients)
          .where(
            and(
              eq(patients.phone, updates.phone),
              eq(patients.organizationId, orgId),
              ne(patients.id, patientId)
            )
          )
          .limit(1);

        if (duplicatePatient.length > 0) {
          throw new Error("A patient with this phone number already exists in this organization.");
        }
      }
    }

    // Update via storage layer
    const updated = await storage.updatePatient(patientId, updates);
    if (!updated) {
      throw new Error("Failed to update patient");
    }

    return updated;
  }

  /**
   * Create a visit record for a patient
   */
  static async createVisit(patientId: number, visitData: any, organizationId?: number): Promise<Visit> {
    // Verify patient exists and belongs to organization if specified
    const patient = await this.getPatientById(patientId, organizationId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Add organization ID if not provided
    const visitDataWithOrg = {
      ...visitData,
      patientId,
      organizationId: organizationId || patient.organizationId
    };

    // Create visit via storage layer
    const visit = await storage.createVisit(visitDataWithOrg);
    return visit;
  }

  /**
   * Get patient visits with pagination
   */
  static async getPatientVisits(
    patientId: number, 
    organizationId?: number,
    limit?: number, 
    offset?: number
  ): Promise<Visit[]> {
    // Verify patient exists and belongs to organization if specified
    const patient = await this.getPatientById(patientId, organizationId);
    if (!patient) {
      return [];
    }

    // Get visits via storage layer
    const visits = await storage.getVisitsByPatient(patientId);
    
    // Apply pagination if provided
    if (limit !== undefined || offset !== undefined) {
      const start = offset || 0;
      const end = limit !== undefined ? start + limit : undefined;
      return visits.slice(start, end);
    }

    return visits;
  }

  /**
   * Delete patient (with cascade option)
   */
  static async deletePatient(
    patientId: number,
    organizationId?: number,
    cascade: boolean = false
  ): Promise<boolean> {
    // Verify patient exists and belongs to organization if specified
    const patient = await this.getPatientById(patientId, organizationId);
    if (!patient) {
      return false;
    }

    // Delete via storage layer
    return await storage.deletePatient(patientId, cascade);
  }
}