import { Router, Response } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { users, organizations, auditLogs } from '@shared/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { sendSuccess, sendError, ApiError, asyncHandler } from '../lib/api-response';

const router = Router();

/**
 * Helper function to get organization details
 */
async function getOrganizationDetails(orgId: number) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return org;
}

/**
 * Helper to log audit events
 */
async function logAuditEvent(
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  details?: any
) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId,
      details: JSON.stringify(details),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Validation schema for profile update
const updateProfileSchema = z.object({
  title: z.string().max(10).optional().nullable(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
});

// Validation schema for settings
const updateSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    appointments: z.boolean().optional(),
    labResults: z.boolean().optional(),
    emergencies: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'staff', 'private']).optional(),
    showOnlineStatus: z.boolean().optional(),
    allowDirectMessages: z.boolean().optional(),
  }).optional(),
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  security: z.object({
    twoFactorEnabled: z.boolean().optional(),
    sessionTimeout: z.number().min(5).max(120).optional(),
    passwordExpiry: z.number().min(30).max(365).optional(),
  }).optional(),
}).partial();

/**
 * GET /api/profile
 * Get current authenticated user's profile
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const userId = req.user.id;

  // Handle superadmin fallback user (id: 999) - doesn't exist in database
  if (userId === 999 && req.user.role === 'superadmin') {
    return sendSuccess(res, {
      id: 999,
      username: 'superadmin',
      role: 'superadmin',
      organizationId: undefined,
      firstName: 'Super',
      lastName: 'Admin',
      email: undefined,
      phone: null,
      organization: {
        id: 0,
        name: 'Demo Clinic',
        type: 'system',
        themeColor: '#DC2626'
      }
    });
  }

  try {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw ApiError.notFound('User');
    }

    // Use currentOrganizationId from session if available, fallback to user's organizationId
    const currentOrgId = req.user.currentOrganizationId || user.organizationId;
    let org = null;
    
    if (currentOrgId) {
      try {
        org = await getOrganizationDetails(currentOrgId);
      } catch (orgError) {
        // Log but don't fail if organization lookup fails
        console.error('Error fetching organization details:', orgError);
      }
    }

    return sendSuccess(res, {
      id: user.id,
      username: user.username,
      role: user.role,
      roleId: user.roleId || null, // Include RBAC roleId
      organizationId: currentOrgId,
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title,
      email: user.email,
      phone: user.phone,
      photoUrl: user.photoUrl,
      organization: org ? {
        id: org.id,
        name: org.name,
        type: org.type || 'clinic',
        themeColor: org.themeColor || '#3B82F6'
      } : null
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.databaseError('Failed to fetch user profile');
  }
}));

/**
 * PUT /api/profile
 * Update current user's profile
 */
router.put('/', 
  authenticateToken, 
  validateBody(updateProfileSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const userId = req.user.id;
    const updateData = req.body;

    // Only update allowed fields
    const allowedFields = ['title', 'firstName', 'lastName', 'phone', 'email'];
    const filteredData: any = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Convert "none" to null for title field
        filteredData[field] = field === 'title' && updateData[field] === 'none' 
          ? null 
          : updateData[field];
      }
    }

    // Add updatedAt timestamp
    filteredData.updatedAt = new Date();

    await db.update(users)
      .set(filteredData)
      .where(eq(users.id, userId));

    // Log audit event
    await logAuditEvent(
      userId, 
      'PROFILE_UPDATED', 
      'user', 
      userId, 
      { updatedFields: Object.keys(filteredData) }
    );

    return sendSuccess(res, null, { message: 'Profile updated successfully' });
  })
);

/**
 * GET /api/settings
 * Get user settings
 */
router.get('/settings', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  // Default settings - in a full implementation, these would come from a user_settings table
  const defaultSettings = {
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointments: true,
      labResults: true,
      emergencies: true,
    },
    privacy: {
      profileVisibility: 'staff',
      showOnlineStatus: true,
      allowDirectMessages: true,
    },
    appearance: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
  };

  return sendSuccess(res, defaultSettings);
}));

/**
 * PUT /api/settings
 * Update user settings
 */
router.put('/settings',
  authenticateToken,
  validateBody(updateSettingsSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const userId = req.user.id;
    const settingsData = req.body;

    // In a full implementation, save to user_settings table
    // For now, just acknowledge the update
    
    // Log audit event
    await logAuditEvent(
      userId,
      'SETTINGS_UPDATED',
      'user',
      userId,
      { updatedCategories: Object.keys(settingsData) }
    );

    return sendSuccess(res, settingsData, { message: 'Settings updated successfully' });
  })
);

/**
 * GET /api/profile/photo
 * Get user's profile photo URL
 */
router.get('/photo', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const [user] = await db.select({ photoUrl: users.photoUrl })
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);

  return sendSuccess(res, { photoUrl: user?.photoUrl || null });
}));

export default router;

/**
 * Setup function for backwards compatibility
 */
export function setupProfileRoutes(app: any): void {
  app.use('/api/profile', router);
  // Also mount settings at root level for backwards compatibility
  app.get('/api/settings', router);
  app.put('/api/settings', router);
}

