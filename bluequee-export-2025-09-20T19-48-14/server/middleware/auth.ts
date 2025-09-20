import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { SecurityManager } from './security';

// Extend session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: string;
      organizationId?: number;
    };
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'clinic-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    organizationId?: number;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated via session
    const sessionUser = (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check session timeout using SecurityManager
    const user = await storage.getUser(sessionUser.id);
    if (user?.lastLoginAt && !SecurityManager.isSessionValid(user.lastLoginAt)) {
      // Session has expired, clear it
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      return res.status(401).json({ message: 'Session expired' });
    }

    // Set user from session
    req.user = {
      id: sessionUser.id,
      username: sessionUser.username,
      role: sessionUser.role,
      organizationId: sessionUser.organizationId || undefined
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

export const requireRole = (role: string) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user; // decoded from JWT
  
  // Super admin has access to everything
  if (user?.role === 'super_admin' || user?.role === 'superadmin') {
    return next();
  }
  if (!user || user.role !== role) {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  }
  next();
};

export const requireAnyRole = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  // Super admin has access to everything
  if (user?.role === 'super_admin' || user?.role === 'superadmin') {
    return next();
  }
  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  }
  next();
};

// Super admin or organization admin check
export const requireSuperOrOrgAdmin = () => (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || (!['super_admin', 'superadmin', 'admin'].includes(user.role))) {
    return res.status(403).json({ message: 'Forbidden: Admin privileges required' });
  }
  next();
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