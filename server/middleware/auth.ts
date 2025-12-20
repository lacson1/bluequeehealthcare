import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { SecurityManager } from './security';

// Extend Express Request type to include our custom user
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: string;
      roleId?: number;
      organizationId?: number;
      currentOrganizationId?: number;
    }
  }
}

// Extend session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string;
      roleId?: number;
      organizationId?: number;
      currentOrganizationId?: number; // Currently selected organization
    };
    lastActivity?: Date;
  }
}

// SECURITY: JWT secret from environment variable - REQUIRED in production
let JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  if (isProduction) {
    // Fail fast in production - JWT_SECRET is required
    throw new Error(
      'JWT_SECRET environment variable is required in production. ' +
      'Set JWT_SECRET to a secure random string (use: openssl rand -base64 64)'
    );
  } else {
    // Generate a secure random secret for development only
    JWT_SECRET = crypto.randomBytes(64).toString('base64');
    console.warn('⚠️  WARNING: JWT_SECRET not set. Generated temporary secret for development.');
    console.warn('   JWT tokens will be invalidated on server restart.');
    console.warn('   Set JWT_SECRET environment variable for production.');
  }
}

// Export JWT_SECRET for use in other modules (read-only)
export const getJwtSecret = (): string => JWT_SECRET;

const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT_MS || '86400000', 10); // Default 24 hours

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    roleId?: number; // RBAC role reference
    organizationId?: number;
    currentOrganizationId?: number; // Currently selected organization
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check for session-based authentication first
    const sessionUser = (req.session as any)?.user;
    
    if (sessionUser) {
      // Check session timeout BEFORE updating lastActivity
      const lastActivity = (req.session as any).lastActivity;
      if (lastActivity) {
        const timeSinceActivity = Date.now() - new Date(lastActivity).getTime();
        if (timeSinceActivity > SESSION_TIMEOUT) {
          req.session.destroy((err) => {
            if (err) console.error('Session destroy error:', err);
          });
          return res.status(401).json({ message: 'Session expired. Please login again.' });
        }
      }
      
      // Update session activity AFTER checking timeout
      // This keeps the session alive for active users
      (req.session as any).lastActivity = new Date();
      
      // Save session to persist the updated lastActivity
      // Use callback to avoid blocking, but don't wait for it
      if (req.session && typeof req.session.save === 'function') {
        req.session.save((err) => {
          if (err) {
            console.error('Failed to save session activity update:', err);
          }
        });
      }
      
      req.user = {
        id: sessionUser.id,
        username: sessionUser.username,
        role: sessionUser.role,
        roleId: sessionUser.roleId,
        organizationId: sessionUser.organizationId,
        currentOrganizationId: sessionUser.currentOrganizationId || sessionUser.organizationId
      };
      return next();
    }

    // Check for JWT token in Authorization header (for API access)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          organizationId: decoded.organizationId,
          currentOrganizationId: decoded.organizationId
        };
        return next();
      } catch (jwtError: any) {
        // Token is invalid or expired
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token has expired. Please login again.' });
        }
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Invalid token. Please login again.' });
        }
        console.error('JWT verification error:', jwtError);
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    }

    // No valid authentication found
    return res.status(401).json({ message: 'Authentication required' });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

export const requireRole = (role: string) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Super admin has access to everything
  if (req.user.role === 'superadmin' || req.user.role === 'super_admin') {
    return next();
  }
  
  if (req.user.role !== role) {
    return res.status(403).json({ message: `Access denied. Required role: ${role}` });
  }
  
  next();
};

export const requireAnyRole = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Super admin has access to everything
  if (req.user.role === 'superadmin' || req.user.role === 'super_admin') {
    return next();
  }
  
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
  }
  
  next();
};

// Super admin or organization admin check
export const requireSuperOrOrgAdmin = () => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const isSuper = req.user.role === 'superadmin' || req.user.role === 'super_admin';
  const isAdmin = req.user.role === 'admin';
  
  if (!isSuper && !isAdmin) {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
  
  next();
};

// Optional authentication - doesn't fail if not authenticated
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionUser = (req.session as any)?.user;
    
    if (sessionUser) {
      req.user = {
        id: sessionUser.id,
        username: sessionUser.username,
        role: sessionUser.role,
        roleId: sessionUser.roleId,
        organizationId: sessionUser.organizationId,
        currentOrganizationId: sessionUser.currentOrganizationId || sessionUser.organizationId
      };
    }
    
    // Also check for JWT token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token && !req.user) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          organizationId: decoded.organizationId,
          currentOrganizationId: decoded.organizationId
        };
      } catch (jwtError: any) {
        // Token is invalid, but we don't fail - it's optional auth
        if (process.env.NODE_ENV === 'development') {
          console.debug('Optional JWT verification failed:', jwtError.name);
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: { id: number; username: string; role: string; organizationId?: number }): string => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, organizationId: user.organizationId },
    JWT_SECRET,
    { expiresIn: '30d' } // Extended to 30 days
  );
};

// Verify a JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error: any) {
    // Re-throw with more context
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Token has expired');
      (expiredError as any).name = 'TokenExpiredError';
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid token');
      (invalidError as any).name = 'JsonWebTokenError';
      throw invalidError;
    }
    throw error;
  }
};
