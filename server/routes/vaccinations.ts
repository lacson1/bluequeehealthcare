import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { insertVaccinationSchema, vaccinations } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

/**
 * Vaccination management routes
 * Handles: vaccination CRUD, immunization tracking, due date management
 */
export function setupVaccinationRoutes(): Router {
  
  // Get all vaccinations (for dashboard/reports)
  router.get("/vaccinations/all", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Get vaccinations with patient info
      const result = await db.execute(sql`
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
        WHERE v.organization_id = ${userOrgId}
        ORDER BY v.date_administered DESC
        LIMIT 1000
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching all vaccinations:', error);
      res.status(500).json({ message: "Failed to fetch vaccinations" });
    }
  });

  // Get patient vaccinations
  router.get("/patients/:id/vaccinations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const patientVaccinations = await db.select()
        .from(vaccinations)
        .where(and(
          eq(vaccinations.patientId, patientId),
          eq(vaccinations.organizationId, userOrgId)
        ))
        .orderBy(desc(vaccinations.dateAdministered));
      
      res.json(patientVaccinations || []);
    } catch (error) {
      console.error("Error fetching patient vaccinations:", error);
      res.status(500).json({ message: "Failed to fetch vaccinations" });
    }
  });

  // Add patient vaccination
  router.post("/patients/:id/vaccinations", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Process the data to handle empty date strings
      const processedData = {
        ...req.body,
        patientId,
        organizationId: userOrgId,
        administeredBy: req.user?.username || req.user?.firstName || 'Staff',
        nextDueDate: req.body.nextDueDate === '' ? null : req.body.nextDueDate
      };
      
      const validatedData = insertVaccinationSchema.parse(processedData);
      
      const [newVaccination] = await db.insert(vaccinations)
        .values(validatedData)
        .returning();
      
      res.json(newVaccination);
    } catch (error) {
      console.error("Error adding vaccination:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid vaccination data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add vaccination" });
      }
    }
  });

  // Update vaccination
  router.patch("/patients/:patientId/vaccinations/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const vaccinationId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Process nextDueDate if provided
      const updateData = { ...req.body };
      if (updateData.nextDueDate === '') {
        updateData.nextDueDate = null;
      }
      
      const [updatedVaccination] = await db.update(vaccinations)
        .set(updateData)
        .where(and(
          eq(vaccinations.id, vaccinationId),
          eq(vaccinations.patientId, patientId),
          eq(vaccinations.organizationId, userOrgId)
        ))
        .returning();
      
      if (!updatedVaccination) {
        return res.status(404).json({ message: "Vaccination not found" });
      }
      
      res.json(updatedVaccination);
    } catch (error) {
      console.error("Error updating vaccination:", error);
      res.status(500).json({ message: "Failed to update vaccination" });
    }
  });

  // Delete vaccination
  router.delete("/patients/:patientId/vaccinations/:id", authenticateToken, requireAnyRole(['doctor', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const vaccinationId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const [deletedVaccination] = await db.delete(vaccinations)
        .where(and(
          eq(vaccinations.id, vaccinationId),
          eq(vaccinations.patientId, patientId),
          eq(vaccinations.organizationId, userOrgId)
        ))
        .returning();
      
      if (!deletedVaccination) {
        return res.status(404).json({ message: "Vaccination not found" });
      }
      
      res.json({ message: "Vaccination deleted successfully" });
    } catch (error) {
      console.error("Error deleting vaccination:", error);
      res.status(500).json({ message: "Failed to delete vaccination" });
    }
  });

  // Get vaccinations due soon
  router.get("/vaccinations/due-soon", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const daysAhead = parseInt(req.query.days as string) || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysAhead);

      const dueVaccinations = await db.execute(sql`
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
        WHERE v.organization_id = ${userOrgId}
          AND v.next_due_date IS NOT NULL
          AND v.next_due_date <= ${dueDate.toISOString()}
          AND v.next_due_date >= CURRENT_DATE
        ORDER BY v.next_due_date ASC
      `);

      res.json(dueVaccinations.rows || []);
    } catch (error) {
      console.error("Error fetching due vaccinations:", error);
      res.status(500).json({ message: "Failed to fetch due vaccinations" });
    }
  });

  // Get vaccination statistics
  router.get("/vaccinations/statistics", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const stats = await db.execute(sql`
        SELECT 
          COUNT(*) as "totalVaccinations",
          COUNT(DISTINCT patient_id) as "patientsVaccinated",
          COUNT(CASE WHEN next_due_date <= CURRENT_DATE THEN 1 END) as "overdue",
          COUNT(CASE WHEN next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as "dueSoon"
        FROM vaccinations
        WHERE organization_id = ${userOrgId}
      `);

      res.json(stats.rows[0] || {});
    } catch (error) {
      console.error("Error fetching vaccination statistics:", error);
      res.status(500).json({ message: "Failed to fetch vaccination statistics" });
    }
  });

  return router;
}

