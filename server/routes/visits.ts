import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";
import { insertVisitSchema, visits } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

/**
 * Visit management routes
 * Handles: visit CRUD, visit finalization, visit queries
 */
export function setupVisitRoutes(): Router {
  
  // Create visit for a patient
  router.post("/patients/:id/visits", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Clean up empty strings to undefined for optional fields
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
      
      // Validate and create visit
      const visitData = insertVisitSchema.parse({ 
        ...cleanedData, 
        patientId,
        doctorId: req.user.id,
        organizationId: req.user.organizationId
      });
      
      const visit = await storage.createVisit(visitData);
      res.json(visit);
    } catch (error: any) {
      console.error('Visit creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create visit", error: error.message });
      }
    }
  });

  // Get all visits for a patient
  router.get("/patients/:id/visits", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const visits = await storage.getVisitsByPatient(patientId);
      res.json(visits);
    } catch (error) {
      console.error('Error fetching visits:', error);
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
      console.error('Error fetching visit:', error);
      res.status(500).json({ message: "Failed to fetch visit" });
    }
  });

  // Update visit
  router.patch("/patients/:patientId/visits/:visitId", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const visitId = parseInt(req.params.visitId);
      
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Clean up empty strings
      const cleanedData = { ...req.body };
      if (cleanedData.heartRate === '') cleanedData.heartRate = undefined;
      if (cleanedData.temperature === '') cleanedData.temperature = undefined;
      if (cleanedData.weight === '') cleanedData.weight = undefined;
      if (cleanedData.followUpDate === '') cleanedData.followUpDate = undefined;
      
      // Field name mapping
      if (cleanedData.chiefComplaint !== undefined) {
        cleanedData.complaint = cleanedData.chiefComplaint;
        delete cleanedData.chiefComplaint;
      }
      if (cleanedData.treatmentPlan !== undefined) {
        cleanedData.treatment = cleanedData.treatmentPlan;
        delete cleanedData.treatmentPlan;
      }
      
      // Update visit
      const [updatedVisit] = await db.update(visits)
        .set({
          ...cleanedData,
          updatedAt: new Date()
        })
        .where(and(
          eq(visits.id, visitId),
          eq(visits.patientId, patientId),
          eq(visits.organizationId, req.user.organizationId)
        ))
        .returning();
      
      if (!updatedVisit) {
        return res.status(404).json({ message: "Visit not found" });
      }
      
      res.json(updatedVisit);
    } catch (error: any) {
      console.error('Error updating visit:', error);
      res.status(500).json({ message: "Failed to update visit", error: error.message });
    }
  });

  // Finalize visit (change status from draft to final)
  router.post("/patients/:patientId/visits/:visitId/finalize", authenticateToken, requireAnyRole(['doctor', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const visitId = parseInt(req.params.visitId);
      
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const [updatedVisit] = await db.update(visits)
        .set({ status: 'final' })
        .where(and(
          eq(visits.id, visitId),
          eq(visits.patientId, patientId),
          eq(visits.organizationId, req.user.organizationId)
        ))
        .returning();
      
      if (!updatedVisit) {
        return res.status(404).json({ message: "Visit not found" });
      }
      
      res.json({ message: "Visit finalized successfully", visit: updatedVisit });
    } catch (error: any) {
      console.error('Error finalizing visit:', error);
      res.status(500).json({ message: "Failed to finalize visit", error: error.message });
    }
  });

  // Get all visits (with optional filters)
  router.get("/visits", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const { status, patientId, doctorId, limit = '50' } = req.query;
      const limitNum = Math.min(parseInt(limit as string), 100);
      
      let whereConditions = [eq(visits.organizationId, req.user.organizationId)];
      
      if (status) {
        whereConditions.push(eq(visits.status, status as string));
      }
      if (patientId) {
        whereConditions.push(eq(visits.patientId, parseInt(patientId as string)));
      }
      if (doctorId) {
        whereConditions.push(eq(visits.doctorId, parseInt(doctorId as string)));
      }
      
      const visitList = await db.select()
        .from(visits)
        .where(and(...whereConditions))
        .orderBy(desc(visits.visitDate))
        .limit(limitNum);
      
      res.json(visitList);
    } catch (error) {
      console.error('Error fetching visits:', error);
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  // Get visit prescriptions
  router.get("/visits/:id/prescriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const visitId = parseInt(req.params.id);
      const prescriptions = await storage.getPrescriptionsByVisit(visitId);
      res.json(prescriptions);
    } catch (error) {
      console.error('Error fetching visit prescriptions:', error);
      res.status(500).json({ message: "Failed to fetch visit prescriptions" });
    }
  });

  return router;
}

