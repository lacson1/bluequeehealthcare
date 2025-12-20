import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { telemedicineSessions, patients, users, organizations, appointments } from "@shared/schema";
import { eq, and, gte, isNotNull, sql, desc } from "drizzle-orm";
import { insertTelemedicineSessionSchema } from "@shared/schema";
import { z } from "zod";
import { AuditLogger } from "../audit";
import { logger as routesLogger } from "../lib/logger";

const router = Router();

/**
 * Telemedicine session management routes
 * Handles: session CRUD, notifications, statistics
 */
export function setupTelemedicineRoutes(): Router {
  
  // Get all telemedicine sessions
  router.get("/telemedicine/sessions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const organizationId = req.user?.organizationId;

      // Return empty array if no user context (shouldn't happen due to authenticateToken, but safety check)
      if (!userId) {
        return res.json([]);
      }

      let query = db
        .select({
          id: telemedicineSessions.id,
          patientId: telemedicineSessions.patientId,
          patientName: sql<string>`COALESCE(${patients.firstName} || ' ' || ${patients.lastName}, 'Unknown Patient')`,
          doctorId: telemedicineSessions.doctorId,
          doctorName: sql<string>`COALESCE(NULLIF(TRIM(${users.firstName} || ' ' || ${users.lastName}), ''), ${users.username}, 'Unknown Doctor')`,
          appointmentId: telemedicineSessions.appointmentId,
          scheduledTime: telemedicineSessions.scheduledTime,
          status: telemedicineSessions.status,
          type: telemedicineSessions.type,
          sessionUrl: telemedicineSessions.sessionUrl,
          notes: telemedicineSessions.notes,
          duration: telemedicineSessions.duration,
          createdAt: telemedicineSessions.createdAt,
          completedAt: telemedicineSessions.completedAt
        })
        .from(telemedicineSessions)
        .leftJoin(patients, eq(telemedicineSessions.patientId, patients.id))
        .leftJoin(users, eq(telemedicineSessions.doctorId, users.id))
        .orderBy(desc(telemedicineSessions.scheduledTime));

      // Filter by organization and user role
      const sessionConditions: any[] = [];
      if (organizationId) {
        sessionConditions.push(eq(telemedicineSessions.organizationId, organizationId));
      }
      if (role === 'doctor' && userId) {
        sessionConditions.push(eq(telemedicineSessions.doctorId, userId));
      }

      if (sessionConditions.length > 0) {
        query = (query as any).where(and(...sessionConditions));
      }

      const sessions = await query;
      return res.json(sessions || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Error fetching telemedicine sessions:', {
        error: errorMessage,
        stack: errorStack,
        userId: req.user?.id,
        role: req.user?.role,
        organizationId: req.user?.organizationId
      });
      return res.status(500).json({ 
        message: "Failed to fetch telemedicine sessions",
        error: errorMessage
      });
    }
  });

  // Create telemedicine session
  router.post("/telemedicine/sessions", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const sessionData = insertTelemedicineSessionSchema.parse(req.body);

      // Ensure user is authenticated
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // If appointmentId is provided, fetch appointment and auto-populate fields
      let enrichedData: any = {
        ...sessionData,
        doctorId: req.user.id,
        organizationId: req.user.organizationId,
      };

      if (sessionData.appointmentId) {
        const [appointment] = await db
          .select()
          .from(appointments)
          .where(eq(appointments.id, sessionData.appointmentId))
          .limit(1);

        if (!appointment) {
          return res.status(404).json({ message: "Appointment not found" });
        }

        // Auto-populate from appointment
        enrichedData.patientId = appointment.patientId;
        enrichedData.doctorId = appointment.doctorId || req.user.id;
        
        // Combine appointment date and time into scheduledTime
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
        if (isNaN(appointmentDateTime.getTime())) {
          return res.status(400).json({ message: "Invalid appointment date/time format" });
        }
        enrichedData.scheduledTime = appointmentDateTime;
      } else {
        // Validate required fields for manual scheduling
        if (!sessionData.patientId) {
          return res.status(400).json({ message: "Patient ID is required when not using an appointment" });
        }
        if (!sessionData.scheduledTime) {
          return res.status(400).json({ message: "Scheduled time is required when not using an appointment" });
        }

        // Convert scheduledTime to Date if it's a string
        const scheduledDate = typeof sessionData.scheduledTime === 'string'
          ? new Date(sessionData.scheduledTime)
          : sessionData.scheduledTime;
        
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({ message: "Invalid scheduled time format" });
        }
        
        enrichedData.scheduledTime = scheduledDate;
      }

      // Ensure required fields are present
      if (!enrichedData.patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }
      if (!enrichedData.doctorId) {
        return res.status(400).json({ message: "Doctor ID is required" });
      }
      if (!enrichedData.scheduledTime) {
        return res.status(400).json({ message: "Scheduled time is required" });
      }

      const [newSession] = await db
        .insert(telemedicineSessions)
        .values(enrichedData)
        .returning();

      res.status(201).json(newSession);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('Error creating telemedicine session:', {
        error: errorMessage,
        stack: errorStack,
        body: req.body,
        user: {
          id: req.user?.id,
          role: req.user?.role,
          organizationId: req.user?.organizationId
        }
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          details: error.issues
        });
      }

      // Check for common database errors
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        return res.status(500).json({ 
          message: "Database table does not exist. Please run migrations.",
          error: errorMessage,
          hint: "Run: npm run db:push or npx drizzle-kit push"
        });
      }

      if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
        return res.status(400).json({ 
          message: "Invalid patient or doctor ID",
          error: errorMessage
        });
      }

      return res.status(500).json({ 
        message: "Failed to create telemedicine session",
        error: errorMessage
      });
    }
  });

  // Send telemedicine session notification to patient
  router.post("/telemedicine/sessions/:id/send-notification", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const type = req.body?.type || 'email'; // 'email', 'sms', or 'whatsapp'

      if (isNaN(sessionId)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid session ID" 
        });
      }

      if (!['email', 'sms', 'whatsapp'].includes(type)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid notification type. Must be 'email', 'sms', or 'whatsapp'",
          receivedType: type
        });
      }

      // Get session with patient and doctor details
      const [session] = await db
        .select({
          id: telemedicineSessions.id,
          patientId: telemedicineSessions.patientId,
          doctorId: telemedicineSessions.doctorId,
          scheduledTime: telemedicineSessions.scheduledTime,
          type: telemedicineSessions.type,
          sessionUrl: telemedicineSessions.sessionUrl,
          appointmentId: telemedicineSessions.appointmentId,
        })
        .from(telemedicineSessions)
        .where(eq(telemedicineSessions.id, sessionId))
        .limit(1);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Validate session has required fields
      if (!session.patientId) {
        return res.status(400).json({ message: "Session is missing patient ID" });
      }
      if (!session.doctorId) {
        return res.status(400).json({ message: "Session is missing doctor ID" });
      }

      // Get patient details
      const [patient] = await db
        .select({
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          email: patients.email,
          phone: patients.phone,
        })
        .from(patients)
        .where(eq(patients.id, session.patientId))
        .limit(1);

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Get doctor details
      const [doctor] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        })
        .from(users)
        .where(eq(users.id, session.doctorId))
        .limit(1);

      const doctorName = doctor 
        ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.username
        : 'Your Healthcare Provider';

      const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';

      // Get organization name for email
      const organizationId = req.user?.organizationId;
      let clinicName = 'Your Healthcare Provider';
      if (organizationId) {
        const [org] = await db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1);
        if (org) {
          clinicName = org.name;
        }
      }

      let EmailService;
      try {
        const emailServiceModule = await import('../services/EmailService');
        EmailService = emailServiceModule.EmailService;
        
        if (!EmailService || typeof EmailService !== 'function') {
          routesLogger.error('EmailService is not a valid class');
          return res.status(500).json({
            success: false,
            message: "Email service not available",
            error: "EmailService class not found in module"
          });
        }
      } catch (importError: any) {
        routesLogger.error('Failed to import EmailService', { 
          error: importError?.message,
          stack: importError?.stack 
        });
        return res.status(500).json({
          success: false,
          message: "Email service not available",
          error: "Failed to load email service module",
          details: process.env.NODE_ENV === 'development' ? importError?.message : undefined
        });
      }

      // Handle different notification types
      if (type === 'email') {
        if (!patient.email) {
          return res.status(400).json({ 
            message: "Patient does not have an email address",
            hasEmail: false 
          });
        }

        try {
          if (typeof EmailService.sendTelemedicineNotification !== 'function') {
            return res.status(500).json({
              success: false,
              message: "Email service method not available",
              error: "sendTelemedicineNotification method not found"
            });
          }

          const result = await EmailService.sendTelemedicineNotification({
            patientEmail: patient.email,
            patientName,
            doctorName,
            sessionType: session.type as 'video' | 'audio' | 'chat',
            scheduledTime: new Date(session.scheduledTime),
            sessionUrl: session.sessionUrl || undefined,
            clinicName,
          });

          if (result.success) {
            try {
              const auditLogger = new AuditLogger(req);
              await auditLogger.logPatientAction('TELEMEDICINE_NOTIFICATION_SENT', patient.id, {
                sessionId: session.id,
                type: 'email',
                recipient: patient.email,
              });
            } catch (auditError) {
              console.warn('Failed to log audit trail:', auditError);
            }

            return res.json({
              success: true,
              message: "Notification sent successfully",
              type: 'email',
              recipient: patient.email,
              messageId: result.messageId,
            });
          } else {
            return res.status(500).json({
              success: false,
              message: result.error || "Failed to send notification",
              error: result.error,
            });
          }
        } catch (emailError: any) {
          routesLogger.error('Error sending email notification', {
            error: emailError?.message,
            stack: emailError?.stack,
            sessionId: session.id,
            patientId: patient.id,
          });
          return res.status(500).json({
            success: false,
            message: "Failed to send email notification",
            error: emailError?.message || 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? emailError?.stack : undefined,
          });
        }
      } else if (type === 'sms' || type === 'whatsapp') {
        if (!patient.phone) {
          return res.status(400).json({ 
            message: "Patient does not have a phone number",
            hasPhone: false 
          });
        }

        // SMS and WhatsApp handling would go here
        // For now, return a placeholder response
        return res.status(501).json({
          success: false,
          message: `${type.toUpperCase()} notifications are not yet implemented`,
        });
      } else {
        return res.status(400).json({ message: "Invalid notification type. Use 'email', 'sms', or 'whatsapp'" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      routesLogger.error('Error sending telemedicine notification', {
        error: errorMessage,
        sessionId: req.params.id,
        type: req.body?.type,
        user: {
          id: req.user?.id,
          role: req.user?.role
        }
      });

      return res.status(500).json({ 
        success: false,
        message: "Failed to send notification",
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  });

  // Get telemedicine statistics
  router.get("/telemedicine/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      const organizationId = req.user?.organizationId;

      if (!userId) {
        return res.json({
          totalSessions: 0,
          avgDuration: 0,
          completionRate: 0
        });
      }

      // Build where conditions
      const conditions: any[] = [];
      if (organizationId) {
        conditions.push(eq(telemedicineSessions.organizationId, organizationId));
      }
      if (role === 'doctor' && userId) {
        conditions.push(eq(telemedicineSessions.doctorId, userId));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Total sessions this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const totalSessionsQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(telemedicineSessions);
      
      if (whereClause) {
        totalSessionsQuery.where(and(
          whereClause,
          gte(telemedicineSessions.createdAt, startOfMonth)
        ));
      } else {
        totalSessionsQuery.where(gte(telemedicineSessions.createdAt, startOfMonth));
      }

      const [totalSessionsResult] = await totalSessionsQuery;
      const totalSessions = totalSessionsResult?.count || 0;

      // Average duration (only for completed sessions with duration)
      const avgDurationQuery = db
        .select({ avg: sql<number>`COALESCE(avg(${telemedicineSessions.duration})::int, 0)` })
        .from(telemedicineSessions)
        .where(and(
          whereClause || sql`1=1`,
          eq(telemedicineSessions.status, 'completed'),
          isNotNull(telemedicineSessions.duration)
        ));

      const [avgDurationResult] = await avgDurationQuery;
      const avgDuration = Math.round(avgDurationResult?.avg || 0);

      // Completion rate
      const completedQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(telemedicineSessions);
      
      if (whereClause) {
        completedQuery.where(and(
          whereClause,
          eq(telemedicineSessions.status, 'completed')
        ));
      } else {
        completedQuery.where(eq(telemedicineSessions.status, 'completed'));
      }

      const [completedResult] = await completedQuery;
      const completed = completedResult?.count || 0;

      const totalQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(telemedicineSessions);
      
      if (whereClause) {
        totalQuery.where(whereClause);
      }

      const [totalResult] = await totalQuery;
      const total = totalResult?.count || 0;

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      res.json({
        totalSessions,
        avgDuration,
        completionRate
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching telemedicine statistics:', errorMessage);
      res.status(500).json({ 
        message: "Failed to fetch statistics",
        error: errorMessage
      });
    }
  });

  // Update telemedicine session
  router.patch("/telemedicine/sessions/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updateData = req.body;

      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      // Get existing session to verify ownership
      const [existingSession] = await db
        .select()
        .from(telemedicineSessions)
        .where(eq(telemedicineSessions.id, sessionId))
        .limit(1);

      if (!existingSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Check organization access
      if (req.user?.organizationId && existingSession.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this session" });
      }

      // Update session
      const [updatedSession] = await db
        .update(telemedicineSessions)
        .set(updateData)
        .where(eq(telemedicineSessions.id, sessionId))
        .returning();

      res.json(updatedSession);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating telemedicine session:', errorMessage);
      res.status(500).json({ 
        message: "Failed to update session",
        error: errorMessage
      });
    }
  });

  return router;
}

