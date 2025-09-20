import type { Express } from "express";
import { db } from "./db";
import { organizations, users, patients as patientsTable } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticateToken, requireRole, hashPassword, type AuthRequest } from "./middleware/auth";
import { tenantMiddleware, validateUserTenant, type TenantRequest } from "./middleware/tenant";
import { AuditLogger } from "./audit";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const createStaffSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const createPatientSchema = createInsertSchema(patientsTable).omit({
  id: true,
  createdAt: true
});

export function setupOrganizationStaffRoutes(app: Express) {
  
  // Register new staff member under current organization
  app.post("/api/organization/staff", authenticateToken, tenantMiddleware, validateUserTenant, requireRole('admin'), async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const validatedData = createStaffSchema.parse(req.body);
      const { password, confirmPassword, ...staffData } = validatedData;

      // Check if username already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.username, staffData.username))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create staff member with organization assignment
      const newStaff = await db.insert(users)
        .values({
          ...staffData,
          password: hashedPassword,
          organizationId: req.tenant.id
        })
        .returning();

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction('STAFF_CREATED', newStaff[0].id, {
        organizationId: req.tenant.id,
        staffRole: newStaff[0].role,
        staffUsername: newStaff[0].username
      });

      // Return staff data without password
      const { password: _, ...staffResponse } = newStaff[0];
      res.status(201).json(staffResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Error creating staff:', error);
      res.status(500).json({ error: 'Failed to create staff member' });
    }
  });

  // Register new patient under current organization
  app.post("/api/organization/patients", authenticateToken, tenantMiddleware, validateUserTenant, async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const validatedData = createPatientSchema.parse(req.body);

      // Create patient with organization assignment
      const newPatient = await db.insert(patientsTable)
        .values({
          ...validatedData,
          organizationId: req.tenant.id
        })
        .returning();

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction('PATIENT_CREATED', newPatient[0].id, {
        organizationId: req.tenant.id,
        patientName: `${newPatient[0].firstName} ${newPatient[0].lastName}`
      });

      res.status(201).json(newPatient[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  });

  // Get organization staff (tenant-scoped)
  app.get("/api/organization/staff", authenticateToken, tenantMiddleware, validateUserTenant, async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const staff = await db.select({
        id: users.id,
        username: users.username,
        role: users.role,
        title: users.title,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        photoUrl: users.photoUrl,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.organizationId, req.tenant.id))
      .orderBy(desc(users.createdAt));

      res.json(staff);
    } catch (error) {
      console.error('Error fetching organization staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  });

  // Get organization patients (tenant-scoped)
  app.get("/api/organization/patients", authenticateToken, tenantMiddleware, validateUserTenant, async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const organizationPatients = await db.select()
        .from(patientsTable)
        .where(eq(patientsTable.organizationId, req.tenant.id))
        .orderBy(desc(patientsTable.createdAt));

      res.json(organizationPatients);
    } catch (error) {
      console.error('Error fetching organization patients:', error);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  // Bulk import staff members with CSV upload
  app.post("/api/organization/staff/bulk-import", authenticateToken, tenantMiddleware, validateUserTenant, requireRole('admin'), async (req: TenantRequest, res) => {
    try {
      if (!req.tenant) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      const { staffList } = req.body;
      
      if (!Array.isArray(staffList) || staffList.length === 0) {
        return res.status(400).json({ error: 'Staff list is required' });
      }

      const createdStaff = [];
      const errors = [];

      for (let i = 0; i < staffList.length; i++) {
        try {
          const staffData = staffList[i];
          
          // Validate each staff member
          const validatedData = createStaffSchema.parse(staffData);
          const { password, confirmPassword, ...staff } = validatedData;

          // Check for existing username
          const existingUser = await db.select()
            .from(users)
            .where(eq(users.username, staff.username))
            .limit(1);

          if (existingUser.length > 0) {
            errors.push({ row: i + 1, error: `Username '${staff.username}' already exists` });
            continue;
          }

          // Hash password and create staff
          const hashedPassword = await hashPassword(password);
          const newStaff = await db.insert(users)
            .values({
              ...staff,
              password: hashedPassword,
              organizationId: req.tenant.id
            })
            .returning();

          const { password: _, ...staffResponse } = newStaff[0];
          createdStaff.push(staffResponse);

        } catch (error) {
          errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Invalid data' });
        }
      }

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('STAFF_BULK_IMPORT', {
        organizationId: req.tenant.id,
        successCount: createdStaff.length,
        errorCount: errors.length
      });

      res.json({
        success: true,
        created: createdStaff,
        errors: errors,
        summary: {
          total: staffList.length,
          successful: createdStaff.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error('Error in bulk staff import:', error);
      res.status(500).json({ error: 'Failed to import staff members' });
    }
  });

  // Transfer staff member to different organization (super admin only)
  app.patch("/api/staff/:staffId/transfer", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { staffId } = req.params;
      const { targetOrganizationId } = req.body;

      if (!targetOrganizationId) {
        return res.status(400).json({ error: 'Target organization ID is required' });
      }

      // Verify target organization exists
      const targetOrg = await db.select()
        .from(organizations)
        .where(eq(organizations.id, targetOrganizationId))
        .limit(1);

      if (!targetOrg.length) {
        return res.status(404).json({ error: 'Target organization not found' });
      }

      // Update staff organization
      const updatedStaff = await db.update(users)
        .set({ organizationId: targetOrganizationId })
        .where(eq(users.id, parseInt(staffId)))
        .returning();

      if (!updatedStaff.length) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction('STAFF_TRANSFERRED', parseInt(staffId), {
        targetOrganizationId,
        targetOrganizationName: targetOrg[0].name
      });

      res.json({ 
        message: 'Staff member transferred successfully',
        staff: updatedStaff[0] 
      });
    } catch (error) {
      console.error('Error transferring staff:', error);
      res.status(500).json({ error: 'Failed to transfer staff member' });
    }
  });
}