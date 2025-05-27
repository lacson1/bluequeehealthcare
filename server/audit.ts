import { Request } from "express";
import { db } from "./db";
import { auditLogs, type InsertAuditLog } from "@shared/schema";
import type { AuthRequest } from "./middleware/auth";

export interface AuditContext {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: Record<string, any>;
  request?: Request;
}

// Audit action constants for consistency
export const AuditActions = {
  // Patient actions
  PATIENT_CREATED: "Patient Created",
  PATIENT_VIEWED: "Patient Viewed",
  PATIENT_UPDATED: "Patient Updated",
  PATIENT_QR_GENERATED: "Patient QR Code Generated",
  
  // Visit actions
  VISIT_CREATED: "Visit Created",
  VISIT_VIEWED: "Visit Viewed",
  VISIT_UPDATED: "Visit Updated",
  
  // Lab result actions
  LAB_RESULT_CREATED: "Lab Result Created",
  LAB_RESULT_VIEWED: "Lab Result Viewed",
  LAB_RESULT_UPDATED: "Lab Result Updated",
  
  // Prescription actions
  PRESCRIPTION_CREATED: "Prescription Created",
  PRESCRIPTION_VIEWED: "Prescription Viewed",
  PRESCRIPTION_UPDATED: "Prescription Updated",
  PRESCRIPTION_DISPENSED: "Prescription Dispensed",
  
  // Medicine actions
  MEDICINE_CREATED: "Medicine Created",
  MEDICINE_UPDATED: "Medicine Updated",
  MEDICINE_STOCK_UPDATED: "Medicine Stock Updated",
  
  // User actions
  USER_LOGIN: "User Login",
  USER_LOGOUT: "User Logout",
  USER_CREATED: "User Created",
  USER_UPDATED: "User Updated",
  USER_PROFILE_VIEWED: "User Profile Viewed",
  USER_PROFILE_UPDATED: "User Profile Updated",
  
  // Referral actions
  REFERRAL_CREATED: "Referral Created",
  REFERRAL_VIEWED: "Referral Viewed",
  REFERRAL_UPDATED: "Referral Updated",
  
  // System actions
  DATA_EXPORT: "Data Export",
  REPORT_GENERATED: "Report Generated",
  SYSTEM_BACKUP: "System Backup"
} as const;

// Entity types for audit logs
export const EntityTypes = {
  PATIENT: "patient",
  VISIT: "visit",
  LAB_RESULT: "lab_result",
  PRESCRIPTION: "prescription",
  MEDICINE: "medicine",
  USER: "user",
  REFERRAL: "referral",
  SYSTEM: "system"
} as const;

/**
 * Create an audit log entry
 */
export async function createAuditLog(context: AuditContext): Promise<void> {
  try {
    const auditData: InsertAuditLog = {
      userId: context.userId,
      action: context.action,
      entityType: context.entityType,
      entityId: context.entityId || null,
      details: context.details ? JSON.stringify(context.details) : null,
      ipAddress: getClientIP(context.request),
      userAgent: context.request?.get('User-Agent') || null
    };

    await db.insert(auditLogs).values(auditData);
    
    console.log(`🔍 AUDIT: ${context.action} by user ${context.userId} on ${context.entityType}${context.entityId ? ` #${context.entityId}` : ''}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid disrupting main operations
  }
}

/**
 * Convenient audit logging for common scenarios
 */
export class AuditLogger {
  constructor(private req: AuthRequest) {}

  private get userId(): number {
    return this.req.user!.id;
  }

  async logPatientAction(action: string, patientId?: number, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.PATIENT,
      entityId: patientId,
      details,
      request: this.req
    });
  }

  async logVisitAction(action: string, visitId?: number, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.VISIT,
      entityId: visitId,
      details,
      request: this.req
    });
  }

  async logLabResultAction(action: string, labResultId?: number, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.LAB_RESULT,
      entityId: labResultId,
      details,
      request: this.req
    });
  }

  async logPrescriptionAction(action: string, prescriptionId?: number, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.PRESCRIPTION,
      entityId: prescriptionId,
      details,
      request: this.req
    });
  }

  async logMedicineAction(action: string, medicineId?: number, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.MEDICINE,
      entityId: medicineId,
      details,
      request: this.req
    });
  }

  async logReferralAction(action: string, referralId?: number, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.REFERRAL,
      entityId: referralId,
      details,
      request: this.req
    });
  }

  async logUserAction(action: string, targetUserId?: number, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.USER,
      entityId: targetUserId,
      details,
      request: this.req
    });
  }

  async logSystemAction(action: string, details?: Record<string, any>) {
    return createAuditLog({
      userId: this.userId,
      action,
      entityType: EntityTypes.SYSTEM,
      details,
      request: this.req
    });
  }
}

/**
 * Extract client IP address from request
 */
function getClientIP(req?: Request): string | null {
  if (!req) return null;
  
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  );
}

/**
 * Middleware to automatically log user login/logout
 */
export function auditMiddleware() {
  return (req: AuthRequest, res: any, next: any) => {
    // Add audit logger to request for easy access
    if (req.user) {
      req.auditLogger = new AuditLogger(req);
    }
    next();
  };
}

// Extend AuthRequest interface to include audit logger
declare global {
  namespace Express {
    interface Request {
      auditLogger?: AuditLogger;
    }
  }
}