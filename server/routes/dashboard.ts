import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { storage } from "../storage";

const router = Router();

/**
 * Dashboard routes
 * Handles: dashboard statistics and metrics
 */
export function setupDashboardRoutes(): Router {
  
  // Get dashboard statistics
  router.get("/dashboard/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userOrgId = req.user.organizationId || req.user.currentOrganizationId;
      if (!userOrgId) {
        // Return empty stats instead of error for better UX
        return res.json({
          totalPatients: 0,
          todayVisits: 0,
          lowStockItems: 0,
          pendingLabs: 0
        });
      }

      const stats = await storage.getDashboardStats(userOrgId);
      return res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      // Return empty stats on error instead of failing
      return res.json({
        totalPatients: 0,
        todayVisits: 0,
        lowStockItems: 0,
        pendingLabs: 0
      });
    }
  });

  return router;
}

