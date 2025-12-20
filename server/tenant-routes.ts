import type { Express } from "express";
import { db, pool } from "./db";
import { organizations, users, patients, visits, labResults, medicines, prescriptions } from "@shared/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { authenticateToken, requireRole, type AuthRequest } from "./middleware/auth";
import { tenantMiddleware, validateUserTenant, getTenantScope, addTenantContext, type TenantRequest } from "./middleware/tenant";
import { AuditLogger, AuditActions } from "./audit";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom schema that matches frontend form data
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.enum(["clinic", "hospital", "health_center", "pharmacy", "laboratory"]).optional(),
  email: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().email("Invalid email address").optional()
  ),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url("Invalid website URL").optional()
  ),
  logoUrl: z.string().optional(),
  themeColor: z.string().optional(),
  letterheadConfig: z.any().optional(),
  isActive: z.boolean().optional(),
});

export function setupTenantRoutes(app: Express) {
  
  // Get all organizations (super admin only)
  app.get("/api/organizations", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
      res.json(orgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  });

  // Get organizations for patient assignment (accessible to all authenticated users)
  app.get("/api/organizations-dropdown", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Use raw SQL to avoid any potential Drizzle query conflicts
      const result = await pool.query('SELECT id, name, type FROM organizations ORDER BY name');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching organization list:', error);
      res.status(500).json({ error: 'Failed to fetch organization list' });
    }
  });

  // Get current organization details
  app.get("/api/organization", authenticateToken, tenantMiddleware, async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }
      
      // Get organization statistics
      const [patientCount, userCount, visitCount] = await Promise.all([
        db.select({ count: count() }).from(patients).where(eq(patients.organizationId, req.tenant.id)),
        db.select({ count: count() }).from(users).where(eq(users.organizationId, req.tenant.id)),
        db.select({ count: count() }).from(visits).where(eq(visits.organizationId, req.tenant.id))
      ]);

      const organizationWithStats = {
        ...req.tenant,
        stats: {
          totalPatients: patientCount[0]?.count || 0,
          totalUsers: userCount[0]?.count || 0,
          totalVisits: visitCount[0]?.count || 0
        }
      };

      res.json(organizationWithStats);
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({ error: 'Failed to fetch organization details' });
    }
  });

  // Create new organization
  app.post("/api/organizations", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      console.log('=== ORGANIZATION CREATION REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Validate and parse the request data
      let validatedData;
      try {
        validatedData = createOrganizationSchema.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error('Validation errors:', validationError.errors);
          return res.status(400).json({ 
            error: 'Validation failed', 
            details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          });
        }
        throw validationError;
      }
      
      // Prepare data for insertion with defaults
      const insertData = {
        name: validatedData.name.trim(),
        type: validatedData.type || 'clinic',
        email: validatedData.email && validatedData.email.trim() !== '' ? validatedData.email.trim() : null,
        phone: validatedData.phone && validatedData.phone.trim() !== '' ? validatedData.phone.trim() : null,
        address: validatedData.address && validatedData.address.trim() !== '' ? validatedData.address.trim() : null,
        website: validatedData.website && validatedData.website.trim() !== '' ? validatedData.website.trim() : null,
        logoUrl: validatedData.logoUrl && validatedData.logoUrl.trim() !== '' ? validatedData.logoUrl.trim() : null,
        themeColor: validatedData.themeColor || '#3B82F6',
        letterheadConfig: validatedData.letterheadConfig || null,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
      };
      
      console.log('Insert data:', JSON.stringify(insertData, null, 2));
      
      // Check if organization with same name already exists
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.name, insertData.name))
        .limit(1);
      
      if (existingOrg.length > 0) {
        return res.status(400).json({ 
          error: 'An organization with this name already exists',
          message: 'An organization with this name already exists'
        });
      }
      
      // Check if organization with same email already exists (if email provided)
      if (insertData.email) {
        const existingOrgByEmail = await db
          .select()
          .from(organizations)
          .where(eq(organizations.email, insertData.email))
          .limit(1);
        
        if (existingOrgByEmail.length > 0) {
          return res.status(400).json({ 
            error: 'An organization with this email already exists',
            message: 'An organization with this email already exists'
          });
        }
      }
      
      const newOrg = await db.insert(organizations)
        .values(insertData)
        .returning();
      
      console.log('Organization created successfully:', newOrg[0].id);

      // Create audit log (with error handling)
      try {
        const auditLogger = new AuditLogger(req);
        await auditLogger.logSystemAction('ORGANIZATION_CREATED', {
          organizationId: newOrg[0].id,
          organizationName: newOrg[0].name
        });
      } catch (auditError) {
        console.error('Failed to create audit log (non-critical):', auditError);
        // Don't fail the request if audit logging fails
      }

      res.status(201).json(newOrg[0]);
    } catch (error) {
      console.error('Error creating organization:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Provide more detailed error message
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          message: 'Invalid organization data provided'
        });
      }
      
      // Check for database constraint errors
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ 
            error: 'Duplicate organization',
            message: 'An organization with this name or email already exists'
          });
        }
        if (error.message.includes('foreign key') || error.message.includes('constraint')) {
          return res.status(400).json({ 
            error: 'Database constraint violation',
            message: error.message
          });
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to create organization',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  });

  // Update organization
  app.put("/api/organization", authenticateToken, tenantMiddleware, validateUserTenant, requireRole('admin'), async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const updateData = req.body;
      const allowedFields = ['name', 'type', 'logoUrl', 'themeColor', 'address', 'phone', 'email', 'website'];
      const filteredData: any = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      filteredData.updatedAt = new Date();

      await db.update(organizations)
        .set(filteredData)
        .where(eq(organizations.id, req.tenant.id));

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('ORGANIZATION_UPDATED', {
        organizationId: req.tenant.id,
        updatedFields: Object.keys(filteredData)
      });

      res.json({ message: 'Organization updated successfully' });
    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({ error: 'Failed to update organization' });
    }
  });

  // Get organization users (tenant-scoped)
  app.get("/api/organization/users", authenticateToken, tenantMiddleware, validateUserTenant, async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const orgUsers = await db.select({
        id: users.id,
        username: users.username,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.organizationId, req.tenant.id))
      .orderBy(desc(users.createdAt));

      res.json(orgUsers);
    } catch (error) {
      console.error('Error fetching organization users:', error);
      res.status(500).json({ error: 'Failed to fetch organization users' });
    }
  });

  // Tenant-scoped dashboard stats
  app.get("/api/tenant/dashboard", authenticateToken, tenantMiddleware, validateUserTenant, async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const tenantScope = getTenantScope(req.tenant.id);

      // Get comprehensive tenant-specific statistics
      const [
        totalPatients,
        totalUsers,
        totalVisits,
        todayVisits,
        pendingLabResults,
        lowStockMedicines,
        recentPatients
      ] = await Promise.all([
        db.select({ count: count() }).from(patients).where(eq(patients.organizationId, req.tenant.id)),
        db.select({ count: count() }).from(users).where(eq(users.organizationId, req.tenant.id)),
        db.select({ count: count() }).from(visits).where(eq(visits.organizationId, req.tenant.id)),
        db.select({ count: count() }).from(visits).where(and(
          eq(visits.organizationId, req.tenant.id),
          eq(visits.visitDate, new Date().toISOString().split('T')[0])
        )),
        db.select({ count: count() }).from(labResults).where(and(
          eq(labResults.organizationId, req.tenant.id),
          eq(labResults.status, 'pending')
        )),
        db.select({ count: count() }).from(medicines).where(and(
          eq(medicines.organizationId, req.tenant.id),
          // Add condition for low stock
        )),
        db.select({
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          phone: patients.phone,
          createdAt: patients.createdAt
        })
        .from(patients)
        .where(eq(patients.organizationId, req.tenant.id))
        .orderBy(desc(patients.createdAt))
        .limit(5)
      ]);

      const stats = {
        organization: req.tenant,
        totalPatients: totalPatients[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0,
        totalVisits: totalVisits[0]?.count || 0,
        todayVisits: todayVisits[0]?.count || 0,
        pendingLabResults: pendingLabResults[0]?.count || 0,
        lowStockMedicines: lowStockMedicines[0]?.count || 0,
        recentPatients: recentPatients || []
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching tenant dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  });

  // Switch organization context (for users with access to multiple organizations)
  app.post("/api/switch-organization", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { organizationId } = req.body;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Verify user has access to this organization
      const userAccess = await db.select()
        .from(users)
        .where(and(
          eq(users.id, req.user!.id),
          eq(users.organizationId, organizationId)
        ))
        .limit(1);

      if (!userAccess.length) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }

      // Get organization details
      const org = await db.select()
        .from(organizations)
        .where(and(
          eq(organizations.id, organizationId),
          eq(organizations.isActive, true)
        ))
        .limit(1);

      if (!org.length) {
        return res.status(404).json({ error: 'Organization not found or inactive' });
      }

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('ORGANIZATION_SWITCHED', {
        fromOrganizationId: req.user!.organizationId,
        toOrganizationId: organizationId
      });

      res.json({
        message: 'Organization context switched successfully',
        organization: org[0]
      });
    } catch (error) {
      console.error('Error switching organization:', error);
      res.status(500).json({ error: 'Failed to switch organization' });
    }
  });

  // Deactivate organization (soft delete)
  app.patch("/api/organizations/:id/deactivate", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      
      await db.update(organizations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(organizations.id, organizationId));

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('ORGANIZATION_DEACTIVATED', {
        organizationId
      });

      res.json({ message: 'Organization deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating organization:', error);
      res.status(500).json({ error: 'Failed to deactivate organization' });
    }
  });

  // Reactivate organization
  app.patch("/api/organizations/:id/activate", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      
      await db.update(organizations)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(organizations.id, organizationId));

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('ORGANIZATION_ACTIVATED', {
        organizationId
      });

      res.json({ message: 'Organization activated successfully' });
    } catch (error) {
      console.error('Error activating organization:', error);
      res.status(500).json({ error: 'Failed to activate organization' });
    }
  });
}