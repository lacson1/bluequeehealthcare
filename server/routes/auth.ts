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
 * POST /api/auth/clear-rate-limit (Development only)
 * Clear rate limits for development/testing
 */
if (process.env.NODE_ENV !== 'production') {
  router.post('/clear-rate-limit', async (req: Request, res: Response) => {
    try {
      // Import the limiter instance
      const { limiter } = await import('../middleware/rate-limit');
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `auth:${ip}`;
      
      // Clear rate limit for this IP
      limiter.clear(key);
      
      console.log('[AUTH] Rate limit cleared for IP:', ip, 'key:', key);
      
      return sendSuccess(res, { 
        message: 'Rate limit cleared for your IP',
        ip,
        key 
      });
    } catch (error: any) {
      console.error('[AUTH] Error clearing rate limit:', error);
      return sendError(res, ApiError.internal('Failed to clear rate limit'));
    }
  });
}

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

  console.log('[AUTH] Login attempt for username:', username);

  // Check login attempts for rate limiting
  const attemptCheck = SecurityManager.checkLoginAttempts(username);
  if (!attemptCheck.allowed) {
    throw new ApiError(423, 'RATE_LIMITED', attemptCheck.message);
  }

  // Find user in database
  let user;
  try {
    const userResult = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    user = userResult[0];
    console.log('[AUTH] User lookup result:', user ? `Found user ID ${user.id}` : 'User not found');
  } catch (error: any) {
    console.error('[AUTH] Database error during user lookup:', error);
    console.error('[AUTH] Database error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name
    });
    
    // Provide more helpful error messages based on error type
    let errorMessage = 'Database connection failed';
    let setupInstructions = '';
    
    if (error?.code === '28000' || error?.message?.includes('does not exist') || error?.message?.includes('role')) {
      errorMessage = 'Database user does not exist. The database needs to be set up.';
      setupInstructions = 'Run: bash setup-dev-db.sh (requires Docker) or update DATABASE_URL to use an existing database user.';
    } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('connection') || error?.message?.includes('connect')) {
      errorMessage = 'Cannot connect to database. Please ensure the database server is running.';
      setupInstructions = 'Start your database server or run: bash setup-dev-db.sh to set up a local database.';
    } else if (error?.code === '3D000' || error?.message?.includes('database')) {
      errorMessage = 'Database does not exist. Please create the database first.';
      setupInstructions = 'Run: bash setup-dev-db.sh to automatically set up the database.';
    } else if (error?.message) {
      errorMessage = `Database error: ${error.message}`;
    }
    
    // Log detailed error for debugging
    console.error('[AUTH] Database setup issue detected:', {
      errorCode: error?.code,
      errorMessage: error?.message,
      setupInstructions
    });
    
    throw ApiError.databaseError(`${errorMessage} ${setupInstructions}`);
  }

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
  
  try {
    // SECURITY: Demo passwords only work in development mode
    if (process.env.NODE_ENV !== 'production') {
      const demoPasswords = ['admin123', 'doctor123', 'super123', 'nurse123', 'receptionist123', 'password123', 'pharmacy123', 'physio123', 'lab123'];
      passwordValid = demoPasswords.includes(password);
      console.log('[AUTH] Demo password check:', passwordValid ? 'Valid' : 'Invalid');
    }

    // Check against the stored bcrypt hash
    if (!passwordValid && user.password) {
      try {
        passwordValid = await bcrypt.compare(password, user.password);
        console.log('[AUTH] Bcrypt password check:', passwordValid ? 'Valid' : 'Invalid');
      } catch (bcryptError) {
        console.error('[AUTH] Bcrypt comparison error:', bcryptError);
        // Continue - password will be invalid
      }
    }
  } catch (error) {
    console.error('[AUTH] Password verification error:', error);
    throw ApiError.internal('Password verification failed');
  }

  if (!passwordValid) {
    SecurityManager.recordLoginAttempt(username, false);
    throw ApiError.unauthorized('Invalid username or password');
  }

  // Successful login - record and update user
  SecurityManager.recordLoginAttempt(username, true);
  
  // Update last login (non-blocking - errors are logged but don't fail login)
  try {
    await SecurityManager.updateLastLogin(user.id);
  } catch (error) {
    console.error('[AUTH] Failed to update last login (non-critical):', error);
    // Continue with login even if this fails
  }

  // Check if user has multiple organizations
  let userOrgs = [];
  try {
    userOrgs = await db
      .select()
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, user.id));
  } catch (error) {
    console.error('[AUTH] Failed to fetch user organizations:', error);
    // Continue with empty array - user can still login
    userOrgs = [];
  }

  let org = null;
  if (user.organizationId) {
    try {
      org = await getOrganizationDetails(user.organizationId);
    } catch (error) {
      console.error('[AUTH] Failed to fetch organization details:', error);
      // Continue without org - user can still login
    }
  }

  // Determine current organization
  let currentOrgId = user.organizationId;
  if (userOrgs.length > 0) {
    const defaultOrg = userOrgs.find(o => o.isDefault);
    currentOrgId = defaultOrg?.organizationId || userOrgs[0].organizationId;
  }

  // Ensure session is available
  if (!req.session) {
    console.error('[AUTH] Session not available on request object');
    console.error('[AUTH] Request headers:', req.headers);
    console.error('[AUTH] Session middleware check - req.session type:', typeof req.session);
    throw ApiError.internal('Session not available. Please ensure session middleware is configured.');
  }

  console.log('[AUTH] Setting user session for user ID:', user.id);
  console.log('[AUTH] Session ID before save:', req.session.id);

  // Set user session with activity tracking
  try {
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
    console.log('[AUTH] Session data set, saving session...');
  } catch (error: any) {
    console.error('[AUTH] Error setting session data:', error);
    console.error('[AUTH] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    throw ApiError.internal('Failed to set session data');
  }

  // Save session before sending response
  // Use a more robust session save with proper error handling
  try {
    // First, try to manually trigger session save
    if (req.session && typeof req.session.save === 'function') {
      await new Promise<void>((resolve, reject) => {
        if (!req.session) {
          return reject(new Error('Session was lost before save'));
        }
        
        // Add timeout to prevent hanging (5 seconds)
        const timeout = setTimeout(() => {
          console.error('[AUTH] Session save timeout - session store may not be responding');
          reject(new Error('Session save timeout after 5 seconds'));
        }, 5000);
        
        try {
          req.session.save((err) => {
            clearTimeout(timeout);
            if (err) {
              console.error('[AUTH] Session save error:', err);
              console.error('[AUTH] Session save error details:', {
                message: err.message,
                stack: err.stack,
                sessionId: req.session?.id,
                code: (err as any)?.code,
                name: err.name
              });
              reject(err);
            } else {
              console.log('[AUTH] Session saved successfully, session ID:', req.session?.id);
              resolve();
            }
          });
        } catch (saveError: any) {
          clearTimeout(timeout);
          console.error('[AUTH] Exception during session.save() call:', saveError);
          reject(saveError);
        }
      });
    } else {
      // Fallback: if save method doesn't exist, try to regenerate session
      console.warn('[AUTH] Session save method not available, attempting to regenerate session');
      if (req.session && typeof req.session.regenerate === 'function') {
        await new Promise<void>((resolve, reject) => {
          req.session!.regenerate((err) => {
            if (err) {
              console.error('[AUTH] Session regenerate error:', err);
              reject(err);
            } else {
              console.log('[AUTH] Session regenerated successfully');
              resolve();
            }
          });
        });
      } else {
        console.warn('[AUTH] Session save/regenerate not available - session may not persist');
        // Continue anyway - session middleware might handle it automatically
      }
    }
  } catch (error: any) {
    console.error('[AUTH] Failed to save session:', error);
    console.error('[AUTH] Session save failure details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      sessionAvailable: !!req.session,
      sessionId: req.session?.id
    });
    
    // Provide more helpful error message
    let errorMessage = 'Failed to create session';
    if (error?.message?.includes('timeout')) {
      errorMessage = 'Session store is not responding. Please check your database connection.';
    } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('connection')) {
      errorMessage = 'Cannot connect to session store. Please ensure the database is running.';
    } else if (error?.message) {
      errorMessage = `Failed to create session: ${error.message}`;
    }
    
    throw ApiError.internal(errorMessage);
  }

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
