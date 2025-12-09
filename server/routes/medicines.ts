import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";
import { insertMedicineSchema, medicines } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, and, lte, ilike, sql } from "drizzle-orm";

const router = Router();

/**
 * Medicine/Inventory management routes
 * Handles: medicine CRUD, inventory management, low stock alerts, search
 */
export function setupMedicinesRoutes(): Router {
  
  // Create medicine (pharmacist and admin only)
  router.post("/medicines", authenticateToken, requireAnyRole(['pharmacist', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const medicineData = insertMedicineSchema.parse({
        ...req.body,
        organizationId: userOrgId
      });
      const medicine = await storage.createMedicine(medicineData);
      res.json(medicine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid medicine data", errors: error.errors });
      } else {
        console.error('Error creating medicine:', error);
        res.status(500).json({ message: "Failed to create medicine" });
      }
    }
  });

  // Get all medicines
  router.get("/medicines", authenticateToken, requireAnyRole(['pharmacist', 'doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const allMedicines = await storage.getMedicines();
      // Filter by organization
      const medicines = allMedicines.filter(m => m.organizationId === userOrgId);
      res.json(medicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });

  // Get medicine by ID
  router.get("/medicines/:id", authenticateToken, requireAnyRole(['pharmacist', 'doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      const [medicine] = await db.select()
        .from(medicines)
        .where(and(
          eq(medicines.id, medicineId),
          userOrgId ? eq(medicines.organizationId, userOrgId) : undefined
        ))
        .limit(1);

      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      res.json(medicine);
    } catch (error) {
      console.error('Error fetching medicine:', error);
      res.status(500).json({ message: "Failed to fetch medicine" });
    }
  });

  // Update medicine
  router.patch("/medicines/:id", authenticateToken, requireAnyRole(['pharmacist', 'admin']), async (req: AuthRequest, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const updateData = req.body;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const [updatedMedicine] = await db.update(medicines)
        .set(updateData)
        .where(and(
          eq(medicines.id, medicineId),
          eq(medicines.organizationId, userOrgId)
        ))
        .returning();

      if (!updatedMedicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      res.json(updatedMedicine);
    } catch (error) {
      console.error('Error updating medicine:', error);
      res.status(500).json({ message: "Failed to update medicine" });
    }
  });

  // Update medicine quantity (simple version)
  router.patch("/medicines/:id/quantity", authenticateToken, requireAnyRole(['pharmacist', 'admin']), async (req: AuthRequest, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      const { quantity } = req.body;
      const userOrgId = req.user?.organizationId;

      if (!quantity || quantity < 0) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
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
  router.post("/medicines/reorder", authenticateToken, requireAnyRole(['pharmacist', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { medicineId, quantity, priority, notes } = req.body;

      if (!medicineId || !quantity || !priority) {
        return res.status(400).json({ error: "Medicine ID, quantity, and priority are required" });
      }

      // Get medicine details
      const [medicine] = await db.select()
        .from(medicines)
        .where(eq(medicines.id, medicineId))
        .limit(1);

      if (!medicine) {
        return res.status(404).json({ error: "Medicine not found" });
      }

      // Create reorder request
      const reorderRequest = {
        medicineId,
        medicineName: medicine.name,
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
  router.get("/medicines/low-stock", authenticateToken, requireAnyRole(['pharmacist', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Organization-filtered low stock medicines
      const lowStockMedicines = await db.select()
        .from(medicines)
        .where(
          and(
            eq(medicines.organizationId, userOrgId),
            lte(medicines.quantity, sql`${medicines.lowStockThreshold}`)
          )
        );
      
      // Send notifications for critically low stock items
      for (const medicine of lowStockMedicines) {
        if (medicine.quantity === 0) {
          console.log(`Medication out of stock: ${medicine.name}`);
        } else if (medicine.quantity <= medicine.lowStockThreshold) {
          console.log(`Low stock warning: ${medicine.name} (${medicine.quantity} remaining)`);
        }
      }
      
      res.json(lowStockMedicines);
    } catch (error) {
      console.error('Error fetching low stock medicines:', error);
      res.status(500).json({ message: "Failed to fetch low stock medicines" });
    }
  });

  // Search medicines for autocomplete
  router.get("/medicines/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      const search = req.query.search as string || "";
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      let whereClause = eq(medicines.organizationId, userOrgId);
      
      if (search) {
        whereClause = and(
          eq(medicines.organizationId, userOrgId),
          ilike(medicines.name, `%${search}%`)
        ) as any;
      }
      
      const searchResults = await db.select()
        .from(medicines)
        .where(whereClause)
        .limit(20)
        .orderBy(medicines.name);
        
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching medicines:", error);
      res.status(500).json({ message: "Failed to search medicines" });
    }
  });

  return router;
}

