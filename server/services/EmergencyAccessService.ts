/**
 * Emergency Access Service ("Break the Glass")
 * Implements HIPAA-compliant emergency access to patient records
 * 
 * Industry Standard: Emergency access allows authorized healthcare providers
 * to access patient records in critical situations even without normal
 * authorization, with full audit logging and review requirements.
 */

import { db } from '../db';
import { users, patients, auditLogs } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { AuditLogger, AuditActions } from '../audit';
import crypto from 'crypto';

// Emergency access types
type EmergencyReason = 
  | 'life_threatening'      // Immediate threat to life
  | 'unconscious_patient'   // Patient cannot provide consent
  | 'public_health'         // Public health emergency
  | 'court_order'           // Legal requirement
  | 'disaster_response'     // Mass casualty or disaster
  | 'other';                // Other documented reason

interface EmergencyAccessRequest {
  userId: number;
  patientId: number;
  reason: EmergencyReason;
  justification: string;
  ipAddress?: string;
  userAgent?: string;
}

interface EmergencyAccessGrant {
  id: string;
  userId: number;
  patientId: number;
  reason: EmergencyReason;
  justification: string;
  grantedAt: Date;
  expiresAt: Date;
  accessToken: string;
  reviewed: boolean;
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNotes?: string;
}

interface EmergencyAccessLog {
  id: string;
  grantId: string;
  action: string;
  resourceType: string;
  resourceId?: number;
  timestamp: Date;
  details?: string;
}

// In-memory store for active emergency access (in production, use Redis or database)
const activeEmergencyAccess = new Map<string, EmergencyAccessGrant>();
const emergencyAccessLogs: EmergencyAccessLog[] = [];

class EmergencyAccessServiceClass {
  // Emergency access configuration
  private readonly ACCESS_DURATION_MINUTES = 60; // 1 hour emergency access window
  private readonly REQUIRED_REVIEW_HOURS = 24; // Must be reviewed within 24 hours
  private readonly ALLOWED_ROLES = ['doctor', 'nurse', 'admin', 'superadmin'];

  /**
   * Request emergency access to a patient's records
   */
  async requestEmergencyAccess(request: EmergencyAccessRequest): Promise<{
    success: boolean;
    grant?: EmergencyAccessGrant;
    message: string;
  }> {
    try {
      // Verify user exists and has appropriate role
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!this.ALLOWED_ROLES.includes(user.role)) {
        return { 
          success: false, 
          message: 'Your role is not authorized for emergency access' 
        };
      }

      // Verify patient exists
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, request.patientId))
        .limit(1);

      if (!patient) {
        return { success: false, message: 'Patient not found' };
      }

      // Check for existing active emergency access
      const existingAccess = this.getActiveAccess(request.userId, request.patientId);
      if (existingAccess) {
        return {
          success: true,
          grant: existingAccess,
          message: 'Emergency access already active'
        };
      }

      // Validate justification
      if (!request.justification || request.justification.length < 20) {
        return { 
          success: false, 
          message: 'Detailed justification is required (minimum 20 characters)' 
        };
      }

      // Create emergency access grant
      const grant: EmergencyAccessGrant = {
        id: crypto.randomUUID(),
        userId: request.userId,
        patientId: request.patientId,
        reason: request.reason,
        justification: request.justification,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + this.ACCESS_DURATION_MINUTES * 60 * 1000),
        accessToken: crypto.randomBytes(32).toString('hex'),
        reviewed: false
      };

      // Store the grant
      activeEmergencyAccess.set(grant.id, grant);

      // Log the emergency access grant - using detailed audit logging
      await AuditLogger.log({
        userId: request.userId,
        action: 'EMERGENCY_ACCESS_GRANTED',
        entityType: 'patient',
        entityId: request.patientId,
        details: JSON.stringify({
          grantId: grant.id,
          reason: request.reason,
          justification: request.justification,
          expiresAt: grant.expiresAt.toISOString(),
          patientName: `${patient.firstName} ${patient.lastName}`
        }),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      // Log to emergency access log
      this.logEmergencyAction(grant.id, 'ACCESS_GRANTED', 'patient', request.patientId, {
        reason: request.reason,
        justification: request.justification
      });

      // TODO: Send notification to compliance officer / supervisor
      console.log(`[EMERGENCY ACCESS] User ${user.username} granted emergency access to patient ${patient.firstName} ${patient.lastName}`);

      return {
        success: true,
        grant,
        message: `Emergency access granted for ${this.ACCESS_DURATION_MINUTES} minutes. This access will be audited.`
      };
    } catch (error) {
      console.error('[EMERGENCY ACCESS] Failed to grant access:', error);
      return { success: false, message: 'Failed to process emergency access request' };
    }
  }

  /**
   * Verify emergency access token
   */
  verifyAccess(userId: number, patientId: number, token?: string): boolean {
    const grant = this.getActiveAccess(userId, patientId);
    
    if (!grant) {
      return false;
    }

    // Check if expired
    if (new Date() > grant.expiresAt) {
      activeEmergencyAccess.delete(grant.id);
      return false;
    }

    // Verify token if provided
    if (token && grant.accessToken !== token) {
      return false;
    }

    return true;
  }

  /**
   * Get active emergency access for a user-patient pair
   */
  getActiveAccess(userId: number, patientId: number): EmergencyAccessGrant | undefined {
    for (const grant of activeEmergencyAccess.values()) {
      if (grant.userId === userId && 
          grant.patientId === patientId && 
          new Date() < grant.expiresAt) {
        return grant;
      }
    }
    return undefined;
  }

  /**
   * Revoke emergency access
   */
  async revokeAccess(grantId: string, revokedBy: number, reason: string): Promise<boolean> {
    const grant = activeEmergencyAccess.get(grantId);
    
    if (!grant) {
      return false;
    }

    activeEmergencyAccess.delete(grantId);

    // Log the revocation
    await AuditLogger.log({
      userId: revokedBy,
      action: 'EMERGENCY_ACCESS_REVOKED',
      entityType: 'patient',
      entityId: grant.patientId,
      details: JSON.stringify({
        grantId,
        originalUserId: grant.userId,
        reason,
        accessDuration: Math.round((Date.now() - grant.grantedAt.getTime()) / 60000) + ' minutes'
      })
    });

    this.logEmergencyAction(grantId, 'ACCESS_REVOKED', 'patient', grant.patientId, { reason });

    return true;
  }

  /**
   * Log an action taken under emergency access
   */
  logEmergencyAction(
    grantId: string, 
    action: string, 
    resourceType: string, 
    resourceId?: number,
    details?: any
  ): void {
    const log: EmergencyAccessLog = {
      id: crypto.randomUUID(),
      grantId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date(),
      details: details ? JSON.stringify(details) : undefined
    };

    emergencyAccessLogs.push(log);

    // Keep only last 10,000 logs in memory
    if (emergencyAccessLogs.length > 10000) {
      emergencyAccessLogs.shift();
    }
  }

  /**
   * Get all emergency access records pending review
   */
  getPendingReviews(): EmergencyAccessGrant[] {
    const pending: EmergencyAccessGrant[] = [];
    
    for (const grant of activeEmergencyAccess.values()) {
      if (!grant.reviewed) {
        pending.push(grant);
      }
    }

    return pending.sort((a, b) => a.grantedAt.getTime() - b.grantedAt.getTime());
  }

  /**
   * Review and document emergency access usage
   */
  async reviewAccess(
    grantId: string,
    reviewerId: number,
    approved: boolean,
    notes: string
  ): Promise<boolean> {
    const grant = activeEmergencyAccess.get(grantId);
    
    if (!grant) {
      return false;
    }

    grant.reviewed = true;
    grant.reviewedBy = reviewerId;
    grant.reviewedAt = new Date();
    grant.reviewNotes = notes;

    // Log the review
    await AuditLogger.log({
      userId: reviewerId,
      action: approved ? 'EMERGENCY_ACCESS_APPROVED' : 'EMERGENCY_ACCESS_FLAGGED',
      entityType: 'patient',
      entityId: grant.patientId,
      details: JSON.stringify({
        grantId,
        originalUserId: grant.userId,
        reason: grant.reason,
        approved,
        notes
      })
    });

    this.logEmergencyAction(grantId, 'ACCESS_REVIEWED', 'grant', undefined, {
      approved,
      reviewerId,
      notes
    });

    return true;
  }

  /**
   * Get emergency access logs for a specific grant
   */
  getAccessLogs(grantId: string): EmergencyAccessLog[] {
    return emergencyAccessLogs
      .filter(log => log.grantId === grantId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get all emergency access grants for a patient
   */
  getPatientEmergencyHistory(patientId: number): EmergencyAccessGrant[] {
    const history: EmergencyAccessGrant[] = [];
    
    for (const grant of activeEmergencyAccess.values()) {
      if (grant.patientId === patientId) {
        history.push(grant);
      }
    }

    return history.sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
  }

  /**
   * Get emergency access statistics for compliance reporting
   */
  getComplianceStats(): {
    activeGrants: number;
    pendingReviews: number;
    grantsToday: number;
    grantsThisWeek: number;
    overdueReviews: number;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const reviewDeadline = new Date(now.getTime() - this.REQUIRED_REVIEW_HOURS * 60 * 60 * 1000);

    let activeGrants = 0;
    let pendingReviews = 0;
    let grantsToday = 0;
    let grantsThisWeek = 0;
    let overdueReviews = 0;

    for (const grant of activeEmergencyAccess.values()) {
      if (new Date() < grant.expiresAt) {
        activeGrants++;
      }

      if (!grant.reviewed) {
        pendingReviews++;
        
        if (grant.grantedAt < reviewDeadline) {
          overdueReviews++;
        }
      }

      if (grant.grantedAt >= today) {
        grantsToday++;
      }

      if (grant.grantedAt >= weekAgo) {
        grantsThisWeek++;
      }
    }

    return {
      activeGrants,
      pendingReviews,
      grantsToday,
      grantsThisWeek,
      overdueReviews
    };
  }

  /**
   * Clean up expired grants (run periodically)
   */
  cleanupExpiredGrants(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, grant] of activeEmergencyAccess.entries()) {
      // Keep reviewed grants for 7 days, unreviewed for 30 days
      const retentionDays = grant.reviewed ? 7 : 30;
      const expirationDate = new Date(grant.expiresAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
      
      if (now > expirationDate) {
        activeEmergencyAccess.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get emergency access reasons for UI
   */
  getEmergencyReasons(): { value: EmergencyReason; label: string; description: string }[] {
    return [
      {
        value: 'life_threatening',
        label: 'Life-Threatening Emergency',
        description: 'Immediate threat to patient life requiring urgent intervention'
      },
      {
        value: 'unconscious_patient',
        label: 'Unconscious/Incapacitated Patient',
        description: 'Patient unable to provide consent due to medical condition'
      },
      {
        value: 'public_health',
        label: 'Public Health Emergency',
        description: 'Access required for public health investigation or outbreak response'
      },
      {
        value: 'court_order',
        label: 'Court Order/Legal Requirement',
        description: 'Access mandated by legal authority'
      },
      {
        value: 'disaster_response',
        label: 'Disaster Response',
        description: 'Mass casualty event or disaster requiring expedited care'
      },
      {
        value: 'other',
        label: 'Other Documented Reason',
        description: 'Other legitimate emergency requiring detailed justification'
      }
    ];
  }
}

export const EmergencyAccessService = new EmergencyAccessServiceClass();

