import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";
import { insertPatientSchema, insertVisitSchema, patients, visits, vaccinations, prescriptions, labResults, labOrders } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, or, ilike, and, sql, inArray } from "drizzle-orm";
import { AuditLogger } from "../audit";

const router = Router();

/**
 * Patient management routes
 * Handles: patient CRUD, visits, medical records, search functionality
 */
export function setupPatientRoutes(): Router {

  // Create patient - Allow all authenticated users to register patients
  router.post("/patients", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // authenticateToken middleware should always set req.user
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate organizationId - use from body if provided, otherwise from user context
      const organizationId = req.body.organizationId || req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({
          message: "Organization ID is required. Please provide organizationId in request body or ensure your account is assigned to an organization."
        });
      }

      // Use PatientService to create patient (handles validation and duplicate checking)
      const { PatientService } = await import("../services/PatientService");
      const patient = await PatientService.createPatient(req.body, organizationId);

      return res.json(patient);
    } catch (error) {
      console.error('Patient registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      } else if (error instanceof Error) {
        // Handle service layer errors
        if (error.message.includes('already exists')) {
          return res.status(400).json({ message: error.message });
        } else if (error.message.includes('Organization ID')) {
          return res.status(400).json({ message: error.message });
        } else {
          return res.status(500).json({ message: "Failed to create patient", error: error.message });
        }
      } else {
        return res.status(500).json({ message: "Failed to create patient" });
      }
    }
  });

  // Enhanced patients endpoint with analytics
  router.get("/patients/enhanced", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (_req: AuthRequest, res) => {
    try {
      const patients = await storage.getPatients();
      return res.json(patients);
    } catch (error) {
      console.error('Error fetching enhanced patients:', error);
      return res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Patient analytics endpoint
  router.get("/patients/analytics", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (_req: AuthRequest, res) => {
    try {
      const patients = await storage.getPatients();
      return res.json(patients);
    } catch (error) {
      console.error('Error fetching patient analytics:', error);
      return res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Main patients listing
  router.get("/patients", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      const search = req.query.search as string | undefined;

      // Organization-filtered patients (if organizationId is null, show all patients - authentication disabled mode)
      let whereClause = userOrgId ? eq(patients.organizationId, userOrgId) : undefined;

      if (search) {
        const searchConditions = [
          ilike(patients.firstName, `%${search}%`),
          ilike(patients.lastName, `%${search}%`),
          ilike(patients.phone, `%${search}%`)
        ];
        if (userOrgId) {
          const combinedClause = and(
            eq(patients.organizationId, userOrgId),
            or(...searchConditions)
          );
          whereClause = combinedClause ?? eq(patients.organizationId, userOrgId);
        } else {
          whereClause = or(...searchConditions);
        }
      }

      const patientsResult = await db.select()
        .from(patients)
        .where(whereClause || undefined)
        .orderBy(desc(patients.createdAt));

      // Prevent caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.json(patientsResult);
    } catch (error) {
      console.error('Error fetching patients:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Search patients for autocomplete
  router.get("/patients/search", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const search = req.query.search as string || "";

      let whereClause = eq(patients.organizationId, userOrgId);

      if (search) {
        const searchConditions = or(
          ilike(patients.firstName, `%${search}%`),
          ilike(patients.lastName, `%${search}%`),
          ilike(patients.phone, `%${search}%`),
          ilike(patients.email, `%${search}%`)
        );
        whereClause = and(eq(patients.organizationId, userOrgId), searchConditions);
      }

      const searchResults = await db.select()
        .from(patients)
        .where(whereClause)
        .limit(20)
        .orderBy(desc(patients.createdAt));

      return res.json(searchResults);
    } catch (error) {
      console.error("Error searching patients:", error);
      return res.status(500).json({ message: "Failed to search patients" });
    }
  });

  // Get patient by ID
  router.get("/patients/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'super_admin';

      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Verify organization access (unless superadmin)
      if (!isSuperAdmin && userOrgId && patient.organizationId !== userOrgId) {
        return res.status(403).json({ message: "You don't have permission to access this patient" });
      }

      // Calculate age safely with proper null/undefined handling
      const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
      let age = null;

      if (dob && !isNaN(dob.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        // Ensure age is reasonable (0-150)
        if (age < 0 || age > 150) {
          age = null;
        }
      }

      return res.json({
        ...patient,
        age: age
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
      return res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Quick patient summary for doctor workflow
  router.get("/patients/:id/summary", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'super_admin';

      // Get basic patient info
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Verify organization access (unless superadmin)
      if (!isSuperAdmin && userOrgId && patient.organizationId !== userOrgId) {
        return res.status(403).json({ message: "You don't have permission to access this patient" });
      }

      // Get quick counts and latest data
      const [visitCount, prescriptionCount, labOrderCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(visits).where(eq(visits.patientId, patientId)),
        db.select({ count: sql<number>`count(*)` }).from(prescriptions).where(eq(prescriptions.patientId, patientId)),
        db.select({ count: sql<number>`count(*)` }).from(labOrders).where(eq(labOrders.patientId, patientId))
      ]);

      // Calculate age
      const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
      let age = null;
      if (dob && !isNaN(dob.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 0 || age > 150) age = null;
      }

      return res.json({
        patient: {
          ...patient,
          age,
          fullName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown'
        },
        summary: {
          totalVisits: visitCount[0]?.count || 0,
          totalPrescriptions: prescriptionCount[0]?.count || 0,
          totalLabOrders: labOrderCount[0]?.count || 0,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Failed to fetch patient summary:", error);
      return res.status(500).json({ message: "Failed to fetch patient summary" });
    }
  });

  // Update patient information
  router.patch("/patients/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      // Remove any undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const updatedPatient = await storage.updatePatient(id, updateData);
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Log the update action
      await req.auditLogger?.logPatientAction('UPDATE', id, {
        updatedFields: Object.keys(updateData)
      });

      return res.json(updatedPatient);
    } catch (error) {
      console.error('Error updating patient:', error);
      return res.status(500).json({ message: "Failed to update patient" });
    }
  });

  // Archive/unarchive patient (placeholder - not fully implemented)
  router.patch("/patients/:id/archive", authenticateToken, requireAnyRole(['doctor', 'admin']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { archived } = req.body;

      // Note: Archive functionality not fully implemented in schema
      // This endpoint exists for future implementation
      // For now, just log the action and return success

      await req.auditLogger?.logPatientAction(
        archived ? 'ARCHIVE' : 'UNARCHIVE',
        id,
        { archived }
      );

      return res.json({
        message: `Patient ${archived ? 'archived' : 'unarchived'} successfully (pending implementation)`,
        patient: { id }
      });
    } catch (error) {
      console.error('Error archiving patient:', error);
      return res.status(500).json({ message: "Failed to archive patient" });
    }
  });

  // Delete patient
  router.delete("/patients/:id", authenticateToken, requireAnyRole(['admin', 'doctor']), async (req: AuthRequest, res) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin';

      // Check if patient exists and belongs to user's organization (unless superadmin)
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Verify organization access (unless superadmin)
      if (!isSuperAdmin && userOrgId && patient.organizationId !== userOrgId) {
        return res.status(403).json({ message: "You don't have permission to delete this patient" });
      }

      // Check for cascade parameter
      const cascade = req.query.cascade === 'true' || req.body.cascade === true;

      // Attempt to delete patient
      try {
        await storage.deletePatient(id, cascade);

        // Log the deletion action
        const auditLogger = new AuditLogger(req);
        await auditLogger.logPatientAction('DELETE', id, {
          cascade,
          deletedBy: req.user?.id,
          deletedAt: new Date().toISOString()
        });

        return res.json({
          message: "Patient deleted successfully",
          patientId: id
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('related records')) {
          return res.status(409).json({
            message: error.message,
            error: "Patient has related records (visits, prescriptions, lab results, etc.). Use cascade=true to delete all related records.",
            patientId: id
          });
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      return res.status(500).json({
        message: "Failed to delete patient",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // === VISIT ROUTES ===

  // Create visit
  router.post("/patients/:id/visits", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      console.log('=== VISIT CREATION DEBUG ===');
      console.log('Patient ID:', patientId);
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('User making request:', req.user?.username, 'Role:', req.user?.role);

      // Clean up empty strings to undefined for optional fields and fix field mapping
      const cleanedData = { ...req.body };
      if (cleanedData.heartRate === '') cleanedData.heartRate = undefined;
      if (cleanedData.temperature === '') cleanedData.temperature = undefined;
      if (cleanedData.weight === '') cleanedData.weight = undefined;
      if (cleanedData.followUpDate === '') cleanedData.followUpDate = undefined;

      // Fix field name mapping - frontend sends chiefComplaint, backend expects complaint
      if (cleanedData.chiefComplaint !== undefined) {
        cleanedData.complaint = cleanedData.chiefComplaint;
        delete cleanedData.chiefComplaint;
      }

      // Fix field name mapping - frontend sends treatmentPlan, backend expects treatment
      if (cleanedData.treatmentPlan !== undefined) {
        cleanedData.treatment = cleanedData.treatmentPlan;
        delete cleanedData.treatmentPlan;
      }

      console.log('Cleaned data:', JSON.stringify(cleanedData, null, 2));

      // Add the staff member's organization ID to ensure proper letterhead attribution
      const visitData = insertVisitSchema.parse({
        ...cleanedData,
        patientId,
        doctorId: req.user?.id,
        organizationId: req.user?.organizationId
      });
      console.log('Parsed visit data:', JSON.stringify(visitData, null, 2));

      const visit = await storage.createVisit(visitData);
      console.log('Visit created successfully:', visit);
      return res.json(visit);
    } catch (error: any) {
      console.error('=== VISIT CREATION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error instance:', error.constructor.name);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      } else {
        console.error('Non-Zod error:', error);
        return res.status(500).json({ message: "Failed to create visit", error: error.message });
      }
    }
  });

  // Get patient visits
  router.get("/patients/:id/visits", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'super_admin';

      // Verify patient exists and belongs to user's organization (unless superadmin)
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      if (!isSuperAdmin && userOrgId && patient.organizationId !== userOrgId) {
        return res.status(403).json({ message: "You don't have permission to access this patient's visits" });
      }

      const visits = await storage.getVisitsByPatient(patientId);
      return res.json(visits);
    } catch (error) {
      console.error('Error fetching visits:', error);
      return res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  // Get individual visit
  router.get("/patients/:patientId/visits/:visitId", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const visitId = parseInt(req.params.visitId);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'super_admin';

      const visit = await storage.getVisitById(visitId);

      if (!visit || visit.patientId !== patientId) {
        return res.status(404).json({ message: "Visit not found" });
      }

      // Verify organization access (unless superadmin)
      if (!isSuperAdmin && userOrgId && visit.organizationId !== userOrgId) {
        return res.status(403).json({ message: "You don't have permission to access this visit" });
      }

      return res.json(visit);
    } catch (error) {
      console.error('Error fetching visit:', error);
      return res.status(500).json({ message: "Failed to fetch visit" });
    }
  });

  // Update visit
  router.patch("/patients/:patientId/visits/:visitId", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'super_admin';

      // Verify visit exists and belongs to user's organization (unless superadmin)
      const existingVisit = await storage.getVisitById(visitId);
      if (!existingVisit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      if (!isSuperAdmin && userOrgId && existingVisit.organizationId !== userOrgId) {
        return res.status(403).json({ message: "You don't have permission to update this visit" });
      }

      // Clean up empty strings to undefined for optional fields
      const cleanedData = { ...req.body };
      if (cleanedData.heartRate === '') cleanedData.heartRate = undefined;
      if (cleanedData.temperature === '') cleanedData.temperature = undefined;
      if (cleanedData.weight === '') cleanedData.weight = undefined;
      if (cleanedData.followUpDate === '') cleanedData.followUpDate = undefined;

      // Remove any undefined fields
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined || cleanedData[key] === '') {
          delete cleanedData[key];
        }
      });

      const updatedVisit = await storage.updateVisit(visitId, cleanedData);
      if (!updatedVisit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      // Log the update action
      await req.auditLogger?.logVisitAction('UPDATE', visitId, {
        updatedFields: Object.keys(cleanedData)
      });

      return res.json(updatedVisit);
    } catch (error) {
      console.error('Error updating visit:', error);
      return res.status(500).json({ message: "Failed to update visit" });
    }
  });

  // Get clinical notes for a patient (from AI consultations and visits)
  router.get("/patients/:id/clinical-notes", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(403).json({ message: "Organization context required" });
      }

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId)))
        .limit(1);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Get clinical notes from AI consultations
      const aiNotes = await storage.getClinicalNotesByPatient(patientId, userOrgId);

      // Get visits and convert them to clinical note format
      const patientVisits = await storage.getVisitsByPatient(patientId);
      const visitNotes = patientVisits
        .filter(visit => visit.organizationId === userOrgId && (visit.complaint || visit.diagnosis || visit.treatment))
        .map(visit => {
          const visitDate = visit.visitDate ? new Date(visit.visitDate).toISOString() : (visit.createdAt ? new Date(visit.createdAt).toISOString() : new Date().toISOString());
          return {
            id: visit.id + 1000000, // Offset to avoid conflicts with AI consultation notes
            consultationId: null,
            subjective: visit.complaint || undefined,
            objective: undefined, // Visits don't have a separate notes field
            assessment: visit.diagnosis || undefined,
            plan: visit.treatment || undefined,
            chiefComplaint: visit.complaint || undefined,
            historyOfPresentIllness: undefined,
            pastMedicalHistory: undefined,
            diagnosis: visit.diagnosis || undefined,
            recommendations: undefined,
            followUpInstructions: undefined,
            followUpDate: visit.followUpDate ? new Date(visit.followUpDate).toISOString().split('T')[0] : undefined,
            consultationDate: visitDate,
            createdAt: visit.createdAt ? new Date(visit.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: visit.createdAt ? new Date(visit.createdAt).toISOString() : new Date().toISOString(),
          };
        });

      // Combine and sort by date (most recent first)
      // Type assertion needed because aiNotes and visitNotes have slightly different structures
      const allNotes = [...aiNotes, ...visitNotes].sort((a: any, b: any) => {
        const dateA = a.consultationDate ? new Date(a.consultationDate).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.consultationDate ? new Date(b.consultationDate).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      return res.json(allNotes);
    } catch (error) {
      console.error('Error fetching clinical notes:', error);
      return res.status(500).json({ message: "Failed to fetch clinical notes" });
    }
  });

  // Create a new clinical note for a patient
  router.post("/patients/:id/clinical-notes", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!userOrgId) {
        return res.status(403).json({ message: "Organization context required" });
      }

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId)))
        .limit(1);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const { subjective, objective, assessment, plan, chiefComplaint, diagnosis, recommendations, followUpInstructions, followUpDate, consultationDate } = req.body;

      const newNote = await storage.createClinicalNote({
        patientId,
        organizationId: userOrgId,
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null,
        chiefComplaint: chiefComplaint || null,
        diagnosis: diagnosis || null,
        recommendations: recommendations || null,
        followUpInstructions: followUpInstructions || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        consultationDate: consultationDate ? new Date(consultationDate) : new Date(),
        createdBy: userId,
      } as any);

      return res.status(201).json(newNote);
    } catch (error) {
      console.error('Error creating clinical note:', error);
      return res.status(500).json({ message: "Failed to create clinical note" });
    }
  });

  // Update a clinical note
  router.patch("/patients/:id/clinical-notes/:noteId", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const noteId = parseInt(req.params.noteId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(403).json({ message: "Organization context required" });
      }

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId)))
        .limit(1);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const { subjective, objective, assessment, plan, chiefComplaint, diagnosis, recommendations, followUpInstructions, followUpDate } = req.body;

      const updatedNote = await storage.updateClinicalNote(noteId, {
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null,
        chiefComplaint: chiefComplaint || null,
        diagnosis: diagnosis || null,
        recommendations: recommendations || null,
        followUpInstructions: followUpInstructions || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      } as any, userOrgId);

      return res.json(updatedNote);
    } catch (error) {
      console.error('Error updating clinical note:', error);
      return res.status(500).json({ message: "Failed to update clinical note" });
    }
  });

  // Delete a clinical note
  router.delete("/patients/:id/clinical-notes/:noteId", authenticateToken, requireAnyRole(['doctor', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const noteId = parseInt(req.params.noteId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(403).json({ message: "Organization context required" });
      }

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId)))
        .limit(1);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      await storage.deleteClinicalNote(noteId, userOrgId);

      return res.json({ message: "Clinical note deleted successfully" });
    } catch (error) {
      console.error('Error deleting clinical note:', error);
      return res.status(500).json({ message: "Failed to delete clinical note" });
    }
  });

  // === GLOBAL SEARCH (Patient-centric) ===

  // Enhanced global search endpoint - includes patients, vaccinations, prescriptions, lab results
  router.get("/search/global", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const search = req.query.q as string || "";
      const type = req.query.type as string || "all"; // all, patients, vaccinations, prescriptions, labs

      if (!search || search.length < 2) {
        return res.json({ results: [], totalCount: 0 });
      }

      const results: any[] = [];

      // Search patients
      if (type === "all" || type === "patients") {
        const patientResults = await db.select({
          id: patients.id,
          type: sql<string>`'patient'`,
          title: patients.firstName,
          subtitle: patients.lastName,
          description: patients.phone,
          metadata: sql<any>`json_object('email', ${patients.email}, 'gender', ${patients.gender}, 'dateOfBirth', ${patients.dateOfBirth})`
        })
          .from(patients)
          .where(and(
            eq(patients.organizationId, userOrgId),
            or(
              ilike(patients.firstName, `%${search}%`),
              ilike(patients.lastName, `%${search}%`),
              ilike(patients.phone, `%${search}%`),
              ilike(patients.email, `%${search}%`)
            )
          ))
          .limit(10);

        results.push(...patientResults);
      }

      // Search vaccinations (if needed, can be moved to separate module later)
      if (type === "all" || type === "vaccinations") {
        // Get patient IDs for this organization first
        const orgPatientIds = await db.select({ id: patients.id })
          .from(patients)
          .where(eq(patients.organizationId, userOrgId));

        const patientIdList = orgPatientIds.map(p => p.id);

        if (patientIdList.length > 0) {
          const vaccinationResults = await db.select({
            id: vaccinations.id,
            type: sql<string>`'vaccination'`,
            title: vaccinations.vaccineName,
            subtitle: sql<string>`'Vaccination'`,
            description: vaccinations.dateAdministered,
            metadata: sql<any>`json_object('patientId', ${vaccinations.patientId}, 'dateAdministered', ${vaccinations.dateAdministered}, 'administeredBy', ${vaccinations.administeredBy})`
          })
            .from(vaccinations)
            .where(and(
              inArray(vaccinations.patientId, patientIdList),
              ilike(vaccinations.vaccineName, `%${search}%`)
            ))
            .limit(10);

          results.push(...vaccinationResults);
        }
      }

      // Search prescriptions (if needed, can be moved to separate module later)
      if (type === "all" || type === "prescriptions") {
        const prescriptionResults = await db.select({
          id: prescriptions.id,
          type: sql<string>`'prescription'`,
          title: prescriptions.medicationName,
          subtitle: sql<string>`'Prescription'`,
          description: prescriptions.dosage,
          metadata: sql<any>`json_object('patientId', ${prescriptions.patientId}, 'startDate', ${prescriptions.startDate}, 'prescribedBy', ${prescriptions.prescribedBy})`
        })
          .from(prescriptions)
          .where(and(
            eq(prescriptions.organizationId, userOrgId),
            or(
              ilike(prescriptions.medicationName, `%${search}%`),
              ilike(prescriptions.dosage, `%${search}%`)
            )
          ))
          .limit(10);

        results.push(...prescriptionResults);
      }

      // Search lab results (if needed, can be moved to separate module later)
      if (type === "all" || type === "labs") {
        const labResultsData = await db.select({
          id: labResults.id,
          type: sql<string>`'lab_result'`,
          title: labResults.testName,
          subtitle: sql<string>`'Lab Result'`,
          description: labResults.result,
          metadata: sql<any>`json_object('patientId', ${labResults.patientId}, 'testDate', ${labResults.testDate})`
        })
          .from(labResults)
          .where(and(
            eq(labResults.organizationId, userOrgId),
            or(
              ilike(labResults.testName, `%${search}%`),
              ilike(labResults.result, `%${search}%`)
            )
          ))
          .limit(10);

        results.push(...labResultsData);
      }

      // Sort results by relevance (exact matches first, then partial matches)
      const sortedResults = results.sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
        const bExact = b.title.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
        return bExact - aExact;
      });

      return res.json({
        results: sortedResults.slice(0, 20),
        totalCount: sortedResults.length,
        searchTerm: search,
        searchType: type
      });
    } catch (error) {
      console.error("Error in global search:", error);
      return res.status(500).json({ message: "Search failed" });
    }
  });

  // Get recent patients for dashboard
  router.get("/patients/recent", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const recentPatients = await db.select({
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        phone: patients.phone,
        email: patients.email,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        address: patients.address,
        createdAt: patients.createdAt
      })
        .from(patients)
        .where(eq(patients.organizationId, req.user!.organizationId!))
        .orderBy(desc(patients.createdAt))
        .limit(5);

      // Prevent caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      return res.json(recentPatients || []);
    } catch (error) {
      console.error("Error fetching recent patients:", error);
      return res.status(500).json({ message: "Failed to fetch recent patients" });
    }
  });

  return router;
}