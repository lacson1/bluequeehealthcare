import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";
import { insertReferralSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

/**
 * Referral management routes
 * Handles: referral CRUD, status updates, filtering
 */
export function setupReferralRoutes(): Router {
  
  // Create referral
  router.post("/referrals", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const referralData = insertReferralSchema.parse({
        ...req.body,
        organizationId: req.user.organizationId,
        fromUserId: req.user.id
      });
      const referral = await storage.createReferral(referralData);
      res.json(referral);
    } catch (error) {
      console.error('Error creating referral:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid referral data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create referral" });
      }
    }
  });

  // Get referrals with filters
  router.get("/referrals", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const { toRole, fromUserId, status, patientId } = req.query;
      const filters: any = {
        organizationId: req.user.organizationId
      };
      
      if (toRole) filters.toRole = toRole as string;
      if (fromUserId) filters.fromUserId = parseInt(fromUserId as string);
      if (status) filters.status = status as string;
      if (patientId) filters.patientId = parseInt(patientId as string);

      const referrals = await storage.getReferrals(filters);
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Get referral by ID
  router.get("/referrals/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const referralId = parseInt(req.params.id);
      const referral = await storage.getReferralById(referralId);
      
      if (!referral) {
        return res.status(404).json({ message: "Referral not found" });
      }

      // Verify organization access
      if (req.user?.organizationId && referral.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(referral);
    } catch (error) {
      console.error('Error fetching referral:', error);
      res.status(500).json({ message: "Failed to fetch referral" });
    }
  });

  // Update referral status
  router.patch("/referrals/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;

      if (status && !['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be 'pending', 'accepted', 'rejected', or 'completed'" 
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const referral = await storage.updateReferral(id, updateData);
      
      if (!referral) {
        return res.status(404).json({ message: "Referral not found" });
      }

      res.json(referral);
    } catch (error) {
      console.error('Error updating referral:', error);
      res.status(500).json({ message: "Failed to update referral" });
    }
  });

  // Delete referral
  router.delete("/referrals/:id", authenticateToken, requireAnyRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteReferral(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Referral not found" });
      }

      res.json({ message: "Referral deleted successfully" });
    } catch (error) {
      console.error('Error deleting referral:', error);
      res.status(500).json({ message: "Failed to delete referral" });
    }
  });

  return router;
}

