import { Router } from "express";
import { db } from "../db";
import { users, organizations, roles, auditLogs } from "@shared/schema";
import { authenticateToken, requireAnyRole, hashPassword, type AuthRequest } from "../middleware/auth";
import { eq, inArray, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Bulk update users
router.post('/bulk-update', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const { action, data } = req.body;
    const { userIds } = data;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No users selected" });
    }

    let result;

    switch (action) {
      case 'assign-role':
        const { roleId } = data;
        if (!roleId) {
          return res.status(400).json({ message: "Role ID required" });
        }

        result = await db.update(users)
          .set({ roleId: parseInt(roleId), updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning();

        // Audit log
        await db.insert(auditLogs).values({
          userId: req.user!.id,
          action: 'BULK_ASSIGN_ROLE',
          entityType: 'user',
          entityId: req.user!.id,
          details: JSON.stringify({ userIds, roleId, count: result.length }),
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
        break;

      case 'activate':
        result = await db.update(users)
          .set({ isActive: true, updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning();

        await db.insert(auditLogs).values({
          userId: req.user!.id,
          action: 'BULK_ACTIVATE_USERS',
          entityType: 'user',
          entityId: req.user!.id,
          details: JSON.stringify({ userIds, count: result.length }),
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
        break;

      case 'deactivate':
        result = await db.update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning();

        await db.insert(auditLogs).values({
          userId: req.user!.id,
          action: 'BULK_DEACTIVATE_USERS',
          entityType: 'user',
          entityId: req.user!.id,
          details: JSON.stringify({ userIds, count: result.length }),
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
        break;

      case 'delete':
        // Soft delete - just deactivate for safety
        result = await db.update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(inArray(users.id, userIds))
          .returning();

        await db.insert(auditLogs).values({
          userId: req.user!.id,
          action: 'BULK_DELETE_USERS',
          entityType: 'user',
          entityId: req.user!.id,
          details: JSON.stringify({ userIds, count: result.length }),
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
        break;

      case 'reset-password':
        // Generate a default password and mark for reset
        const defaultPassword = await hashPassword('ChangeMe123!');
        
        result = await db.update(users)
          .set({ 
            password: defaultPassword,
            updatedAt: new Date()
          })
          .where(inArray(users.id, userIds))
          .returning();

        await db.insert(auditLogs).values({
          userId: req.user!.id,
          action: 'BULK_RESET_PASSWORD',
          entityType: 'user',
          entityId: req.user!.id,
          details: JSON.stringify({ userIds, count: result.length }),
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
        break;

      case 'send-welcome-email':
        // TODO: Implement email sending
        result = userIds;
        
        await db.insert(auditLogs).values({
          userId: req.user!.id,
          action: 'BULK_SEND_WELCOME_EMAIL',
          entityType: 'user',
          entityId: req.user!.id,
          details: JSON.stringify({ userIds, count: userIds.length }),
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || ''
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ 
      message: "Bulk operation completed successfully",
      affected: Array.isArray(result) ? result.length : userIds.length
    });
  } catch (error) {
    console.error("Error in bulk operation:", error);
    res.status(500).json({ 
      message: "Bulk operation failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bulk import users
router.post('/bulk-import', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const { users: importUsers } = req.body;

    if (!importUsers || !Array.isArray(importUsers) || importUsers.length === 0) {
      return res.status(400).json({ message: "No users to import" });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Validate and import each user
    for (const [index, userData] of importUsers.entries()) {
      try {
        // Validate required fields
        if (!userData.username || !userData.password || !userData.role) {
          results.failed++;
          results.errors.push(`Row ${index + 1}: Missing required fields (username, password, role)`);
          continue;
        }

        // Validate role is not empty or whitespace
        if (typeof userData.role !== 'string' || userData.role.trim() === '') {
          results.failed++;
          results.errors.push(`Row ${index + 1}: Role cannot be empty or whitespace`);
          continue;
        }

        // Check if username already exists
        const [existingUser] = await db.select()
          .from(users)
          .where(eq(users.username, userData.username));

        if (existingUser) {
          results.failed++;
          results.errors.push(`Row ${index + 1}: Username '${userData.username}' already exists`);
          continue;
        }

        // Hash password
        const hashedPassword = await hashPassword(userData.password);

        // Create user with trimmed role
        await db.insert(users).values({
          username: userData.username,
          password: hashedPassword,
          role: userData.role.trim(),
          email: userData.email || null,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          phone: userData.phone || null,
          organizationId: userData.organizationId ? parseInt(userData.organizationId) : req.user?.organizationId || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: req.user!.id,
      action: 'BULK_IMPORT_USERS',
      entityType: 'user',
      entityId: req.user!.id,
      details: JSON.stringify({ total: importUsers.length, success: results.success, failed: results.failed }),
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });

    res.json(results);
  } catch (error) {
    console.error("Error in bulk import:", error);
    res.status(500).json({ 
      message: "Bulk import failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export users
router.get('/export', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const idsParam = req.query.ids as string;
    const userIds = idsParam ? idsParam.split(',').map(id => parseInt(id)) : [];

    let query = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      phone: users.phone,
      organizationName: organizations.name,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt
    })
    .from(users)
    .leftJoin(organizations, eq(users.organizationId, organizations.id));

    if (userIds.length > 0) {
      query = query.where(inArray(users.id, userIds)) as any;
    }

    const usersData = await query;

    // Format for export
    const exportData = usersData.map(user => ({
      ID: user.id,
      Username: user.username,
      Email: user.email || 'N/A',
      'First Name': user.firstName || 'N/A',
      'Last Name': user.lastName || 'N/A',
      Role: user.role,
      Phone: user.phone || 'N/A',
      Organization: user.organizationName || 'N/A',
      Status: user.isActive ? 'Active' : 'Inactive',
      'Created At': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      'Last Login': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
    }));

    // Audit log
    await db.insert(auditLogs).values({
      userId: req.user!.id,
      action: 'EXPORT_USERS',
      entityType: 'user',
      entityId: req.user!.id,
      details: JSON.stringify({ count: exportData.length }),
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    });

    res.json(exportData);
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({ 
      message: "Export failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

