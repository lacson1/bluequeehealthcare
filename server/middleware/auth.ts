import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`Auth attempt for ${req.method} ${req.path}:`, {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenPreview: token?.substring(0, 20) + '...'
    });

    if (!token) {
      console.log('No token found, returning 401');
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          console.log('Token expired');
          return res.status(401).json({ message: 'Token expired' });
        }
        console.error('JWT verification error for token:', token?.substring(0, 20) + '...', 'Error:', err.message);
        return res.status(403).json({ message: 'Invalid token' });
      }

      // Get full user details from database
      const dbUser = await storage.getUser(decoded.id);
      if (!dbUser) {
        console.log('User not found in database for ID:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('Authentication successful for user:', dbUser.username, 'role:', dbUser.role);
      req.user = {
        id: dbUser.id,
        username: dbUser.username,
        role: dbUser.role,
        organizationId: dbUser.organizationId || undefined
      };
      next();
    });
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

export const generateToken = (user: { id: number; username: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};