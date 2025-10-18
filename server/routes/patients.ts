import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";
import { insertPatientSchema, insertVisitSchema, patients, visits, vaccinations, prescriptions, labResults, labOrders } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, or, ilike, and, sql } from "drizzle-orm";

const router = Router();

/**
 * Patient management routes
 * Handles: patient CRUD, visits, medical records, search functionality
 */
export function setupPatientRoutes(): Router {
  
  // Create patient
  router.post("/patients", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      // Add the staff member's organization ID to ensure proper attribution
      const patientData = insertPatientSchema.parse({
        ...req.body,
        organizationId: req.user?.organizationId
      });
      const patient = await storage.createPatient(patientData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create patient" });
      }
    }
  });

  // Enhanced patients endpoint with analytics
  router.get("/patients/enhanced", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error('Error fetching enhanced patients:', error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Patient analytics endpoint
  router.get("/patients/analytics", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error('Error fetching patient analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Main patients listing
  router.get("/patients", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const search = req.query.search as string | undefined;
      
      // Organization-filtered patients
      let whereClause = eq(patients.organizationId, userOrgId);
      
      if (search) {
        const searchConditions = [
          ilike(patients.firstName, `%${search}%`),
          ilike(patients.lastName, `%${search}%`),
          ilike(patients.phone, `%${search}%`)
        ];
        const combinedClause = and(
          eq(patients.organizationId, userOrgId),
          or(...searchConditions)
        );
        whereClause = combinedClause ?? eq(patients.organizationId, userOrgId);
      }
      
      const patientsResult = await db.select()
        .from(patients)
        .where(whereClause)
        .orderBy(desc(patients.createdAt));
      
      // Prevent caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(patientsResult);
    } catch (error) {
      console.error('Error fetching patients:', error);
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
        
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching patients:", error);
      res.status(500).json({ message: "Failed to search patients" });
    }
  });

  // Get patient by ID
  router.get("/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        res.status(404).json({ message: "Patient not found" });
        return;
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

      res.json({
        ...patient,
        age: age
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Quick patient summary for doctor workflow
  router.get("/patients/:id/summary", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      
      // Get basic patient info
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
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

      res.json({
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
      res.status(500).json({ message: "Failed to fetch patient summary" });
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
        res.status(404).json({ message: "Patient not found" });
        return;
      }

      // Log the update action
      await req.auditLogger?.logPatientAction('UPDATE', id, { 
        updatedFields: Object.keys(updateData) 
      });

      res.json(updatedPatient);
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ message: "Failed to update patient" });
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

      res.json({ 
        message: `Patient ${archived ? 'archived' : 'unarchived'} successfully (pending implementation)`, 
        patient: { id } 
      });
    } catch (error) {
      console.error('Error archiving patient:', error);
      res.status(500).json({ message: "Failed to archive patient" });
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
      res.json(visit);
    } catch (error: any) {
      console.error('=== VISIT CREATION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error instance:', error.constructor.name);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
        res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      } else {
        console.error('Non-Zod error:', error);
        res.status(500).json({ message: "Failed to create visit", error: error.message });
      }
    }
  });

  // Get patient visits
  router.get("/patients/:id/visits", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const visits = await storage.getVisitsByPatient(patientId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  // Get individual visit
  router.get("/patients/:patientId/visits/:visitId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const visitId = parseInt(req.params.visitId);
      const visit = await storage.getVisitById(visitId);
      
      if (!visit || visit.patientId !== patientId) {
        return res.status(404).json({ message: "Visit not found" });
      }
      
      res.json(visit);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visit" });
    }
  });

  // Update visit
  router.patch("/patients/:patientId/visits/:visitId", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const visitId = parseInt(req.params.visitId);
      
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

      res.json(updatedVisit);
    } catch (error) {
      console.error('Error updating visit:', error);
      res.status(500).json({ message: "Failed to update visit" });
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
        const vaccinationResults = await db.select({
          id: vaccinations.id,
          type: sql<string>`'vaccination'`,
          title: vaccinations.vaccineName,
          subtitle: sql<string>`'Vaccination'`,
          description: vaccinations.doseNumber,
          metadata: sql<any>`json_object('patientId', ${vaccinations.patientId}, 'administeredDate', ${vaccinations.administeredDate})`
        })
        .from(vaccinations)
        .where(and(
          eq(vaccinations.organizationId, userOrgId),
          ilike(vaccinations.vaccineName, `%${search}%`)
        ))
        .limit(10);
        
        results.push(...vaccinationResults);
      }

      // Search prescriptions (if needed, can be moved to separate module later)
      if (type === "all" || type === "prescriptions") {
        const prescriptionResults = await db.select({
          id: prescriptions.id,
          type: sql<string>`'prescription'`,
          title: prescriptions.medicationName,
          subtitle: sql<string>`'Prescription'`,
          description: prescriptions.dosage,
          metadata: sql<any>`json_object('patientId', ${prescriptions.patientId}, 'prescribedDate', ${prescriptions.prescribedDate})`
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

      res.json({
        results: sortedResults.slice(0, 20),
        totalCount: sortedResults.length,
        searchTerm: search,
        searchType: type
      });
    } catch (error) {
      console.error("Error in global search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  return router;
}