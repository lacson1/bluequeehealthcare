import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, errorLogs } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { AuthRequest, logServerError } from './error-handler';

interface AuthValidationResult {
  isValid: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
  tokenHealth: {
    isExpired: boolean;
    expiresIn: number;
    issueTime: number;
    userId?: number;
    organizationId?: number;
  };
  sessionHealth: {
    exists: boolean;
    isValid: boolean;
    lastActivity?: Date;
    duration?: number;
  };
}

export class AuthValidator {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly WARNING_THRESHOLDS = {
    TOKEN_EXPIRES_SOON: 2 * 60 * 60 * 1000, // 2 hours
    SESSION_INACTIVE: 24 * 60 * 60 * 1000, // 24 hours
    FAILED_ATTEMPTS_THRESHOLD: 5,
    SUSPICIOUS_ACTIVITY_WINDOW: 30 * 60 * 1000 // 30 minutes
  };

  static async validateAuthenticationState(req: AuthRequest): Promise<AuthValidationResult> {
    const result: AuthValidationResult = {
      isValid: true,
      severity: 'LOW',
      issues: [],
      recommendations: [],
      tokenHealth: {
        isExpired: false,
        expiresIn: 0,
        issueTime: 0
      },
      sessionHealth: {
        exists: false,
        isValid: false
      }
    };

    try {
      // Validate JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await this.validateJWTToken(token, result, req);
      } else {
        result.issues.push('No authentication token provided');
        result.severity = 'HIGH';
        result.isValid = false;
      }

      // Note: Session validation disabled - using JWT-only authentication

      // Check for suspicious authentication patterns
      await this.checkSuspiciousActivity(req, result);

      // Generate recommendations based on findings
      this.generateRecommendations(result);

      return result;
    } catch (error) {
      await logServerError({
        error,
        req,
        severity: 'HIGH',
        type: 'AUTHENTICATION',
        action: 'auth_validation',
        component: 'AuthValidator'
      });

      result.isValid = false;
      result.severity = 'CRITICAL';
      result.issues.push(`Authentication validation failed: ${error.message}`);
      return result;
    }
  }

  private static async validateJWTToken(token: string, result: AuthValidationResult, req: AuthRequest): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      result.tokenHealth = {
        isExpired: false,
        expiresIn: (decoded.exp * 1000) - Date.now(),
        issueTime: decoded.iat * 1000,
        userId: decoded.id,
        organizationId: decoded.organizationId
      };

      // Check if token expires soon
      if (result.tokenHealth.expiresIn < this.WARNING_THRESHOLDS.TOKEN_EXPIRES_SOON) {
        result.issues.push(`Token expires in ${Math.round(result.tokenHealth.expiresIn / (60 * 1000))} minutes`);
        result.severity = 'MEDIUM';
      }

      // Verify user still exists and is active
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (!user) {
        result.issues.push('Token references non-existent user');
        result.severity = 'HIGH';
        result.isValid = false;
      }

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        result.tokenHealth.isExpired = true;
        result.issues.push('Authentication token has expired');
        result.severity = 'HIGH';
        result.isValid = false;
      } else if (error.name === 'JsonWebTokenError') {
        result.issues.push('Invalid authentication token format');
        result.severity = 'CRITICAL';
        result.isValid = false;
      } else {
        result.issues.push(`Token validation error: ${error.message}`);
        result.severity = 'HIGH';
        result.isValid = false;
      }
    }
  }

  // Session validation disabled for JWT-only authentication

  private static async checkSuspiciousActivity(req: AuthRequest, result: AuthValidationResult): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return;

      const timeWindow = new Date(Date.now() - this.WARNING_THRESHOLDS.SUSPICIOUS_ACTIVITY_WINDOW);

      // Check for recent authentication errors
      const recentAuthErrors = await db
        .select()
        .from(errorLogs)
        .where(
          and(
            eq(errorLogs.userId, userId),
            eq(errorLogs.type, 'AUTHENTICATION'),
            gte(errorLogs.createdAt, timeWindow)
          )
        )
        .orderBy(desc(errorLogs.createdAt));

      if (recentAuthErrors.length >= this.WARNING_THRESHOLDS.FAILED_ATTEMPTS_THRESHOLD) {
        result.issues.push(`${recentAuthErrors.length} authentication errors in the last 30 minutes`);
        result.severity = 'HIGH';
      }

      // Check for multiple IP addresses
      const uniqueIPs = new Set(recentAuthErrors.map(error => 
        error.metadata && typeof error.metadata === 'object' && 'ip' in error.metadata 
          ? error.metadata.ip 
          : null
      ).filter(Boolean));

      if (uniqueIPs.size > 3) {
        result.issues.push(`Authentication attempts from ${uniqueIPs.size} different IP addresses`);
        result.severity = 'HIGH';
      }

    } catch (error) {
      result.issues.push(`Suspicious activity check failed: ${error.message}`);
    }
  }

  private static generateRecommendations(result: AuthValidationResult): void {
    if (result.tokenHealth.isExpired) {
      result.recommendations.push('Redirect user to login page for token renewal');
    }

    if (result.tokenHealth.expiresIn < this.WARNING_THRESHOLDS.TOKEN_EXPIRES_SOON) {
      result.recommendations.push('Implement automatic token refresh mechanism');
      result.recommendations.push('Display session timeout warning to user');
    }

    if (!result.sessionHealth.isValid) {
      result.recommendations.push('Clean up expired sessions from database');
      result.recommendations.push('Implement session renewal process');
    }

    if (result.severity === 'HIGH' || result.severity === 'CRITICAL') {
      result.recommendations.push('Force user re-authentication');
      result.recommendations.push('Log security incident for review');
      result.recommendations.push('Consider implementing account lockout mechanism');
    }

    if (result.issues.some(issue => issue.includes('IP addresses'))) {
      result.recommendations.push('Implement IP-based access controls');
      result.recommendations.push('Enable multi-factor authentication');
      result.recommendations.push('Send security alert to user email');
    }
  }

  static async generateAuthReport(req: AuthRequest): Promise<{
    overall: 'secure' | 'warning' | 'critical';
    validation: AuthValidationResult;
    securityScore: number;
    actionItems: string[];
  }> {
    const validation = await this.validateAuthenticationState(req);
    
    let securityScore = 100;
    let overall: 'secure' | 'warning' | 'critical' = 'secure';
    
    // Deduct points based on issues
    securityScore -= validation.issues.length * 10;
    
    if (validation.tokenHealth.isExpired) securityScore -= 30;
    if (!validation.sessionHealth.isValid) securityScore -= 20;
    if (validation.severity === 'HIGH') securityScore -= 25;
    if (validation.severity === 'CRITICAL') securityScore -= 50;
    
    securityScore = Math.max(0, securityScore);
    
    if (securityScore < 60 || validation.severity === 'CRITICAL') {
      overall = 'critical';
    } else if (securityScore < 80 || validation.severity === 'HIGH') {
      overall = 'warning';
    }
    
    const actionItems = [
      ...validation.recommendations,
      ...(securityScore < 70 ? ['Review authentication infrastructure'] : []),
      ...(validation.issues.length > 3 ? ['Implement comprehensive security audit'] : [])
    ];
    
    return {
      overall,
      validation,
      securityScore,
      actionItems
    };
  }
}

// Route handlers
export const setupAuthValidationRoutes = (app: any) => {
  // Authentication validation endpoint
  app.get('/api/auth/validate', async (req: AuthRequest, res: Response) => {
    try {
      const report = await AuthValidator.generateAuthReport(req);
      res.json(report);
    } catch (error) {
      console.error('Auth validation failed:', error);
      res.status(500).json({ 
        message: 'Authentication validation failed',
        error: error.message 
      });
    }
  });

  // Token health check
  app.get('/api/auth/token-health', async (req: AuthRequest, res: Response) => {
    try {
      const validation = await AuthValidator.validateAuthenticationState(req);
      res.json({
        tokenHealth: validation.tokenHealth,
        isValid: validation.isValid,
        expiresInMinutes: Math.round(validation.tokenHealth.expiresIn / (60 * 1000))
      });
    } catch (error) {
      console.error('Token health check failed:', error);
      res.status(500).json({ 
        message: 'Token health check failed',
        error: error.message 
      });
    }
  });

  // Session validation endpoint
  app.get('/api/auth/session-health', async (req: AuthRequest, res: Response) => {
    try {
      const validation = await AuthValidator.validateAuthenticationState(req);
      res.json({
        sessionHealth: validation.sessionHealth,
        recommendations: validation.recommendations.filter(r => 
          r.includes('session') || r.includes('Session')
        )
      });
    } catch (error) {
      console.error('Session health check failed:', error);
      res.status(500).json({ 
        message: 'Session health check failed',
        error: error.message 
      });
    }
  });
};