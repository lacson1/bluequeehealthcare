import { Router, Request, Response } from 'express';
import type { Session } from 'express-session';
import { eq, sql, inArray, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, userOrganizations, organizations } from '@shared/schema';
import { authenticateToken, AuthRequest, hashPassword } from '../middleware/auth';
import { SecurityManager } from '../middleware/security';
import { validateBody, loginSchema, changePasswordSchema, registerSchema } from '../middleware/validate';
import { sendSuccess, sendError, ApiError, asyncHandler } from '../lib/api-response';
import { authLogger } from '../lib/logger';

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

      authLogger.info('Rate limit cleared', { ip, key });

      return sendSuccess(res, {
        message: 'Rate limit cleared for your IP',
        ip,
        key
      });
    } catch (error: any) {
      authLogger.error('Error clearing rate limit', { error, ip });
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

  authLogger.info('Login attempt', { username });

  // SECURITY: Fail fast in production if demo passwords are attempted
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    // In production, only bcrypt authentication is allowed
    // No demo passwords or fallback authentication
  }

  // Check login attempts for rate limiting
  const attemptCheck = SecurityManager.checkLoginAttempts(username);
  if (!attemptCheck.allowed) {
    authLogger.warn('Rate limited login attempt', { username });
    throw new ApiError(423, 'RATE_LIMITED', attemptCheck.message);
  }

  // Find user in database
  let user;
  
  // SECURITY: Demo passwords only available in development via environment variable
  // This prevents accidental exposure in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowDemoPasswords = isDevelopment && process.env.ALLOW_DEMO_PASSWORDS === 'true';
  
  // Get demo passwords from environment (comma-separated) if allowed
  // Format: ALLOW_DEMO_PASSWORDS=true DEMO_PASSWORDS=admin123,doctor123,super123
  const demoPasswordsEnv = process.env.DEMO_PASSWORDS || '';
  const demoPasswords = allowDemoPasswords && demoPasswordsEnv 
    ? demoPasswordsEnv.split(',').map(p => p.trim())
    : [];

  // Check demo passwords only if explicitly enabled in development
  let passwordValid = false;
  if (allowDemoPasswords && demoPasswords.length > 0) {
    passwordValid = demoPasswords.includes(password);
    if (passwordValid) {
      authLogger.debug('Demo password validated', { username });
    }
  } else if (isDevelopment && !allowDemoPasswords) {
    authLogger.warn('Demo passwords disabled - set ALLOW_DEMO_PASSWORDS=true to enable');
  }

  try {
    const userResult = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    user = userResult[0];
    authLogger.debug('User lookup result', { 
      found: !!user, 
      userId: user?.id,
      username 
    });
  } catch (error: any) {
    authLogger.error('Database error during user lookup', {
      error: error?.message,
      code: error?.code,
      username
    });

    // SECURITY: In production, never allow fallback authentication
    // In development, only allow fallback if explicitly enabled
    if (allowDemoPasswords && passwordValid) {
      authLogger.warn('Database connection failed but demo password valid - allowing fallback login', { username });
      user = null; // Will be handled by fallback user creation below
    } else {
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
      authLogger.error('Database setup issue detected', {
        errorCode: error?.code,
        errorMessage: error?.message,
        setupInstructions
      });

      throw ApiError.databaseError(`${errorMessage} ${setupInstructions}`);
    }
  }


  // SECURITY: Fallback user only allowed in development with explicit flag
  // If user not found, but we're in development and password matches demo, allow login with fallback user
  if (!user) {
    if (allowDemoPasswords && passwordValid) {
      authLogger.warn('User not found but demo password valid - allowing login with fallback user', { username });
      // Create a minimal user object for demo purposes
      const roleMap: Record<string, string> = {
        'superadmin': 'superadmin',
        'admin': 'admin',
        'ade': 'doctor',
        'syb': 'nurse',
        'receptionist': 'receptionist',
        'akin': 'pharmacist',
        'seye': 'physiotherapist'
      };

      user = {
        id: 0,
        username: username,
        role: roleMap[username] || 'staff',
        roleId: null,
        isActive: true,
        password: null,
        organizationId: null,
        firstName: username.charAt(0).toUpperCase() + username.slice(1),
        lastName: '',
        email: `${username}@demo.local`,
        title: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
    } else {
      SecurityManager.recordLoginAttempt(username, false);
      throw ApiError.unauthorized('Invalid username or password');
    }
  }

  // Check if user is active
  if (!user.isActive) {
    SecurityManager.recordLoginAttempt(username, false);
    throw new ApiError(401, 'UNAUTHORIZED', 'Account is disabled. Contact administrator.');
  }

  // Verify password using bcrypt (if demo password check didn't already validate)
  if (!passwordValid) {
    try {
      // Check against the stored bcrypt hash
      if (user.password) {
        try {
          passwordValid = await bcrypt.compare(password, user.password);
          authLogger.debug('Bcrypt password check', { 
            valid: passwordValid,
            username 
          });
        } catch (bcryptError) {
          authLogger.error('Bcrypt comparison error', { 
            error: bcryptError,
            username 
          });
          // Continue - password will be invalid
        }
      } else if (allowDemoPasswords && demoPasswords.length > 0) {
        // In development, if user has no password hash, allow demo passwords (if enabled)
        passwordValid = demoPasswords.includes(password);
        authLogger.debug('User has no password hash, checking demo passwords', { 
          valid: passwordValid,
          username 
        });
      } else {
        // User has no password hash and demo passwords not enabled
        authLogger.warn('User has no password hash and demo passwords disabled', { username });
        passwordValid = false;
      }
    } catch (error) {
      authLogger.error('Password verification error', { error, username });
      throw ApiError.internal('Password verification failed');
    }
  }

  if (!passwordValid) {
    SecurityManager.recordLoginAttempt(username, false);
    authLogger.warn('Invalid password attempt', { username });
    throw ApiError.unauthorized('Invalid username or password');
  }

  // Successful login - record and update user
  SecurityManager.recordLoginAttempt(username, true);
  authLogger.info('Successful login', { username, userId: user.id, role: user.role });

  // Update last login (non-blocking - errors are logged but don't fail login)
  // Skip for fallback demo users (id === 0)
  if (user.id !== 0) {
    try {
      await SecurityManager.updateLastLogin(user.id);
    } catch (error) {
      authLogger.error('Failed to update last login (non-critical)', { error, userId: user.id });
      // Continue with login even if this fails
    }
  } else {
    authLogger.debug('Skipping last login update for fallback demo user');
  }

  // Check if user has multiple organizations
  // Skip for fallback demo users (id === 0)
  let userOrgs = [];
  if (user.id !== 0) {
    try {
      userOrgs = await db
        .select()
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, user.id));
    } catch (error) {
      authLogger.error('Failed to fetch user organizations', { error, userId: user.id });
      // Continue with empty array - user can still login
      userOrgs = [];
    }
  } else {
    authLogger.debug('Skipping organization lookup for fallback demo user');
  }

  let org = null;
  if (user.organizationId) {
    try {
      org = await getOrganizationDetails(user.organizationId);
    } catch (error) {
      authLogger.error('Failed to fetch organization details', { 
        error, 
        organizationId: user.organizationId 
      });
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
    authLogger.error('Session not available on request object', {
      headers: Object.keys(req.headers)
    });
    throw ApiError.internal('Session not available. Please ensure session middleware is configured.');
  }

  authLogger.debug('Setting user session', { 
    userId: user.id,
    sessionId: req.session.id 
  });

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
    authLogger.debug('Session data set, saving session');
  } catch (error: any) {
    authLogger.error('Error setting session data', {
      error: error?.message,
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
          authLogger.error('Session save timeout - session store may not be responding', {
            sessionId: req.session?.id
          });
          reject(new Error('Session save timeout after 5 seconds'));
        }, 5000);

        try {
          req.session.save((err) => {
            clearTimeout(timeout);
            if (err) {
              authLogger.error('Session save error', {
                message: err.message,
                stack: err.stack,
                sessionId: req.session?.id,
                code: (err as any)?.code,
                name: err.name
              });
              reject(err);
            } else {
              authLogger.debug('Session saved successfully', { 
                sessionId: req.session?.id 
              });
              resolve();
            }
          });
        } catch (saveError: any) {
          clearTimeout(timeout);
          authLogger.error('Exception during session.save() call', { error: saveError });
          reject(saveError);
        }
      });
    } else {
      // Fallback: if save method doesn't exist, try to regenerate session
      authLogger.warn('Session save method not available, attempting to regenerate session');
      if (req.session && typeof req.session.regenerate === 'function') {
        await new Promise<void>((resolve, reject) => {
          req.session!.regenerate((err) => {
            if (err) {
              authLogger.error('Session regenerate error', { error: err });
              reject(err);
            } else {
              authLogger.debug('Session regenerated successfully');
              resolve();
            }
          });
        });
      } else {
        authLogger.warn('Session save/regenerate not available - session may not persist');
        // Continue anyway - session middleware might handle it automatically
      }
    }
  } catch (error: any) {
    authLogger.error('Failed to save session', {
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

  // If user has multiple organizations, return them for selection
  if (userOrgs.length > 1) {
    // Fetch full organization details
    const orgIds = userOrgs.map(uo => uo.organizationId);
    const orgDetails = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        type: organizations.type,
        themeColor: organizations.themeColor,
        logoUrl: organizations.logoUrl
      })
      .from(organizations)
      .where(inArray(organizations.id, orgIds));

    const organizationsList = userOrgs.map(uo => {
      const orgDetail = orgDetails.find(o => o.id === uo.organizationId);
      return {
        organizationId: uo.organizationId,
        isDefault: uo.isDefault,
        organization: orgDetail ? {
          id: orgDetail.id,
          name: orgDetail.name,
          type: orgDetail.type || 'clinic',
          themeColor: orgDetail.themeColor || '#3B82F6',
          logoUrl: orgDetail.logoUrl
        } : null
      };
    });

    // Store temporary login state in session (user authenticated but org not selected)
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      roleId: user.roleId,
      organizationId: null, // Will be set after org selection
      currentOrganizationId: null
    };
    req.session.pendingLogin = true; // Flag to indicate login is pending org selection
    req.session.lastActivity = new Date();

    // Save session
    await new Promise<void>((resolve, reject) => {
      if (!req.session) return reject(new Error('Session lost'));
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        title: user.title,
        email: user.email
      },
      requiresOrgSelection: true,
      organizations: organizationsList
    }, { message: 'Please select an organization to continue' });
  }

  // Single organization or no organizations - proceed with normal login
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
    requiresOrgSelection: false
  }, { message: 'Login successful' });
}));

/**
 * POST /api/auth/complete-login
 * Complete login by selecting organization (for users with multiple orgs)
 */
router.post('/complete-login', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.body;

  if (!req.session || !req.session.user) {
    throw ApiError.unauthorized('No active login session. Please login again.');
  }

  if (!req.session.pendingLogin) {
    throw ApiError.badRequest('Login already completed');
  }

  if (!organizationId) {
    throw ApiError.badRequest('Organization ID is required');
  }

  const userId = req.session.user.id;

  // Verify user has access to this organization
  const [userOrg] = await db
    .select()
    .from(userOrganizations)
    .where(
      and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, organizationId)
      )
    );

  if (!userOrg) {
    throw ApiError.forbidden('You do not have access to this organization');
  }

  // Get organization details
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId));

  if (!org) {
    throw ApiError.notFound('Organization not found');
  }

  // Update session with selected organization
  req.session.user.organizationId = organizationId;
  req.session.user.currentOrganizationId = organizationId;
  req.session.pendingLogin = false;
  req.session.lastActivity = new Date();

  // Save session
  await new Promise<void>((resolve, reject) => {
    if (!req.session) return reject(new Error('Session lost'));
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Get user details
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return sendSuccess(res, {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      roleId: user.roleId,
      organizationId: organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title,
      email: user.email,
      organization: {
        id: org.id,
        name: org.name,
        type: org.type || 'clinic',
        themeColor: org.themeColor || '#3B82F6',
        logoUrl: org.logoUrl
      }
    }
  }, { message: 'Login completed successfully' });
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

    // SECURITY: Demo passwords only work in development mode with explicit flag
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const allowDemoPasswords = isDevelopment && process.env.ALLOW_DEMO_PASSWORDS === 'true';
    const demoPasswordsEnv = process.env.DEMO_PASSWORDS || '';
    const demoPasswords = allowDemoPasswords && demoPasswordsEnv 
      ? demoPasswordsEnv.split(',').map(p => p.trim())
      : [];

    if (allowDemoPasswords && demoPasswords.length > 0) {
      currentPasswordValid = demoPasswords.includes(currentPassword);
      if (currentPasswordValid) {
        authLogger.debug('Demo password validated for password change', { userId });
      }
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
 * POST /api/auth/forgot-password
 * Request password reset - sends email with reset token
 */
router.post('/forgot-password', 
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email } = req.body;

    if (!username && !email) {
      throw ApiError.badRequest('Username or email is required');
    }

    // Find user by username or email
    let user;
    if (username) {
      const userResult = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      user = userResult[0];
    } else if (email) {
      const userResult = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      user = userResult[0];
    }

    // Always return success to prevent user enumeration
    // But only send email if user exists and has email
    if (user && user.email) {
      // Generate reset token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

      // Save reset token to database
      await db.update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        })
        .where(eq(users.id, user.id));

      // Generate reset URL
      const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // Send password reset email
      try {
        const { EmailService } = await import('../services/EmailService');
        const emailResult = await EmailService.sendPasswordResetEmail({
          userEmail: user.email,
          userName: user.firstName || user.username,
          resetUrl: resetUrl,
          resetToken: resetToken
        });

        if (emailResult.success) {
          authLogger.info('Password reset email sent', { 
            username: user.username, 
            email: user.email,
            messageId: emailResult.messageId 
          });
          
          // In development mode without SendGrid, log the reset URL
          if (process.env.NODE_ENV === 'development' && emailResult.messageId === 'logged-only') {
            authLogger.warn('Email service not configured. Reset URL (dev only):', { resetUrl });
            console.log('\n⚠️  EMAIL SERVICE NOT CONFIGURED');
            console.log('📧 Password reset URL (for testing):', resetUrl);
            console.log('💡 To enable email sending, set SENDGRID_API_KEY in your .env file\n');
          }
        } else {
          authLogger.error('Failed to send password reset email', { 
            username: user.username, 
            email: user.email,
            error: emailResult.error 
          });
          
          // In development, still log the reset URL even if email failed
          if (process.env.NODE_ENV === 'development') {
            authLogger.warn('Email failed but reset URL available (dev only):', { resetUrl });
            console.log('\n⚠️  EMAIL SENDING FAILED');
            console.log('📧 Password reset URL (for testing):', resetUrl);
            console.log('❌ Error:', emailResult.error, '\n');
          }
        }
      } catch (emailError: any) {
        authLogger.error('Exception sending password reset email', { 
          username: user.username, 
          email: user.email,
          error: emailError?.message || emailError 
        });
        
        // In development, log the reset URL even if there was an exception
        if (process.env.NODE_ENV === 'development') {
          authLogger.warn('Email exception but reset URL available (dev only):', { resetUrl });
          console.log('\n⚠️  EMAIL SERVICE EXCEPTION');
          console.log('📧 Password reset URL (for testing):', resetUrl);
          console.log('❌ Error:', emailError?.message || emailError, '\n');
        }
      }
    } else if (user && !user.email) {
      authLogger.warn('Password reset requested for user without email', { 
        username: user.username,
        userId: user.id 
      });
    }

    // Always return success message (security best practice)
    return sendSuccess(res, null, { 
      message: 'If an account exists with that username or email, a password reset link has been sent.'
    });
  })
);

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 */
router.post('/reset-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw ApiError.badRequest('Token and new password are required');
    }

    // Validate password strength
    const passwordValidation = SecurityManager.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw ApiError.badRequest(passwordValidation.message);
    }

    // Find user with valid reset token
    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          sql`${users.passwordResetExpires} > NOW()`
        )
      )
      .limit(1);

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await db.update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    authLogger.info('Password reset completed', { username: user.username });

    return sendSuccess(res, null, { 
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  })
);

/**
 * GET /api/auth/verify-reset-token
 * Verify if reset token is valid
 */
router.get('/verify-reset-token/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          sql`${users.passwordResetExpires} > NOW()`
        )
      )
      .limit(1);

    if (!user) {
      return sendError(res, ApiError.badRequest('Invalid or expired reset token'));
    }

    return sendSuccess(res, { valid: true, username: user.username });
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
        name: 'Demo Clinic',
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
 * POST /api/auth/register
 * Public user registration endpoint
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, password, email, firstName, lastName, role } = req.body;

  // Validate input
  const validationResult = registerSchema.safeParse(req.body);
  if (!validationResult.success) {
    return sendError(res, ApiError.badRequest(
      validationResult.error.errors[0].message,
      { errors: validationResult.error.errors }
    ));
  }

  // Check if username already exists
  const [existingUser] = await db.select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUser) {
    return sendError(res, ApiError.badRequest('Username already exists', { code: 'USERNAME_EXISTS' }));
  }

  // Check if email already exists (if provided)
  if (email) {
    const [existingEmail] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail) {
      return sendError(res, ApiError.badRequest('Email already registered', { code: 'EMAIL_EXISTS' }));
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create new user
  const defaultRole = role || 'receptionist';
  const [newUser] = await db.insert(users)
    .values({
      username,
      password: hashedPassword,
      email: email || null,
      firstName: firstName || null,
      lastName: lastName || null,
      role: defaultRole,
      isActive: true,
      organizationId: null
    })
    .returning();

  // Return user data (without password)
  const { password: _, ...userWithoutPassword } = newUser;

  authLogger.info('User registered', { username, role: defaultRole });

  return sendSuccess(res, {
    message: 'Account created successfully. You can now log in.',
    user: userWithoutPassword
  }, 201);
}));

/**
 * Setup function for backwards compatibility
 */
export function setupAuthRoutes(app: any): void {
  app.use('/api/auth', router);
}
