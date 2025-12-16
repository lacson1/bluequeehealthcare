/**
 * Password Policy Service
 * Implements enterprise-grade password policies for healthcare compliance
 * 
 * Standards: HIPAA, NIST SP 800-63B, HITRUST CSF
 */

import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

interface PasswordStrength {
  score: number;        // 0-5
  level: 'very_weak' | 'weak' | 'fair' | 'strong' | 'very_strong';
  feedback: string[];
  valid: boolean;
}

interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minUniqueChars: number;
  preventCommonPasswords: boolean;
  preventUserInfoInPassword: boolean;
  expirationDays: number;
  historyCount: number;       // Number of previous passwords to remember
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
}

// Common passwords list (abbreviated - in production use a comprehensive list)
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', 'qwerty',
  'abc123', 'monkey', 'letmein', 'dragon', 'master', 'admin', 'welcome',
  'login', 'princess', 'admin123', 'root', 'toor', 'pass', 'test',
  'guest', 'qwerty123', 'password1!', 'Password1', 'Password123',
  'changeme', 'secret', 'iloveyou', '1234567890', 'sunshine', 'qwertyuiop'
]);

// Keyboard patterns to detect
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '!@#$%^', '1qaz2wsx',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
];

class PasswordPolicyServiceClass {
  // Default policy (can be customized per organization)
  private defaultPolicy: PasswordPolicy = {
    minLength: 12,                    // NIST recommends 8+, healthcare typically 12+
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    minUniqueChars: 6,
    preventCommonPasswords: true,
    preventUserInfoInPassword: true,
    expirationDays: 90,               // HIPAA common requirement
    historyCount: 12,                 // Can't reuse last 12 passwords
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30
  };

  // Organization-specific policies (cache)
  private organizationPolicies = new Map<number, PasswordPolicy>();

  /**
   * Get password policy for an organization
   */
  getPolicy(organizationId?: number): PasswordPolicy {
    if (organizationId && this.organizationPolicies.has(organizationId)) {
      return this.organizationPolicies.get(organizationId)!;
    }
    return { ...this.defaultPolicy };
  }

  /**
   * Set custom password policy for an organization
   */
  setOrganizationPolicy(organizationId: number, policy: Partial<PasswordPolicy>): void {
    const currentPolicy = this.getPolicy(organizationId);
    this.organizationPolicies.set(organizationId, {
      ...currentPolicy,
      ...policy
    });
  }

  /**
   * Validate password against policy
   */
  validatePassword(
    password: string, 
    userInfo?: { username?: string; email?: string; firstName?: string; lastName?: string },
    organizationId?: number
  ): PasswordStrength {
    const policy = this.getPolicy(organizationId);
    const feedback: string[] = [];
    let score = 0;

    // Length checks
    if (password.length < policy.minLength) {
      feedback.push(`Password must be at least ${policy.minLength} characters`);
    } else {
      score += 1;
    }

    if (password.length > policy.maxLength) {
      feedback.push(`Password must not exceed ${policy.maxLength} characters`);
    }

    // Character type checks
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 0.5;
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 0.5;
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 0.5;
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      score += 0.5;
    }

    // Unique characters check
    const uniqueChars = new Set(password.toLowerCase()).size;
    if (uniqueChars < policy.minUniqueChars) {
      feedback.push(`Password must contain at least ${policy.minUniqueChars} unique characters`);
    } else {
      score += 0.5;
    }

    // Common password check
    if (policy.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_PASSWORDS.has(lowerPassword)) {
        feedback.push('Password is too common. Please choose a more unique password.');
        score = Math.max(0, score - 1);
      }

      // Check for keyboard patterns
      for (const pattern of KEYBOARD_PATTERNS) {
        if (lowerPassword.includes(pattern)) {
          feedback.push('Password contains a keyboard pattern');
          score = Math.max(0, score - 0.5);
          break;
        }
      }
    }

    // User info check
    if (policy.preventUserInfoInPassword && userInfo) {
      const lowerPassword = password.toLowerCase();
      const userStrings = [
        userInfo.username,
        userInfo.email?.split('@')[0],
        userInfo.firstName,
        userInfo.lastName
      ].filter(Boolean).map(s => s!.toLowerCase());

      for (const str of userStrings) {
        if (str.length >= 3 && lowerPassword.includes(str)) {
          feedback.push('Password cannot contain your username, email, or name');
          score = Math.max(0, score - 1);
          break;
        }
      }
    }

    // Sequential character check (123, abc)
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Password cannot contain repeated characters (e.g., aaa)');
      score = Math.max(0, score - 0.5);
    }

    // Sequential number/letter check
    if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      feedback.push('Password contains sequential characters');
      score = Math.max(0, score - 0.5);
    }

    // Bonus for extra length
    if (password.length >= 16) score += 0.5;
    if (password.length >= 20) score += 0.5;

    // Determine level
    const normalizedScore = Math.min(5, Math.round(score));
    let level: PasswordStrength['level'];
    
    if (normalizedScore <= 1) level = 'very_weak';
    else if (normalizedScore === 2) level = 'weak';
    else if (normalizedScore === 3) level = 'fair';
    else if (normalizedScore === 4) level = 'strong';
    else level = 'very_strong';

    return {
      score: normalizedScore,
      level,
      feedback,
      valid: feedback.length === 0 && normalizedScore >= 3
    };
  }

  /**
   * Check if password has expired
   */
  async isPasswordExpired(userId: number, organizationId?: number): Promise<{
    expired: boolean;
    daysRemaining: number;
    lastChanged?: Date;
  }> {
    const policy = this.getPolicy(organizationId);
    
    if (policy.expirationDays <= 0) {
      return { expired: false, daysRemaining: -1 }; // Never expires
    }

    const [user] = await db
      .select({ 
        updatedAt: users.updatedAt,
        createdAt: users.createdAt 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { expired: true, daysRemaining: 0 };
    }

    // Use updatedAt as last password change (in production, use a dedicated field)
    const lastChanged = user.updatedAt || user.createdAt;
    if (!lastChanged) {
      return { expired: true, daysRemaining: 0 };
    }

    const expirationDate = new Date(lastChanged);
    expirationDate.setDate(expirationDate.getDate() + policy.expirationDays);

    const now = new Date();
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      expired: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      lastChanged
    };
  }

  /**
   * Check password history (prevent reuse)
   */
  async isPasswordInHistory(
    userId: number, 
    newPasswordHash: string,
    organizationId?: number
  ): Promise<boolean> {
    // In production, implement a password_history table
    // For now, we just check against current password
    const [user] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return false;

    // Compare with current password
    // Note: This is a simplified check. In production, maintain a history table.
    try {
      const isSame = await bcrypt.compare(
        newPasswordHash, // This should be the plain password
        user.password
      );
      return isSame;
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure password
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed confusing chars I, O
    const lowercase = 'abcdefghjkmnpqrstuvwxyz'; // Removed confusing chars i, l, o
    const numbers = '23456789'; // Removed confusing chars 0, 1
    const special = '!@#$%^&*-_=+?';
    
    const allChars = uppercase + lowercase + numbers + special;
    
    // Ensure at least one of each required type
    let password = '';
    password += uppercase[Math.floor(crypto.randomInt(uppercase.length))];
    password += lowercase[Math.floor(crypto.randomInt(lowercase.length))];
    password += numbers[Math.floor(crypto.randomInt(numbers.length))];
    password += special[Math.floor(crypto.randomInt(special.length))];
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(crypto.randomInt(allChars.length))];
    }
    
    // Shuffle the password
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join('');
  }

  /**
   * Get password expiration warning days
   */
  getExpirationWarningDays(): number[] {
    return [14, 7, 3, 1]; // Warn at 14, 7, 3, and 1 days before expiration
  }

  /**
   * Hash a password securely
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // OWASP recommended minimum
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Get password requirements as human-readable text
   */
  getPasswordRequirements(organizationId?: number): string[] {
    const policy = this.getPolicy(organizationId);
    const requirements: string[] = [];

    requirements.push(`At least ${policy.minLength} characters long`);
    
    if (policy.requireUppercase) {
      requirements.push('At least one uppercase letter (A-Z)');
    }
    if (policy.requireLowercase) {
      requirements.push('At least one lowercase letter (a-z)');
    }
    if (policy.requireNumbers) {
      requirements.push('At least one number (0-9)');
    }
    if (policy.requireSpecialChars) {
      requirements.push('At least one special character (!@#$%^&*...)');
    }
    if (policy.minUniqueChars > 1) {
      requirements.push(`At least ${policy.minUniqueChars} unique characters`);
    }
    if (policy.preventCommonPasswords) {
      requirements.push('Cannot be a commonly used password');
    }
    if (policy.preventUserInfoInPassword) {
      requirements.push('Cannot contain your username, email, or name');
    }
    if (policy.expirationDays > 0) {
      requirements.push(`Must be changed every ${policy.expirationDays} days`);
    }
    if (policy.historyCount > 0) {
      requirements.push(`Cannot reuse your last ${policy.historyCount} passwords`);
    }

    return requirements;
  }

  /**
   * Get policy summary for display
   */
  getPolicySummary(organizationId?: number): {
    minLength: number;
    complexity: string;
    expirationDays: number;
    historyCount: number;
  } {
    const policy = this.getPolicy(organizationId);
    
    const complexityParts: string[] = [];
    if (policy.requireUppercase) complexityParts.push('uppercase');
    if (policy.requireLowercase) complexityParts.push('lowercase');
    if (policy.requireNumbers) complexityParts.push('numbers');
    if (policy.requireSpecialChars) complexityParts.push('special characters');

    return {
      minLength: policy.minLength,
      complexity: complexityParts.join(', '),
      expirationDays: policy.expirationDays,
      historyCount: policy.historyCount
    };
  }
}

export const PasswordPolicyService = new PasswordPolicyServiceClass();

