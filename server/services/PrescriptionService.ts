import { storage } from "../storage";
import { db } from "../db";
import { prescriptions, patients, users, organizations, medications } from "@shared/schema";
import { insertPrescriptionSchema, type Prescription, type InsertPrescription } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { generatePrescriptionHTML } from "../utils/html-generators";

/**
 * Prescription and medication management service
 * Handles prescription creation, medication reviews, and pharmacy operations
 */
export class PrescriptionService {
  
  /**
   * Create prescription for patient with validation
   */
  static async createPrescription(
    patientId: number, 
    prescriptionData: Partial<InsertPrescription>,
    userId: number,
    organizationId?: number
  ): Promise<Prescription> {
    // Verify patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Get user info for prescribedBy
    const [user] = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Prepare prescription data
    const requestData = {
      ...prescriptionData,
      patientId,
      prescribedBy: user.username,
      organizationId: organizationId || patient.organizationId
    };

    // Convert date strings to Date objects if present
    if (requestData.startDate && typeof requestData.startDate === 'string') {
      requestData.startDate = new Date(requestData.startDate);
    }
    if (requestData.endDate && typeof requestData.endDate === 'string') {
      requestData.endDate = new Date(requestData.endDate);
    }

    // Validate with Zod schema
    const validatedData = insertPrescriptionSchema.parse(requestData);

    // Create prescription via storage layer
    const prescription = await storage.createPrescription(validatedData);
    return prescription;
  }

  /**
   * Get patient prescriptions with organization filtering
   */
  static async getPatientPrescriptions(
    patientId: number,
    organizationId?: number
  ): Promise<Prescription[]> {
    // Verify patient exists
    const patient = await storage.getPatient(patientId);
    if (!patient) {
      return [];
    }

    // Build query
    let whereConditions = [eq(prescriptions.patientId, patientId)];

    if (organizationId) {
      whereConditions.push(eq(prescriptions.organizationId, organizationId));
    }

    const patientPrescriptions = await db.select({
      id: prescriptions.id,
      patientId: prescriptions.patientId,
      visitId: prescriptions.visitId,
      medicationId: prescriptions.medicationId,
      medicationName: sql<string>`COALESCE(${prescriptions.medicationName}, ${medications.name})`.as('medicationName'),
      dosage: prescriptions.dosage,
      frequency: prescriptions.frequency,
      duration: prescriptions.duration,
      instructions: prescriptions.instructions,
      prescribedBy: prescriptions.prescribedBy,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      status: prescriptions.status,
      organizationId: prescriptions.organizationId,
      createdAt: prescriptions.createdAt,
    })
      .from(prescriptions)
      .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
      .where(and(...whereConditions))
      .orderBy(desc(prescriptions.createdAt));

    return patientPrescriptions as any[];
  }

  /**
   * Get all prescriptions for organization
   */
  static async getPrescriptions(organizationId: number): Promise<Prescription[]> {
    const prescriptionsResult = await db.select()
      .from(prescriptions)
      .where(eq(prescriptions.organizationId, organizationId))
      .orderBy(desc(prescriptions.createdAt));

    return prescriptionsResult;
  }

  /**
   * Get prescription by ID
   */
  static async getPrescriptionById(
    prescriptionId: number,
    organizationId?: number
  ): Promise<Prescription | null> {
    let whereConditions = [eq(prescriptions.id, prescriptionId)];

    if (organizationId) {
      whereConditions.push(eq(prescriptions.organizationId, organizationId));
    }

    const [prescription] = await db.select()
      .from(prescriptions)
      .where(and(...whereConditions))
      .limit(1);

    return prescription || null;
  }

  /**
   * Create medication review assignment
   */
  static async createMedicationReview(reviewData: any): Promise<any> {
    // TODO: Implement when medication review system is fully defined
    throw new Error("Medication review assignment not yet implemented");
  }

  /**
   * Update prescription status
   */
  static async updatePrescription(
    prescriptionId: number,
    updates: Partial<InsertPrescription>,
    organizationId?: number
  ): Promise<Prescription> {
    // Verify prescription exists
    const existing = await this.getPrescriptionById(prescriptionId, organizationId);
    if (!existing) {
      throw new Error("Prescription not found");
    }

    // Remove undefined/empty fields
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof typeof updates] !== undefined && updates[key as keyof typeof updates] !== '') {
        cleanUpdates[key] = updates[key as keyof typeof updates];
      }
    });

    const [updatedPrescription] = await db.update(prescriptions)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(prescriptions.id, prescriptionId))
      .returning();

    if (!updatedPrescription) {
      throw new Error("Failed to update prescription");
    }

    return updatedPrescription;
  }

  /**
   * Generate prescription HTML for printing
   */
  static async generatePrescriptionHTML(prescriptionId: number, userId: number): Promise<string> {
    // Get prescription details with patient info
    const [prescriptionResult] = await db.select({
      prescriptionId: prescriptions.id,
      patientId: prescriptions.patientId,
      medicationId: prescriptions.medicationId,
      medicationName: prescriptions.medicationName,
      dosage: prescriptions.dosage,
      frequency: prescriptions.frequency,
      duration: prescriptions.duration,
      instructions: prescriptions.instructions,
      startDate: prescriptions.startDate,
      endDate: prescriptions.endDate,
      status: prescriptions.status,
      prescribedBy: prescriptions.prescribedBy,
      createdAt: prescriptions.createdAt,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      patientDateOfBirth: patients.dateOfBirth,
      patientGender: patients.gender,
      patientPhone: patients.phone,
      patientAddress: patients.address
    })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(eq(prescriptions.id, prescriptionId));

    if (!prescriptionResult) {
      throw new Error("Prescription not found");
    }

    // Get current user's organization details for the letterhead
    const [currentUserOrg] = await db.select({
      doctorUsername: users.username,
      doctorFirstName: users.firstName,
      doctorLastName: users.lastName,
      doctorRole: users.role,
      organizationId: users.organizationId,
      organizationName: organizations.name,
      organizationType: organizations.type,
      organizationAddress: organizations.address,
      organizationPhone: organizations.phone,
      organizationEmail: organizations.email,
      organizationWebsite: organizations.website,
      organizationLogo: organizations.logoUrl,
      organizationTheme: organizations.themeColor
    })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.id, userId));

    // Combine prescription data with organization
    const combinedResult = {
      ...prescriptionResult,
      ...currentUserOrg
    };

    // Generate HTML using helper function
    return generatePrescriptionHTML(combinedResult);
  }
}