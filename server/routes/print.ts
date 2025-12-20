import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { users, organizations } from "@shared/schema";

const router = Router();

/**
 * Print and document generation routes
 * Handles: organization data for printing, document templates
 */
export function setupPrintRoutes(): Router {

  // Get organization data for print documents
  router.get("/print/organization", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Always fetch fresh user data to get current organization assignment
      const [currentUser] = await db
        .select({
          id: users.id,
          username: users.username,
          organizationId: users.organizationId
        })
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      let organization;

      // Get user's current assigned organization if they have organizationId
      if (currentUser?.organizationId) {
        [organization] = await db
          .select()
          .from(organizations)
          .where(and(
            eq(organizations.id, currentUser.organizationId),
            eq(organizations.isActive, true)
          ));
      }

      // If user doesn't have an organization or it's not found, get the first active one
      if (!organization) {
        [organization] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.isActive, true))
          .orderBy(organizations.id)
          .limit(1);
      }

      if (!organization) {
        return res.status(404).json({ error: 'No active organization found' });
      }

      return res.json({
        id: organization.id,
        name: organization.name,
        type: organization.type,
        address: organization.address || '123 Healthcare Avenue, Lagos, Nigeria',
        phone: organization.phone || '+234 802 123 4567',
        email: organization.email,
        website: organization.website
      });
    } catch (error) {
      console.error('Error fetching organization for print:', error);
      return res.status(500).json({ error: 'Failed to fetch organization data' });
    }
  });

  return router;
}

export default setupPrintRoutes;

