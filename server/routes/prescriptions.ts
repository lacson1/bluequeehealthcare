import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";
import { insertMedicineSchema, insertPrescriptionSchema, insertMedicationReviewAssignmentSchema, medicines, medications, prescriptions, patients, users, organizations, medicationReviewAssignments } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";
import { AuditLogger } from "../audit";
// Note: generatePrescriptionHTML is now imported in PrescriptionService

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

      const searchResults = await db.select()
        .from(medicines)
        .where(sql`${medicines.name} ILIKE ${'%' + searchTerm + '%'}`)
        .limit(10)
        .orderBy(medicines.name);

      res.json(searchResults);
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
      
      // Use PrescriptionService to get prescriptions
      const { PrescriptionService } = await import("../services/PrescriptionService");
      const prescriptionsResult = await PrescriptionService.getPrescriptions(userOrgId);
      
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
      
      if (!user.id) {
        return res.status(401).json({ message: "User authentication required" });
      }

      // Use PrescriptionService to create prescription
      const { PrescriptionService } = await import("../services/PrescriptionService");
      const prescription = await PrescriptionService.createPrescription(
        patientId,
        req.body,
        user.id,
        user.organizationId
      );
      
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prescription data", errors: error.errors });
      } else if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to create prescription", error: error.message });
      } else {
        return res.status(500).json({ message: "Failed to create prescription" });
      }
    }
  });

  // Print prescription with organization details
  router.get('/prescriptions/:id/print', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Use PrescriptionService to generate prescription HTML
      const { PrescriptionService } = await import("../services/PrescriptionService");
      const html = await PrescriptionService.generatePrescriptionHTML(prescriptionId, req.user.id);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Print prescription error:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ message: error.message });
        }
      }
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

      // Use PrescriptionService to get patient prescriptions
      const { PrescriptionService } = await import("../services/PrescriptionService");
      const patientPrescriptions = await PrescriptionService.getPatientPrescriptions(patientId, userOrgId);

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
      
      const activePrescriptions = await db.select({
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
      const userOrgId = req.user?.organizationId;

      // Use PrescriptionService to update prescription
      const { PrescriptionService } = await import("../services/PrescriptionService");
      const updatedPrescription = await PrescriptionService.updatePrescription(
        prescriptionId,
        req.body,
        userOrgId
      );

      res.json(updatedPrescription);
    } catch (error) {
      console.error('Error updating prescription:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Failed to update prescription" });
    }
  });

  // =====================
  // MEDICATION REVIEW ROUTES
  // =====================

  // Create medication review assignment
  router.post("/medication-review-assignments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(403).json({ message: "Organization context required" });
      }

      // Prepare data with proper type conversion
      const requestData = {
        ...req.body,
        assignedTo: parseInt(req.body.assignedTo),
        assignedBy: req.user!.id,
        organizationId: userOrgId,
        // Only include prescriptionId if it's a valid number and exists in prescriptions table
        prescriptionId: req.body.prescriptionId && req.body.prescriptionId !== req.body.patientId ? parseInt(req.body.prescriptionId) : null
      };

      // Remove undefined assignedBy from req.body if it exists
      delete requestData.assignedBy;

      const validatedData = insertMedicationReviewAssignmentSchema.parse(requestData);

      const [assignment] = await db.insert(medicationReviewAssignments).values({
        ...validatedData,
        assignedBy: req.user!.id,
        organizationId: userOrgId,
      } as any).returning();

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating medication review assignment:", error);
      return res.status(500).json({ message: "Failed to create medication review assignment" });
    }
  });

  // Get all medication review assignments
  router.get("/medication-review-assignments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      const userId = req.user?.id;
      const status = req.query.status as string;
      const assignedTo = req.query.assignedTo as string;

      let query = db.select({
        assignment: medicationReviewAssignments,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          title: patients.title
        },
        assignedToUser: {
          id: users.id,
          username: users.username,
          role: users.role
        },
        assignedByUser: {
          id: sql<number>`assigned_by_user.id`,
          username: sql<string>`assigned_by_user.username`,
          role: sql<string>`assigned_by_user.role`
        },
        prescription: {
          id: prescriptions.id,
          medicationName: prescriptions.medicationName,
          dosage: prescriptions.dosage,
          frequency: prescriptions.frequency
        }
      })
        .from(medicationReviewAssignments)
        .leftJoin(patients, eq(medicationReviewAssignments.patientId, patients.id))
        .leftJoin(users, eq(medicationReviewAssignments.assignedTo, users.id))
        .leftJoin(sql`users assigned_by_user`, sql`medication_review_assignments.assigned_by = assigned_by_user.id`)
        .leftJoin(prescriptions, eq(medicationReviewAssignments.prescriptionId, prescriptions.id))
        .where(
          and(
            userOrgId ? eq(medicationReviewAssignments.organizationId, userOrgId) : undefined,
            status ? eq(medicationReviewAssignments.status, status) : undefined,
            assignedTo ? eq(medicationReviewAssignments.assignedTo, parseInt(assignedTo)) : undefined
          )
        )
        .orderBy(desc(medicationReviewAssignments.createdAt));

      const assignments = await query;
      return res.json(assignments);
    } catch (error) {
      console.error("Error fetching medication review assignments:", error);
      return res.status(500).json({ message: "Failed to fetch medication review assignments" });
    }
  });

  // Update medication review assignment
  router.patch("/medication-review-assignments/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const updates = req.body;

      // Handle status transitions
      if (updates.status === 'in_progress' && !updates.startedAt) {
        updates.startedAt = new Date();
      }
      if (updates.status === 'completed' && !updates.completedAt) {
        updates.completedAt = new Date();
      }

      const [updatedAssignment] = await db
        .update(medicationReviewAssignments)
        .set(updates)
        .where(
          and(
            eq(medicationReviewAssignments.id, assignmentId),
            userOrgId ? eq(medicationReviewAssignments.organizationId, userOrgId) : undefined
          )
        )
        .returning();

      if (!updatedAssignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      return res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating medication review assignment:", error);
      return res.status(500).json({ message: "Failed to update medication review assignment" });
    }
  });

  // Get patient-specific medication review assignments
  router.get("/patients/:patientId/medication-review-assignments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      const assignments = await db.select({
        assignment: medicationReviewAssignments,
        assignedToUser: {
          id: users.id,
          username: users.username,
          role: users.role
        },
        prescription: {
          id: prescriptions.id,
          medicationName: prescriptions.medicationName,
          dosage: prescriptions.dosage,
          frequency: prescriptions.frequency
        }
      })
        .from(medicationReviewAssignments)
        .leftJoin(users, eq(medicationReviewAssignments.assignedTo, users.id))
        .leftJoin(prescriptions, eq(medicationReviewAssignments.prescriptionId, prescriptions.id))
        .where(
          and(
            eq(medicationReviewAssignments.patientId, patientId),
            userOrgId ? eq(medicationReviewAssignments.organizationId, userOrgId) : undefined
          )
        )
        .orderBy(desc(medicationReviewAssignments.createdAt));

      return res.json(assignments);
    } catch (error) {
      console.error("Error fetching patient medication review assignments:", error);
      return res.status(500).json({ message: "Failed to fetch medication review assignments" });
    }
  });

  // Update medication review status
  router.patch("/medication-reviews/:reviewId", authenticateToken, requireAnyRole(['pharmacist', 'doctor', 'admin', 'nurse']), async (req: AuthRequest, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const updateData: any = { status };

      // Add timestamps based on status
      if (status === 'in_progress' && !req.body.startedAt) {
        updateData.startedAt = new Date();
      } else if (status === 'completed' && !req.body.completedAt) {
        updateData.completedAt = new Date();
      }

      const [updatedAssignment] = await db
        .update(medicationReviewAssignments)
        .set(updateData)
        .where(and(
          eq(medicationReviewAssignments.id, reviewId),
          eq(medicationReviewAssignments.organizationId, req.user!.organizationId)
        ))
        .returning();

      if (!updatedAssignment) {
        return res.status(404).json({ error: 'Medication review assignment not found' });
      }

      return res.json(updatedAssignment);
    } catch (error) {
      console.error('Error updating medication review:', error);
      return res.status(500).json({ error: 'Failed to update medication review' });
    }
  });

  // Create medication review
  router.post("/medication-reviews", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { patientId, prescriptionId, reviewType, notes, scheduledDate, priority } = req.body;

      if (!patientId || !prescriptionId) {
        return res.status(400).json({ message: "Patient ID and Prescription ID are required" });
      }

      // Find available reviewers (doctors with "Dr" title)
      const availableReviewers = await db
        .select({
          id: users.id,
          username: users.username,
          title: users.title,
          role: users.role
        })
        .from(users)
        .where(and(
          eq(users.role, 'doctor'),
          eq(users.organizationId, req.user!.organizationId),
          isNotNull(users.title)
        ));

      // Assign to a random available reviewer or the current user if they're a doctor
      let assignedReviewerId = req.user!.id;
      let assignedReviewerName = req.user!.username;

      if (availableReviewers.length > 0) {
        const randomReviewer = availableReviewers[Math.floor(Math.random() * availableReviewers.length)];
        assignedReviewerId = randomReviewer.id;
        assignedReviewerName = `${randomReviewer.title} ${randomReviewer.username}`;
      }

      // Create the medication review assignment
      const reviewData = {
        patientId,
        prescriptionId,
        assignedTo: assignedReviewerId,
        assignedBy: req.user!.id,
        organizationId: req.user!.organizationId,
        reviewType: reviewType || 'routine',
        notes: notes || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        priority: priority || 'normal',
        status: 'pending'
      };

      const [newReview] = await db.insert(medicationReviewAssignments).values(reviewData as any).returning();

      res.status(201).json({
        ...newReview,
        assignedReviewerName
      });
    } catch (error) {
      console.error('Error creating medication review:', error);
      return res.status(500).json({ error: 'Failed to create medication review' });
    }
  });

  // =====================
  // REPEAT PRESCRIPTION ROUTES
  // =====================

  // Create repeat prescription
  router.post("/patients/:id/repeat-prescriptions", authenticateToken, requireAnyRole(['doctor', 'admin', 'pharmacist']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const { prescriptionId } = req.body;

      if (!prescriptionId) {
        return res.status(400).json({ message: "Prescription ID is required" });
      }

      // Get the original prescription
      const [originalPrescription] = await db.select()
        .from(prescriptions)
        .where(and(
          eq(prescriptions.id, prescriptionId),
          eq(prescriptions.patientId, patientId),
          eq(prescriptions.organizationId, req.user!.organizationId)
        ))
        .limit(1);

      if (!originalPrescription) {
        return res.status(404).json({ message: "Original prescription not found" });
      }

      // Create a new prescription with the same details
      const repeatPrescriptionData = {
        patientId: originalPrescription.patientId,
        visitId: originalPrescription.visitId,
        medicationId: originalPrescription.medicationId,
        medicationName: originalPrescription.medicationName,
        dosage: originalPrescription.dosage,
        frequency: originalPrescription.frequency,
        duration: originalPrescription.duration,
        instructions: originalPrescription.instructions,
        prescribedBy: req.user!.username,
        organizationId: req.user!.organizationId,
        status: 'active',
        startDate: new Date(),
        endDate: originalPrescription.endDate ? new Date(originalPrescription.endDate) : null
      };

      const [newRepeatPrescription] = await db.insert(prescriptions)
        .values(repeatPrescriptionData)
        .returning();

      console.log(`🔄 REPEAT PRESCRIPTION ISSUED: #${newRepeatPrescription.id} for patient ${patientId} - ${originalPrescription.medicationName}`);

      return res.json(newRepeatPrescription);
    } catch (error) {
      console.error('Error creating repeat prescription:', error);
      return res.status(500).json({ message: "Failed to create repeat prescription" });
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