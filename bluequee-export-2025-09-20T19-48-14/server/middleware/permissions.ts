import { type Response, type NextFunction } from 'express';
import { db } from '../db';
import { roles, permissions, rolePermissions, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { AuthRequest } from './auth';

// Middleware to check if user has specific permission
export const checkPermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // For backward compatibility, check if user has admin role
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        return next();
      }

      // If user has roleId, check RBAC permissions
      if (req.user.roleId) {
        const userPermissions = await db
          .select({ name: permissions.name })
          .from(rolePermissions)
          .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, req.user.roleId));

        const permissionNames = userPermissions.map(p => p.name);
        
        if (permissionNames.includes(permissionName)) {
          return next();
        }
      }

      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Permission check failed' });
    }
  };
};

// Get all permissions for a user's role
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const user = await db
      .select({ roleId: users.roleId, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) return [];

    // For backward compatibility with admin roles
    if (user[0].role === 'admin' || user[0].role === 'superadmin') {
      const allPermissions = await db.select({ name: permissions.name }).from(permissions);
      return allPermissions.map(p => p.name);
    }

    // Get permissions through RBAC system
    if (user[0].roleId) {
      const userPermissions = await db
        .select({ name: permissions.name })
        .from(rolePermissions)
        .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, user[0].roleId));

      return userPermissions.map(p => p.name);
    }

    return [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}