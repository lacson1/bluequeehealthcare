import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";
import { insertMedicineSchema, insertPrescriptionSchema, medicines, prescriptions, patients, users, organizations } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { AuditLogger } from "../audit";

const router = Router();

/**
 * Prescription and medication management routes
 * Handles: prescriptions, medication reviews, pharmacy operations
 */
export function setupPrescriptionRoutes(): Router {

  // === MEDICINES MANAGEMENT ===

  // Create medicine (pharmacist and admin only)
  router.post("/medicines", authenticateToken, requireAnyRole(['pharmacist', 'admin']), async (req: AuthRequest, res) => {
    try {
      const medicineData = insertMedicineSchema.parse(req.body);
      const medicine = await storage.createMedicine(medicineData);
      res.json(medicine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid medicine data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create medicine" });
      }
    }
  });

  // Get medicines
  router.get("/medicines", authenticateToken, requireAnyRole(['pharmacist', 'doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const medicines = await storage.getMedicines();
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });

  // Update medicine quantity (simple version)
  router.patch("/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== "number" || quantity < 0) {
        res.status(400).json({ message: "Invalid quantity" });
        return;
      }
      
      const medicine = await storage.updateMedicineQuantity(id, quantity);
      res.json(medicine);
    } catch (error) {
      res.status(500).json({ message: "Failed to update medicine quantity" });
    }
  });

  // Update medicine quantity for inventory management
  router.patch("/medicines/:id/quantity", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      const updatedMedicine = await storage.updateMedicineQuantity(medicineId, quantity);
      
      // Log the inventory update for audit purposes
      if (req.auditLogger) {
        await req.auditLogger.logMedicineAction('quantity_updated', medicineId, {
          newQuantity: quantity,
          updatedBy: req.user?.username
        });
      }

      res.json(updatedMedicine);
    } catch (error) {
      console.error('Error updating medicine quantity:', error);
      res.status(500).json({ error: "Failed to update medicine quantity" });
    }
  });

  // Medicine reorder request
  router.post("/medicines/reorder", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { medicineId, quantity, priority, notes } = req.body;

      if (!medicineId || !quantity || !priority) {
        return res.status(400).json({ error: "Medicine ID, quantity, and priority are required" });
      }

      // Get medicine details
      const medicine = await db.select().from(medicines).where(eq(medicines.id, medicineId)).limit(1);
      if (!medicine.length) {
        return res.status(404).json({ error: "Medicine not found" });
      }

      // Create reorder request
      const reorderRequest = {
        medicineId,
        medicineName: medicine[0].name,
        quantity,
        priority,
        notes: notes || '',
        requestedBy: req.user?.username || 'Unknown',
        requestedAt: new Date(),
        status: 'pending'
      };

      // Log the reorder request
      if (req.auditLogger) {
        await req.auditLogger.logMedicineAction('reorder_requested', medicineId, {
          quantity,
          priority,
          notes,
          requestedBy: req.user?.username
        });
      }

      res.json({ 
        message: "Reorder request submitted successfully",
        reorderRequest 
      });
    } catch (error) {
      console.error('Error creating reorder request:', error);
      res.status(500).json({ error: "Failed to create reorder request" });
    }
  });

  // Get low stock medicines
  router.get("/medicines/low-stock", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const lowStockThreshold = parseInt(req.query.threshold as string) || 10;
      
      const lowStockMedicines = await db.select()
        .from(medicines)
        .where(sql`${medicines.quantity} < ${lowStockThreshold}`)
        .orderBy(medicines.quantity);

      res.json(lowStockMedicines);
    } catch (error) {
      console.error("Error fetching low stock medicines:", error);
      res.status(500).json({ message: "Failed to fetch low stock medicines" });
    }
  });

  // Search medicines
  router.get("/medicines/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      const searchTerm = (q as string) || "";
      
      if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
      }

      const medicines = await db.select()
        .from(medicines)
        .where(sql`${medicines.name} ILIKE ${'%' + searchTerm + '%'}`)
        .limit(10)
        .orderBy(medicines.name);

      res.json(medicines);
    } catch (error) {
      console.error("Error searching medicines:", error);
      res.status(500).json({ message: "Failed to search medicines" });
    }
  });

  // === PRESCRIPTIONS MANAGEMENT ===

  // Get all prescriptions
  router.get("/prescriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Organization-filtered prescriptions
      const prescriptionsResult = await db.select()
        .from(prescriptions)
        .where(eq(prescriptions.organizationId, userOrgId))
        .orderBy(desc(prescriptions.createdAt));
      
      res.json(prescriptionsResult);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  // Create prescription for patient
  router.post("/patients/:id/prescriptions", authenticateToken, requireAnyRole(['doctor', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const user = req.user!;
      
      // Add required fields from the authenticated user and handle date conversion
      const requestData = {
        ...req.body, 
        patientId,
        prescribedBy: user.username,
        organizationId: user.organizationId || null
      };
      
      // Convert date strings to Date objects if present
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        requestData.startDate = new Date(requestData.startDate);
      }
      if (requestData.endDate && typeof requestData.endDate === 'string') {
        requestData.endDate = new Date(requestData.endDate);
      }
      
      const prescriptionData = insertPrescriptionSchema.parse(requestData);
      
      const prescription = await storage.createPrescription(prescriptionData);
      
      // Log audit trail
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPrescriptionAction('create', prescription.id, {
        patientId,
        medicationId: prescription.medicationId,
        medicationName: prescription.medicationName,
        dosage: prescription.dosage
      });
      
      res.json(prescription);
    } catch (error) {
      console.error('Prescription creation error:', error);
      console.error('Request body:', req.body);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid prescription data", errors: error.errors });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return res.status(500).json({ message: "Failed to create prescription", error: errorMessage });
      }
    }
  });

  // Print prescription with organization details
  router.get('/prescriptions/:id/print', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      
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
        return res.status(404).json({ message: "Prescription not found" });
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
      .where(eq(users.id, req.user!.id));

      // Combine prescription data with current user's organization
      const combinedResult = {
        ...prescriptionResult,
        ...currentUserOrg
      };

      // Generate HTML for printing using helper function (will be moved from main routes.ts)
      const html = generatePrescriptionHTML(combinedResult);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Print prescription error:', error);
      res.status(500).json({ message: "Failed to generate prescription print" });
    }
  });

  // Get patient prescriptions
  router.get("/patients/:id/prescriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const patientPrescriptions = await db.select()
        .from(prescriptions)
        .where(and(
          eq(prescriptions.patientId, patientId),
          eq(prescriptions.organizationId, userOrgId)
        ))
        .orderBy(desc(prescriptions.createdAt));

      res.json(patientPrescriptions);
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      res.status(500).json({ message: "Failed to fetch patient prescriptions" });
    }
  });

  // Get active patient prescriptions
  router.get("/patients/:id/prescriptions/active", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      
      const activePrescriptions = await db.select()
        .from(prescriptions)
        .where(and(
          eq(prescriptions.patientId, patientId),
          eq(prescriptions.status, 'active')
        ))
        .orderBy(desc(prescriptions.createdAt));

      res.json(activePrescriptions);
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      res.status(500).json({ message: "Failed to fetch active prescriptions" });
    }
  });

  // Update prescription status
  router.patch("/prescriptions/:id/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const [updatedPrescription] = await db.update(prescriptions)
        .set({ status, updatedAt: new Date() })
        .where(eq(prescriptions.id, prescriptionId))
        .returning();

      if (!updatedPrescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      // Log the status update
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPrescriptionAction('status_update', prescriptionId, {
        newStatus: status,
        updatedBy: req.user?.username
      });

      res.json(updatedPrescription);
    } catch (error) {
      console.error('Error updating prescription status:', error);
      res.status(500).json({ message: "Failed to update prescription status" });
    }
  });

  // Update prescription
  router.patch("/prescriptions/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      const updateData = req.body;

      // Remove undefined/empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const [updatedPrescription] = await db.update(prescriptions)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(prescriptions.id, prescriptionId))
        .returning();

      if (!updatedPrescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      res.json(updatedPrescription);
    } catch (error) {
      console.error('Error updating prescription:', error);
      res.status(500).json({ message: "Failed to update prescription" });
    }
  });

  return router;
}

// Helper function to generate prescription HTML for printing
// This will be extracted from the main routes.ts file
function generatePrescriptionHTML(prescriptionResult: any): string {
  // Implementation will be moved from main routes.ts
  return `<html><body><h1>Prescription Print - Implementation Pending</h1></body></html>`;
}