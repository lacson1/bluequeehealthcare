import { Router, Request, Response } from 'express';
import type { Session } from 'express-session';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, userOrganizations, organizations } from '@shared/schema';
import { authenticateToken, AuthRequest, hashPassword } from '../middleware/auth';
import { SecurityManager } from '../middleware/security';
import { validateBody, loginSchema, changePasswordSchema } from '../middleware/validate';
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
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', validateBody(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Check login attempts for rate limiting
  const attemptCheck = SecurityManager.checkLoginAttempts(username);
  if (!attemptCheck.allowed) {
    throw new ApiError(423, 'RATE_LIMITED', attemptCheck.message);
  }

  // Find user in database
  const [user] = await db.select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    SecurityManager.recordLoginAttempt(username, false);
    throw ApiError.unauthorized('Invalid username or password');
  }

  // Check if user is active
  if (!user.isActive) {
    SecurityManager.recordLoginAttempt(username, false);
    throw new ApiError(401, 'UNAUTHORIZED', 'Account is disabled. Contact administrator.');
  }

  // Verify password using bcrypt
  let passwordValid = false;
  
  // SECURITY: Demo passwords only work in development mode
  if (process.env.NODE_ENV !== 'production') {
    const demoPasswords = ['admin123', 'doctor123', 'super123', 'nurse123', 'receptionist123', 'password123', 'pharmacy123', 'physio123', 'lab123'];
    passwordValid = demoPasswords.includes(password);
  }

  // Check against the stored bcrypt hash
  if (!passwordValid && user.password) {
    passwordValid = await bcrypt.compare(password, user.password);
  }

  if (!passwordValid) {
    SecurityManager.recordLoginAttempt(username, false);
    throw ApiError.unauthorized('Invalid username or password');
  }

  // Successful login - record and update user
  SecurityManager.recordLoginAttempt(username, true);
  await SecurityManager.updateLastLogin(user.id);

  // Check if user has multiple organizations
  const userOrgs = await db
    .select()
    .from(userOrganizations)
    .where(eq(userOrganizations.userId, user.id));

  const org = user.organizationId ? await getOrganizationDetails(user.organizationId) : null;

  // Determine current organization
  let currentOrgId = user.organizationId;
  if (userOrgs.length > 0) {
    const defaultOrg = userOrgs.find(o => o.isDefault);
    currentOrgId = defaultOrg?.organizationId || userOrgs[0].organizationId;
  }

  // Ensure session is available
  if (!req.session) {
    throw ApiError.internal('Session not available. Please ensure session middleware is configured.');
  }

  // Set user session with activity tracking
  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    roleId: user.roleId,
    organizationId: user.organizationId,
    currentOrganizationId: currentOrgId
  };

  // Initialize session activity tracking
  req.session.lastActivity = new Date();

  // Save session before sending response
  await new Promise<void>((resolve, reject) => {
    req.session!.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  return sendSuccess(res, {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title,
      email: user.email,
      organization: org ? {
        id: org.id,
        name: org.name,
        type: org.type || 'clinic',
        themeColor: org.themeColor || '#3B82F6'
      } : null
    },
    requiresOrgSelection: userOrgs.length > 1
  }, { message: 'Login successful' });
}));

/**
 * POST /api/auth/logout
 * Destroy session and log out user
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return sendError(res, ApiError.internal('Could not log out'));
    }
    res.clearCookie('clinic.session.id');
    return sendSuccess(res, null, { message: 'Logged out successfully' });
  });
});

/**
 * POST /api/auth/change-password
 * Change authenticated user's password
 */
router.post('/change-password',
  authenticateToken,
  validateBody(changePasswordSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized();
    }

    // Validate new password strength
    const passwordValidation = SecurityManager.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw ApiError.badRequest(passwordValidation.message);
    }

    // Get current user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw ApiError.notFound('User');
    }

    // Verify current password
    let currentPasswordValid = false;
    
    // SECURITY: Demo passwords only work in development mode
    if (process.env.NODE_ENV !== 'production') {
      const validCurrentPasswords = ['admin123', 'doctor123', 'super123', 'nurse123', 'password123', 'pharmacy123', 'physio123'];
      currentPasswordValid = validCurrentPasswords.includes(currentPassword);
    }
    
    // Check against stored bcrypt hash
    if (!currentPasswordValid && user.password) {
      currentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    }
    
    if (!currentPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await db.update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return sendSuccess(res, null, { message: 'Password changed successfully' });
  })
);

/**
 * GET /api/auth/session-status
 * Check current session status
 */
router.get('/session-status', authenticateToken, (req: AuthRequest, res: Response) => {
  const sessionData = req.session as any;
  const user = req.user;

  if (!user || !sessionData.user) {
    return sendError(res, ApiError.unauthorized('Session invalid'));
  }

  const lastActivity = sessionData.lastActivity ? new Date(sessionData.lastActivity) : new Date();
  const now = new Date();
  const timeSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60); // minutes
  const sessionTimeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MS || '86400000', 10) / (1000 * 60);

  return sendSuccess(res, {
    valid: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId
    },
    session: {
      lastActivity: lastActivity.toISOString(),
      minutesSinceActivity: Math.round(timeSinceActivity),
      expiresIn: Math.max(0, sessionTimeoutMinutes - timeSinceActivity)
    }
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user info (alias for profile)
 */
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const userId = req.user.id;

  // Handle superadmin fallback user
  if (userId === 999 && req.user.role === 'superadmin') {
    return sendSuccess(res, {
      id: 999,
      username: 'superadmin',
      role: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      organization: {
        id: 0,
        name: 'System Administration',
        type: 'system',
        themeColor: '#DC2626'
      }
    });
  }

  // Get user from database
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw ApiError.notFound('User');
  }

  const org = user.organizationId ? await getOrganizationDetails(user.organizationId) : null;

  return sendSuccess(res, {
    id: user.id,
    username: user.username,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    title: user.title,
    email: user.email,
    phone: user.phone,
    organizationId: user.organizationId,
    organization: org ? {
      id: org.id,
      name: org.name,
      type: org.type || 'clinic',
      themeColor: org.themeColor || '#3B82F6'
    } : null
  });
}));

export default router;

/**
 * Setup function for backwards compatibility
 */
export function setupAuthRoutes(app: any): void {
  app.use('/api/auth', router);
}
