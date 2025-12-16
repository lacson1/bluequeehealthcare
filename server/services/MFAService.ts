/**
 * Multi-Factor Authentication (MFA) Service
 * Implements TOTP (Time-based One-Time Password) authentication
 * Industry standard: RFC 6238 (TOTP) and RFC 4226 (HOTP)
 */

import crypto from 'crypto';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Base32 character set for secret encoding
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface MFAVerificationResult {
  valid: boolean;
  message: string;
}

class MFAServiceClass {
  private readonly TOTP_STEP = 30; // Time step in seconds (standard)
  private readonly TOTP_DIGITS = 6; // Number of digits in OTP
  private readonly BACKUP_CODE_COUNT = 10; // Number of backup codes to generate
  
  /**
   * Generate a random base32-encoded secret
   */
  generateSecret(length: number = 20): string {
    const buffer = crypto.randomBytes(length);
    let secret = '';
    for (let i = 0; i < buffer.length; i++) {
      secret += BASE32_CHARS[buffer[i] % 32];
    }
    return secret;
  }

  /**
   * Decode base32 string to buffer
   */
  private base32Decode(encoded: string): Buffer {
    const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = '';
    
    for (const char of cleaned) {
      const val = BASE32_CHARS.indexOf(char);
      bits += val.toString(2).padStart(5, '0');
    }
    
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    
    return Buffer.from(bytes);
  }

  /**
   * Generate TOTP code for a given secret and time
   */
  generateTOTP(secret: string, timestamp?: number): string {
    const time = timestamp || Date.now();
    const counter = Math.floor(time / 1000 / this.TOTP_STEP);
    
    // Convert counter to 8-byte buffer (big-endian)
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));
    
    // Decode the secret
    const key = this.base32Decode(secret);
    
    // Generate HMAC-SHA1
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(counterBuffer);
    const hash = hmac.digest();
    
    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const binary = 
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    
    // Generate OTP
    const otp = binary % Math.pow(10, this.TOTP_DIGITS);
    return otp.toString().padStart(this.TOTP_DIGITS, '0');
  }

  /**
   * Verify a TOTP code with time window tolerance
   */
  verifyTOTP(secret: string, code: string, window: number = 1): boolean {
    const now = Date.now();
    
    // Check current time step and adjacent steps within window
    for (let i = -window; i <= window; i++) {
      const timestamp = now + (i * this.TOTP_STEP * 1000);
      const expectedCode = this.generateTOTP(secret, timestamp);
      
      if (code === expectedCode) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  }

  /**
   * Hash backup codes for secure storage
   */
  hashBackupCodes(codes: string[]): string[] {
    return codes.map(code => 
      crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
    );
  }

  /**
   * Verify a backup code
   */
  verifyBackupCode(code: string, hashedCodes: string[]): boolean {
    const hashedInput = crypto.createHash('sha256')
      .update(code.replace('-', '').toUpperCase())
      .digest('hex');
    return hashedCodes.includes(hashedInput);
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  generateQRCodeUrl(
    secret: string, 
    userEmail: string, 
    issuer: string = 'ClinicConnect'
  ): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(userEmail);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.TOTP_DIGITS}&period=${this.TOTP_STEP}`;
  }

  /**
   * Setup MFA for a user
   */
  async setupMFA(userId: number, email: string): Promise<MFASetupResult> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = this.hashBackupCodes(backupCodes);
    
    // Store the secret and hashed backup codes (not enabled yet until verified)
    await db.update(users)
      .set({
        twoFactorSecret: JSON.stringify({
          secret,
          backupCodes: hashedBackupCodes,
          pendingSetup: true // Will be removed when verified
        }),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return {
      secret,
      qrCodeUrl: this.generateQRCodeUrl(secret, email),
      backupCodes
    };
  }

  /**
   * Verify MFA setup with initial code
   */
  async verifyMFASetup(userId: number, code: string): Promise<MFAVerificationResult> {
    const [user] = await db
      .select({ twoFactorSecret: users.twoFactorSecret })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.twoFactorSecret) {
      return { valid: false, message: 'MFA setup not initiated' };
    }

    try {
      const mfaData = JSON.parse(user.twoFactorSecret);
      
      if (!mfaData.pendingSetup) {
        return { valid: false, message: 'MFA already enabled' };
      }

      const isValid = this.verifyTOTP(mfaData.secret, code);
      
      if (isValid) {
        // Remove pendingSetup flag and enable MFA
        await db.update(users)
          .set({
            twoFactorSecret: JSON.stringify({
              secret: mfaData.secret,
              backupCodes: mfaData.backupCodes
            }),
            twoFactorEnabled: true,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        return { valid: true, message: 'MFA enabled successfully' };
      }

      return { valid: false, message: 'Invalid verification code' };
    } catch (error) {
      console.error('MFA verification error:', error);
      return { valid: false, message: 'MFA verification failed' };
    }
  }

  /**
   * Verify MFA during login
   */
  async verifyMFA(userId: number, code: string): Promise<MFAVerificationResult> {
    const [user] = await db
      .select({ 
        twoFactorSecret: users.twoFactorSecret,
        twoFactorEnabled: users.twoFactorEnabled 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
      return { valid: true, message: 'MFA not enabled' };
    }

    try {
      const mfaData = JSON.parse(user.twoFactorSecret);
      
      // Try TOTP first
      if (this.verifyTOTP(mfaData.secret, code)) {
        return { valid: true, message: 'MFA verified' };
      }

      // Try backup codes
      if (this.verifyBackupCode(code, mfaData.backupCodes)) {
        // Remove used backup code
        const updatedBackupCodes = mfaData.backupCodes.filter((c: string) => 
          c !== crypto.createHash('sha256').update(code.replace('-', '').toUpperCase()).digest('hex')
        );
        
        await db.update(users)
          .set({
            twoFactorSecret: JSON.stringify({
              ...mfaData,
              backupCodes: updatedBackupCodes
            }),
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        return { 
          valid: true, 
          message: `MFA verified with backup code. ${updatedBackupCodes.length} codes remaining.` 
        };
      }

      return { valid: false, message: 'Invalid MFA code' };
    } catch (error) {
      console.error('MFA verification error:', error);
      return { valid: false, message: 'MFA verification failed' };
    }
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: number): Promise<boolean> {
    try {
      await db.update(users)
        .set({
          twoFactorSecret: null,
          twoFactorEnabled: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      return false;
    }
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: number): Promise<boolean> {
    const [user] = await db
      .select({ twoFactorEnabled: users.twoFactorEnabled })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user?.twoFactorEnabled ?? false;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: number): Promise<string[] | null> {
    const [user] = await db
      .select({ twoFactorSecret: users.twoFactorSecret })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.twoFactorSecret) {
      return null;
    }

    try {
      const mfaData = JSON.parse(user.twoFactorSecret);
      const newBackupCodes = this.generateBackupCodes();
      const hashedBackupCodes = this.hashBackupCodes(newBackupCodes);

      await db.update(users)
        .set({
          twoFactorSecret: JSON.stringify({
            ...mfaData,
            backupCodes: hashedBackupCodes
          }),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return newBackupCodes;
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      return null;
    }
  }
}

export const MFAService = new MFAServiceClass();

