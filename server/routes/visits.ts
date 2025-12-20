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
      
      // Prepare visit data
      const visitData = {
        ...cleanedData,
        patientId,
        doctorId: req.user.id,
        organizationId: req.user.organizationId
      };
      
      // Use VisitService to create visit
      const { VisitService } = await import("../services/VisitService");
      const visit = await VisitService.createVisit(visitData);
      
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
      const userOrgId = req.user?.organizationId;
      
      // Use VisitService to get patient visits
      const { VisitService } = await import("../services/VisitService");
      const patientVisits = await VisitService.getVisitsByPatient(patientId, userOrgId);
      
      res.json(patientVisits);
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
      const userOrgId = req.user?.organizationId;
      
      // Use VisitService to get visit
      const { VisitService } = await import("../services/VisitService");
      const visit = await VisitService.getVisitById(visitId);
      
      if (!visit || visit.patientId !== patientId) {
        return res.status(404).json({ message: "Visit not found" });
      }
      
      // Verify organization if provided
      if (userOrgId && visit.organizationId !== userOrgId) {
        return res.status(403).json({ message: "Access denied" });
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
      
      // Use VisitService to update visit
      const { VisitService } = await import("../services/VisitService");
      const updatedVisit = await VisitService.updateVisit(
        visitId,
        cleanedData,
        req.user.organizationId
      );
      
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
      const visitId = parseInt(req.params.visitId);
      
      if (!req.user?.organizationId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Use VisitService to finalize visit
      const { VisitService } = await import("../services/VisitService");
      const updatedVisit = await VisitService.finalizeVisit(visitId, req.user.organizationId);
      
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
      
      // Use VisitService to get visits
      const { VisitService } = await import("../services/VisitService");
      const visitList = await VisitService.getVisits({
        organizationId: req.user.organizationId,
        status: status as string | undefined,
        patientId: patientId ? parseInt(patientId as string) : undefined,
        doctorId: doctorId ? parseInt(doctorId as string) : undefined,
        limit: limitNum
      });
      
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

