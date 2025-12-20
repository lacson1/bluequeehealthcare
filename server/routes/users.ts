import { Router } from "express";
import { db } from "../db";
import { users, roles, auditLogs, insertAuditLogSchema } from "@shared/schema";
import { authenticateToken, requireRole, requireAnyRole, hashPassword, type AuthRequest } from "../middleware/auth";
import { eq, or, sql } from "drizzle-orm";
import { AuditLogger, AuditActions } from "../audit";
import { z } from "zod";
import { parseAndType } from "../utils/parse-and-type";

const router = Router();

/**
 * User Management Routes
 * Handles: user CRUD, role management, user queries
 */
export function setupUsersRoutes(): Router {
  
  // IMPORTANT: Specific routes must come before parameterized routes like /api/users/:id
  
  // Find users without roles (Admin only) - must be before /api/users/:id
  router.get('/users/without-role', authenticateToken, requireAnyRole(['admin', 'superadmin', 'super_admin']), async (req: AuthRequest, res) => {
    try {
      // Find users with null, empty, or undefined roles
      const usersWithoutRole = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          organizationId: users.organizationId,
          createdAt: users.createdAt
        })
        .from(users)
        .where(
          or(
            sql`${users.role} IS NULL`,
            sql`${users.role} = ''`,
            sql`TRIM(${users.role}) = ''`
          )
        );

      return res.json({
        count: usersWithoutRole.length,
        users: usersWithoutRole
      });
    } catch (error) {
      console.error("Error finding users without role:", error);
      return res.status(500).json({ message: "Failed to find users without role" });
    }
  });

  // Fix users without roles by assigning a default role (Admin only) - must be before /api/users/:id
  router.post('/users/fix-missing-roles', authenticateToken, requireAnyRole(['admin', 'superadmin', 'super_admin']), async (req: AuthRequest, res) => {
    try {
      const { defaultRole = 'staff' } = req.body;

      // Find users without roles
      const usersWithoutRole = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(
          or(
            sql`${users.role} IS NULL`,
            sql`${users.role} = ''`,
            sql`TRIM(${users.role}) = ''`
          )
        );

      if (usersWithoutRole.length === 0) {
        return res.json({
          message: "No users without roles found",
          fixed: 0
        });
      }

      // Update users with default role
      const updated = await db
        .update(users)
        .set({
          role: defaultRole
        })
        .where(
          or(
            sql`${users.role} IS NULL`,
            sql`${users.role} = ''`,
            sql`TRIM(${users.role}) = ''`
          )
        )
        .returning({ id: users.id, username: users.username, role: users.role });

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('FIX_MISSING_ROLES', {
        fixedCount: updated.length,
        defaultRole: defaultRole,
        userIds: updated.map(u => u.id)
      });

      return res.json({
        message: `Fixed ${updated.length} user(s) by assigning role '${defaultRole}'`,
        fixed: updated.length,
        users: updated
      });
    } catch (error) {
      console.error("Error fixing users without role:", error);
      return res.status(500).json({ message: "Failed to fix users without role" });
    }
  });

  // Get all users (Admin only)
  router.get('/users', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const allUsers = await db.select().from(users);
      // Don't return passwords
      const usersWithoutPasswords = allUsers.map(user => ({ ...user, password: undefined }));
      return res.json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user
  router.post("/users", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { username, password, email, phone, role, roleId, organizationId, firstName, lastName, title } = req.body;

      if (!username || !password || !organizationId) {
        return res.status(400).json({ error: 'Username, password, and organization are required' });
      }

      // Handle role mapping - frontend sends roleId, backend expects role string
      let userRole = role;
      if (!userRole && roleId) {
        const roleMap: Record<string, string> = {
          '1': 'admin',
          '2': 'doctor',
          '3': 'nurse',
          '4': 'pharmacist',
          '5': 'receptionist',
          '6': 'lab_technician',
          '7': 'physiotherapist'
        };
        userRole = roleMap[roleId.toString()];
      }

      // Validate role is provided and not empty/whitespace
      if (!userRole || typeof userRole !== 'string' || userRole.trim() === '') {
        return res.status(400).json({ error: 'Valid role is required and cannot be empty' });
      }

      // Ensure role is trimmed
      userRole = userRole.trim();

      // Role-based permission check for user creation
      const currentUser = req.user;
      const targetOrgId = parseInt(organizationId);

      // Check permissions based on user role
      if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin') {
        // Admins can create users in any organization
      } else if (currentUser?.role === 'doctor' && currentUser?.organizationId === targetOrgId) {
        // Doctors can create users in their own organization
        if (!['nurse', 'pharmacist', 'receptionist', 'lab_technician'].includes(userRole)) {
          return res.status(403).json({ error: 'Insufficient permissions to create users with this role' });
        }
      } else {
        return res.status(403).json({ error: 'Insufficient permissions to create users' });
      }

      const hashedPassword = await hashPassword(password);

      const userData = {
        username,
        password: hashedPassword,
        email: email || null,
        phone: phone || null,
        role: userRole.trim(),
        firstName: firstName || null,
        lastName: lastName || null,
        title: title || null,
        organizationId: targetOrgId,
        isActive: true
      };

      const [newUser] = await db.insert(users).values(userData).returning();

      if (!newUser) {
        return res.status(500).json({ error: 'Failed to create user' });
      }

      // SECURITY: Double-check user was created with a role
      if (!newUser.role || newUser.role.trim() === '') {
        console.error(`[POST /api/users] CRITICAL: User ${newUser.id} created without role! Attempting to fix...`);
        // Attempt to fix by assigning default role
        const [fixedUser] = await db.update(users)
          .set({ role: 'staff' })
          .where(eq(users.id, newUser.id))
          .returning();

        if (!fixedUser || !fixedUser.role) {
          return res.status(500).json({
            error: 'Failed to create user with valid role. Please contact administrator.'
          });
        }

        // Update user object for response
        Object.assign(newUser, fixedUser);
      }

      // Create audit log
      try {
        const auditLogger = new AuditLogger(req);
        await auditLogger.logUserAction(AuditActions.USER_CREATED, newUser.id, {
          newUserRole: newUser.role,
          newUserUsername: newUser.username,
          organizationId: newUser.organizationId
        });
      } catch (auditError) {
        console.error(`[POST /api/users] Failed to create audit log:`, auditError);
        // Don't fail the request if audit logging fails
      }

      return res.json({ ...newUser, password: undefined }); // Don't return password
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else if (error instanceof Error) {
        // Check for specific user creation errors
        if (error.message === 'Username already exists') {
          return res.status(400).json({ message: "Username already exists. Please choose a different username." });
        } else if (error.message === 'Email already exists') {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        } else if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
          // Parse the specific constraint that failed
          if (error.message.includes('users_username_unique') || error.message.includes('username')) {
            const usernameMatch = error.message.match(/Key \(username\)=\(([^)]+)\)/);
            const username = usernameMatch ? usernameMatch[1] : 'specified username';
            return res.status(400).json({
              message: `Username "${username}" already exists. Please choose a different username.`
            });
          } else if (error.message.includes('users_email_unique') || error.message.includes('email')) {
            return res.status(400).json({
              message: "Email address already exists. Please use a different email address."
            });
          } else {
            return res.status(400).json({ message: "Username or email already exists" });
          }
        } else {
          return res.status(500).json({ message: "Failed to create user", error: error.message });
        }
      } else {
        return res.status(500).json({ message: "Failed to create user", error: String(error) });
      }
    }
  });

  // Update user (Admin only)
  router.patch('/users/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`[PATCH /api/users/${userId}] Request received from user ${req.user?.id}`);

      // SECURITY: Prevent users from changing their own role
      if (userId === req.user?.id && (req.body.role !== undefined || req.body.roleId !== undefined)) {
        console.warn(`[PATCH /api/users/${userId}] SECURITY: User ${req.user.id} attempted to change their own role`);
        return res.status(403).json({
          message: "You cannot change your own role. Please contact another administrator."
        });
      }

      // Get current user data before update to track role changes
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const {
        username, password, role, roleId, email, phone, photoUrl,
        organizationId, firstName, lastName, title
      } = req.body;

      const updateData: Record<string, any> = {};

      // Handle basic fields
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (title !== undefined) updateData.title = title === 'none' || title === '' ? null : title;

      // Include organizationId if provided
      if (organizationId !== undefined) {
        updateData.organizationId = parseInt(organizationId);
      }

      // Track role changes for audit logging
      const roleChanged = (roleId !== undefined && roleId !== null && roleId !== '') ||
        (role !== undefined && role !== null && role !== '');
      const oldRole = currentUser.role;
      const oldRoleId = currentUser.roleId;

      // Handle roleId (RBAC) - prefer over legacy role
      // IMPORTANT: Never allow clearing the role - users must always have a role
      if (roleId !== undefined && roleId !== null && roleId !== '') {
        const parsedRoleId = parseInt(roleId);
        if (!isNaN(parsedRoleId)) {
          // Verify the role exists
          const [roleRecord] = await db.select().from(roles).where(eq(roles.id, parsedRoleId)).limit(1);
          if (roleRecord) {
            updateData.roleId = parsedRoleId;
            // Also set legacy role for backward compatibility
            updateData.role = roleRecord.name.toLowerCase();
          } else {
            return res.status(400).json({ message: `Role with ID ${parsedRoleId} not found` });
          }
        } else {
          return res.status(400).json({ message: 'Invalid role ID format' });
        }
      } else if (role !== undefined && role !== null && role !== '') {
        // Validate role is not empty string or whitespace
        const trimmedRole = role.trim();
        if (trimmedRole === '') {
          return res.status(400).json({ message: 'Role cannot be empty or whitespace' });
        }
        // Fallback to legacy role if roleId not provided
        updateData.role = trimmedRole;
      }

      // Hash password if provided
      if (password && password.trim()) {
        updateData.password = await hashPassword(password);
      }

      // Remove undefined values (except for title which can be null)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined && key !== 'title') {
          delete updateData[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      // SECURITY: Prevent removing role from user
      if (updateData.role !== undefined) {
        if (!updateData.role || typeof updateData.role !== 'string' || updateData.role.trim() === '') {
          return res.status(400).json({
            message: "Role cannot be empty. User must have a valid role assigned."
          });
        }
        // Ensure role is trimmed
        updateData.role = updateData.role.trim();
      }

      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // CRITICAL: Ensure user still has a role after update
      if (!updatedUser.role || updatedUser.role.trim() === '') {
        console.error(`[PATCH /api/users/${userId}] CRITICAL: User ended up without a role after update! Attempting to fix...`);
        // Attempt to fix by assigning default role
        const [fixedUser] = await db.update(users)
          .set({ role: 'staff' })
          .where(eq(users.id, userId))
          .returning();

        if (!fixedUser || !fixedUser.role) {
          return res.status(500).json({
            message: "Update failed: User must have a role. Failed to assign default role. Please contact administrator.",
            error: "ROLE_ASSIGNMENT_FAILED"
          });
        }

        return res.status(500).json({
          message: "Update failed: User must have a role. Default role 'staff' has been assigned.",
          user: fixedUser,
          warning: "ROLE_AUTO_ASSIGNED"
        });
      }

      // Create audit log with enhanced role change tracking
      try {
        const auditLogger = new AuditLogger(req);
        const auditDetails: any = {
          updatedFields: Object.keys(updateData),
          newRole: updateData.role || updatedUser.role,
          newRoleId: updateData.roleId || updatedUser.roleId
        };

        // If role was changed, add detailed role change information
        if (roleChanged) {
          auditDetails.roleChanged = true;
          auditDetails.oldRole = oldRole;
          auditDetails.oldRoleId = oldRoleId;
          auditDetails.newRole = updateData.role || updatedUser.role;
          auditDetails.newRoleId = updateData.roleId || updatedUser.roleId;

          // Create a separate audit log entry specifically for role changes
          const auditLogData = parseAndType(insertAuditLogSchema, {
            userId: req.user!.id,
            action: 'CHANGE_USER_ROLE',
            entityType: 'user',
            entityId: userId,
            details: JSON.stringify({
              targetUserId: userId,
              targetUsername: updatedUser.username,
              oldRole,
              oldRoleId,
              newRole: auditDetails.newRole,
              newRoleId: auditDetails.newRoleId,
              changedBy: req.user!.id,
              changedByUsername: req.user!.username
            }),
            ipAddress: req.ip || '',
            userAgent: req.headers['user-agent'] || ''
          }) as any;
          await db.insert(auditLogs).values(auditLogData);
        }

        await auditLogger.logUserAction(AuditActions.USER_UPDATED, userId, auditDetails);
      } catch (auditError) {
        console.error(`[PATCH /api/users/${userId}] Failed to create audit log:`, auditError);
        // Don't fail the request if audit logging fails
      }

      // If the updated user is the current user, send a signal to refresh their session
      const response: any = { ...updatedUser, password: undefined };
      if (req.user?.id === userId) {
        response.sessionRefreshRequired = true;
      }

      return res.json(response);
    } catch (error: any) {
      console.error(`[PATCH /api/users/${req.params.id}] Error:`, error);
      return res.status(500).json({ message: error.message || "Failed to update user" });
    }
  });

  // Delete user (Admin only)
  router.delete('/users/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent admin from deleting themselves
      if (req.user?.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction(AuditActions.USER_UPDATED, userId, {
        action: "deleted",
        deletedUserRole: deletedUser.role,
        deletedUsername: deletedUser.username
      });

      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get doctors for appointment scheduling
  router.get('/users/doctors', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const doctors = await db.select().from(users).where(eq(users.role, 'doctor'));
      return res.json(doctors);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // Get all healthcare staff for appointment scheduling
  router.get('/users/healthcare-staff', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { inArray } = await import("drizzle-orm");
      const healthcareRoles = ['doctor', 'nurse', 'physiotherapist', 'pharmacist'];
      const staff = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        title: users.title,
        role: users.role
      }).from(users).where(inArray(users.role, healthcareRoles));

      return res.json(staff);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch healthcare staff" });
    }
  });

  // Get all staff members (for consultation history)
  router.get('/staff', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { inArray, and } = await import("drizzle-orm");
      const userOrgId = req.user?.organizationId;
      const healthcareRoles = ['doctor', 'nurse', 'physiotherapist', 'pharmacist', 'admin'];

      const staff = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        first_name: users.firstName, // Alias for compatibility
        last_name: users.lastName,   // Alias for compatibility
        title: users.title,
        role: users.role,
        organizationId: users.organizationId
      }).from(users).where(
        and(
          inArray(users.role, healthcareRoles),
          userOrgId ? eq(users.organizationId, userOrgId) : undefined
        )
      );

      return res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      return res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  // User Management API Endpoints
  router.get('/users/management', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { organizations } = await import("@shared/schema");
      const userRole = req.user?.role;
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = userRole === 'superadmin' || userRole === 'super_admin';
      
      // Get optional organization filter from query params
      const filterOrgId = req.query.organizationId ? parseInt(req.query.organizationId as string) : null;
      
      // For superadmins: show all users or filter by specified org
      // For other users: only show users from their organization
      let managementUsers;
      if (isSuperAdmin) {
        if (filterOrgId) {
          // Superadmin filtering by specific organization
          managementUsers = await db
            .select()
            .from(users)
            .where(eq(users.organizationId, filterOrgId))
            .orderBy(users.createdAt);
        } else {
          // Superadmin - show all users
          managementUsers = await db
            .select()
            .from(users)
            .orderBy(users.createdAt);
        }
      } else {
        // Regular users - only their organization
        if (!userOrgId) {
          return res.status(403).json({ message: "Organization access required" });
        }
        managementUsers = await db
          .select()
          .from(users)
          .where(eq(users.organizationId, userOrgId))
          .orderBy(users.createdAt);
      }

      // Add role and organization names
      const enrichedUsers = await Promise.all(
        managementUsers.map(async (user) => {
          let roleName = null;
          let organizationName = null;

          if (user.roleId) {
            const [role] = await db.select().from(roles).where(eq(roles.id, user.roleId));
            roleName = role?.name;
          }

          if (user.organizationId) {
            const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId));
            organizationName = org?.name;
          }

          return {
            ...user,
            password: undefined, // Don't return password
            roleName,
            organizationName
          };
        })
      );

      return res.json(enrichedUsers);
    } catch (error) {
      console.error("Error fetching management users:", error);
      return res.status(500).json({ message: "Failed to fetch management users" });
    }
  });

  return router;
}

