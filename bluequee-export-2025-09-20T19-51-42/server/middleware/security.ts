import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface LoginAttempt {
  username: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
}

interface PasswordValidation {
  valid: boolean;
  message: string;
  score: number;
}

interface LoginAttemptCheck {
  allowed: boolean;
  message: string;
  attemptsRemaining?: number;
  lockoutExpiresAt?: Date;
}

class SecurityManagerClass {
  private loginAttempts: Map<string, LoginAttempt[]> = new Map();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes in milliseconds

  /**
   * Check if a username is allowed to attempt login
   */
  checkLoginAttempts(username: string): LoginAttemptCheck {
    const attempts = this.loginAttempts.get(username) || [];
    const now = new Date();
    
    // Clean up old attempts (older than lockout duration)
    const validAttempts = attempts.filter(
      attempt => (now.getTime() - attempt.timestamp.getTime()) < this.LOCKOUT_DURATION
    );
    
    // Update the attempts list
    this.loginAttempts.set(username, validAttempts);
    
    // Count recent failed attempts
    const recentFailedAttempts = validAttempts.filter(
      attempt => !attempt.success && (now.getTime() - attempt.timestamp.getTime()) < this.LOCKOUT_DURATION
    );
    
    if (recentFailedAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
      const oldestFailedAttempt = recentFailedAttempts[0];
      const lockoutExpiresAt = new Date(oldestFailedAttempt.timestamp.getTime() + this.LOCKOUT_DURATION);
      
      return {
        allowed: false,
        message: `Account locked due to too many failed login attempts. Try again after ${lockoutExpiresAt.toLocaleTimeString()}.`,
        lockoutExpiresAt
      };
    }
    
    return {
      allowed: true,
      message: 'Login attempt allowed',
      attemptsRemaining: this.MAX_LOGIN_ATTEMPTS - recentFailedAttempts.length
    };
  }

  /**
   * Record a login attempt
   */
  recordLoginAttempt(username: string, success: boolean, ipAddress?: string): void {
    const attempts = this.loginAttempts.get(username) || [];
    
    attempts.push({
      username,
      timestamp: new Date(),
      success,
      ipAddress
    });
    
    // Keep only recent attempts to prevent memory issues
    const recentAttempts = attempts.slice(-20);
    this.loginAttempts.set(username, recentAttempts);
    
    // Log security event
    console.log(`[SECURITY] Login attempt for ${username}: ${success ? 'SUCCESS' : 'FAILED'} at ${new Date().toISOString()}`);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): PasswordValidation {
    if (!password) {
      return {
        valid: false,
        message: 'Password is required',
        score: 0
      };
    }

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    if (score < 3) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers',
        score
      };
    }

    if (password.length < 8) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters long',
        score
      };
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (weakPasswords.includes(password.toLowerCase())) {
      return {
        valid: false,
        message: 'Password is too common. Please choose a more secure password.',
        score: 1
      };
    }

    return {
      valid: true,
      message: 'Password strength is acceptable',
      score
    };
  }

  /**
   * Update last login time for a user
   */
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ 
          lastLoginAt: new Date(),
          failedLoginAttempts: 0, // Reset failed attempts on successful login
          lockedUntil: null // Clear any lockout
        })
        .where(eq(users.id, userId));
        
      console.log(`[SECURITY] Updated last login for user ${userId}`);
    } catch (error) {
      console.error('[SECURITY] Failed to update last login:', error);
    }
  }

  /**
   * Check if a session is still valid based on activity
   */
  isSessionValid(lastActivity: Date): boolean {
    const now = new Date();
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    return timeSinceActivity < this.SESSION_TIMEOUT;
  }

  /**
   * Get session timeout duration in milliseconds
   */
  getSessionTimeout(): number {
    return this.SESSION_TIMEOUT;
  }

  /**
   * Get login attempt statistics for a user
   */
  getLoginAttemptStats(username: string): {
    totalAttempts: number;
    failedAttempts: number;
    successfulAttempts: number;
    lastAttempt?: Date;
  } {
    const attempts = this.loginAttempts.get(username) || [];
    const now = new Date();
    
    // Only count recent attempts (within lockout period)
    const recentAttempts = attempts.filter(
      attempt => (now.getTime() - attempt.timestamp.getTime()) < this.LOCKOUT_DURATION
    );
    
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    const successfulAttempts = recentAttempts.filter(attempt => attempt.success);
    
    return {
      totalAttempts: recentAttempts.length,
      failedAttempts: failedAttempts.length,
      successfulAttempts: successfulAttempts.length,
      lastAttempt: recentAttempts.length > 0 ? recentAttempts[recentAttempts.length - 1].timestamp : undefined
    };
  }

  /**
   * Clear login attempts for a user (admin function)
   */
  clearLoginAttempts(username: string): void {
    this.loginAttempts.delete(username);
    console.log(`[SECURITY] Cleared login attempts for ${username}`);
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return result;
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: this.getEventSeverity(event)
    };
    
    console.log(`[SECURITY-${logEntry.severity}] ${event}:`, details);
    
    // In production, you would send this to a security monitoring system
    // or store in a dedicated security log table
  }

  private getEventSeverity(event: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const highSeverityEvents = [
      'ACCOUNT_LOCKED', 'MULTIPLE_FAILED_LOGINS', 'SUSPICIOUS_ACTIVITY'
    ];
    
    const mediumSeverityEvents = [
      'FAILED_LOGIN', 'PASSWORD_CHANGE', 'SESSION_EXPIRED'
    ];
    
    if (highSeverityEvents.some(e => event.includes(e))) return 'HIGH';
    if (mediumSeverityEvents.some(e => event.includes(e))) return 'MEDIUM';
    return 'LOW';
  }
}

// Export singleton instance
export const SecurityManager = new SecurityManagerClass();

// Export middleware for session activity tracking
export const updateSessionActivity = (req: any, res: any, next: any) => {
  if (req.session && req.session.user) {
    req.session.lastActivity = new Date();
  }
  next();
};

// Export middleware for security headers
export const securityHeaders = (req: any, res: any, next: any) => {
  // Security headers for enhanced protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS header for HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};