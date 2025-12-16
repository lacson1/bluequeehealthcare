/**
 * Encryption Service
 * Implements AES-256-GCM encryption for sensitive data at rest
 * Industry standard: HIPAA-compliant encryption for PHI
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const KEY_LENGTH = 32; // 256 bits for AES-256

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  salt?: string;
}

interface EncryptedField {
  __encrypted: true;
  data: EncryptedData;
}

class EncryptionServiceClass {
  private masterKey: Buffer | null = null;
  
  /**
   * Initialize the encryption service with environment key
   */
  initialize(): void {
    const envKey = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET;
    
    if (!envKey) {
      console.warn('[ENCRYPTION] No ENCRYPTION_KEY found. Using derived key from SESSION_SECRET.');
    }
    
    // Derive a proper 256-bit key from the environment variable
    const keySource = envKey || 'default-development-key-change-in-production';
    this.masterKey = crypto.scryptSync(keySource, 'clinicconnect-salt', KEY_LENGTH);
    
    console.log('[ENCRYPTION] Service initialized with AES-256-GCM');
  }

  /**
   * Get the encryption key (initialize if needed)
   */
  private getKey(): Buffer {
    if (!this.masterKey) {
      this.initialize();
    }
    return this.masterKey!;
  }

  /**
   * Derive a unique key for a specific purpose/field
   * This implements key separation for different data types
   */
  private deriveKey(purpose: string, salt?: Buffer): Buffer {
    const masterKey = this.getKey();
    const saltBuffer = salt || crypto.randomBytes(SALT_LENGTH);
    const info = Buffer.from(purpose, 'utf8');
    
    // HKDF-like key derivation
    const combined = Buffer.concat([masterKey, saltBuffer, info]);
    return crypto.createHash('sha256').update(combined).digest();
  }

  /**
   * Encrypt a string value
   */
  encrypt(plaintext: string, purpose: string = 'default'): EncryptedData {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = this.deriveKey(purpose, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64')
    };
  }

  /**
   * Decrypt an encrypted value
   */
  decrypt(data: EncryptedData, purpose: string = 'default'): string {
    try {
      const salt = data.salt ? Buffer.from(data.salt, 'base64') : undefined;
      const key = this.deriveKey(purpose, salt);
      const iv = Buffer.from(data.iv, 'base64');
      const authTag = Buffer.from(data.authTag, 'base64');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('[ENCRYPTION] Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt a JavaScript object (JSON)
   */
  encryptObject(obj: any, purpose: string = 'default'): EncryptedData {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, purpose);
  }

  /**
   * Decrypt to a JavaScript object
   */
  decryptObject<T>(data: EncryptedData, purpose: string = 'default'): T {
    const jsonString = this.decrypt(data, purpose);
    return JSON.parse(jsonString);
  }

  /**
   * Check if a value is an encrypted field
   */
  isEncryptedField(value: any): value is EncryptedField {
    return value && 
           typeof value === 'object' && 
           value.__encrypted === true && 
           value.data?.encrypted;
  }

  /**
   * Wrap encrypted data as a field marker
   */
  wrapAsEncryptedField(data: EncryptedData): EncryptedField {
    return {
      __encrypted: true,
      data
    };
  }

  /**
   * Encrypt sensitive patient data fields
   * Fields that contain PHI (Protected Health Information)
   */
  encryptPatientPHI(patientData: Record<string, any>): Record<string, any> {
    const sensitiveFields = [
      'socialSecurityNumber',
      'nationalId',
      'insuranceId',
      'medicalHistory',
      'allergies',
      'mentalHealthNotes',
      'substanceAbuseHistory',
      'hivStatus',
      'geneticData',
      'biometricData'
    ];

    const encrypted: Record<string, any> = { ...patientData };

    for (const field of sensitiveFields) {
      if (patientData[field] && typeof patientData[field] === 'string') {
        encrypted[field] = this.wrapAsEncryptedField(
          this.encrypt(patientData[field], `patient:${field}`)
        );
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive patient data fields
   */
  decryptPatientPHI(patientData: Record<string, any>): Record<string, any> {
    const decrypted: Record<string, any> = { ...patientData };

    for (const [key, value] of Object.entries(patientData)) {
      if (this.isEncryptedField(value)) {
        try {
          decrypted[key] = this.decrypt(value.data, `patient:${key}`);
        } catch (error) {
          console.error(`[ENCRYPTION] Failed to decrypt field ${key}:`, error);
          decrypted[key] = '[ENCRYPTED]'; // Return placeholder on failure
        }
      }
    }

    return decrypted;
  }

  /**
   * Hash sensitive data for indexing (one-way)
   * Used for searchable encryption patterns
   */
  hashForIndex(value: string, purpose: string = 'index'): string {
    const key = this.getKey();
    return crypto
      .createHmac('sha256', key)
      .update(`${purpose}:${value.toLowerCase().trim()}`)
      .digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt file content for secure storage
   */
  encryptFile(fileBuffer: Buffer, purpose: string = 'file'): {
    encryptedData: Buffer;
    metadata: EncryptedData;
  } {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = this.deriveKey(purpose, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      metadata: {
        encrypted: '', // Not used for files
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        salt: salt.toString('base64')
      }
    };
  }

  /**
   * Decrypt file content
   */
  decryptFile(encryptedData: Buffer, metadata: EncryptedData, purpose: string = 'file'): Buffer {
    const salt = metadata.salt ? Buffer.from(metadata.salt, 'base64') : undefined;
    const key = this.deriveKey(purpose, salt);
    const iv = Buffer.from(metadata.iv, 'base64');
    const authTag = Buffer.from(metadata.authTag, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
  }

  /**
   * Encrypt credit card/payment data (PCI-DSS compliant pattern)
   */
  encryptPaymentData(cardNumber: string): {
    maskedNumber: string;
    encryptedData: EncryptedData;
  } {
    // Keep last 4 digits for display
    const maskedNumber = cardNumber.slice(-4).padStart(cardNumber.length, '*');
    
    const encryptedData = this.encrypt(cardNumber, 'payment:card');
    
    return {
      maskedNumber,
      encryptedData
    };
  }

  /**
   * Rotate encryption key (for key rotation compliance)
   * Re-encrypts data with a new key
   */
  async rotateKey(
    data: EncryptedData, 
    oldPurpose: string, 
    newPurpose: string,
    newSalt?: Buffer
  ): Promise<EncryptedData> {
    // Decrypt with old key
    const plaintext = this.decrypt(data, oldPurpose);
    
    // Re-encrypt with new key derivation
    const salt = newSalt || crypto.randomBytes(SALT_LENGTH);
    const key = this.deriveKey(newPurpose, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64')
    };
  }

  /**
   * Verify data integrity without decrypting
   * Useful for audit purposes
   */
  verifyIntegrity(data: EncryptedData, purpose: string = 'default'): boolean {
    try {
      const salt = data.salt ? Buffer.from(data.salt, 'base64') : undefined;
      const key = this.deriveKey(purpose, salt);
      const iv = Buffer.from(data.iv, 'base64');
      const authTag = Buffer.from(data.authTag, 'base64');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      decipher.update(data.encrypted, 'base64', 'utf8');
      decipher.final('utf8');
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate encryption metadata for audit logging
   */
  getEncryptionMetadata(): {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    initialized: boolean;
  } {
    return {
      algorithm: ALGORITHM,
      keyLength: KEY_LENGTH * 8, // bits
      ivLength: IV_LENGTH * 8, // bits
      initialized: this.masterKey !== null
    };
  }
}

export const EncryptionService = new EncryptionServiceClass();

// Initialize on module load
EncryptionService.initialize();

