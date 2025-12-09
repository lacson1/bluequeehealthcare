import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { insertAppointmentSchema, appointments, patients, users } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, and, ne, sql } from "drizzle-orm";
import { AuditLogger } from "../audit";

const router = Router();

/**
 * Appointment scheduling and management routes
 * Handles: appointments, availability, reminders, calendar management
 */
export function setupAppointmentRoutes(): Router {
  
  // Get all appointments
  router.get("/appointments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin';
      
      // Allow superadmin to view all appointments, regular users need organization context
      if (!isSuperAdmin && !userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const { date } = req.query;
      
      // Build query - superadmin sees all, others see only their organization
      let query = db.select({
        id: appointments.id,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        doctorId: appointments.doctorId,
        doctorName: users.username,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        notes: appointments.notes,
        priority: appointments.priority,
        startedAt: appointments.startedAt,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id));
      
      // Filter by organization for non-superadmin users
      const allAppointments = await (userOrgId && !isSuperAdmin 
        ? query.where(eq(appointments.organizationId, userOrgId))
        : query
      ).orderBy(appointments.appointmentDate, appointments.appointmentTime);
      
      // Filter by date if provided
      let result = allAppointments;
      if (date && typeof date === 'string') {
        result = allAppointments.filter(appointment => appointment.appointmentDate === date);
      }
      
      // Format the response to match the frontend interface
      const formattedAppointments = result.map(appointment => ({
        id: appointment.id,
        patientId: appointment.patientId,
        patientName: `${appointment.patientName || ''} ${appointment.patientLastName || ''}`.trim(),
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName || 'Unknown Doctor',
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        duration: appointment.duration,
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes,
        priority: appointment.priority,
        startedAt: appointment.startedAt,
      }));

      res.json(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Create appointment
  router.post("/appointments", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Add organization ID from authenticated user
      const appointmentData = {
        ...req.body,
        organizationId: req.user.organizationId
      };

      const validatedData = insertAppointmentSchema.parse(appointmentData);

      // Check for overlapping appointments
      const { appointmentDate, appointmentTime, duration, doctorId } = validatedData;
      
      // Parse the appointment time (HH:MM format)
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + (duration || 30);
      
      // Get all appointments for this doctor on the same date
      const existingAppointments = await db.select()
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, doctorId),
            eq(appointments.appointmentDate, appointmentDate),
            ne(appointments.status, 'cancelled')
          )
        );
      
      // Check for overlaps
      for (const existing of existingAppointments) {
        const [existingHours, existingMinutes] = existing.appointmentTime.split(':').map(Number);
        const existingStart = existingHours * 60 + existingMinutes;
        const existingEnd = existingStart + (existing.duration || 30);
        
        // Check if appointments overlap
        const hasOverlap = (startMinutes < existingEnd) && (endMinutes > existingStart);
        
        if (hasOverlap) {
          return res.status(409).json({ 
            message: "Time slot conflict", 
            error: `This time slot conflicts with an existing appointment at ${existing.appointmentTime}. Please choose a different time.`,
            conflictingAppointment: {
              id: existing.id,
              time: existing.appointmentTime,
              duration: existing.duration
            }
          });
        }
      }

      // No overlap found, create the appointment
      const [appointment] = await db.insert(appointments)
        .values(validatedData)
        .returning();

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction('APPOINTMENT_SCHEDULED', validatedData.patientId, {
        appointmentId: appointment.id,
        doctorId: validatedData.doctorId,
        appointmentDate: validatedData.appointmentDate,
        appointmentTime: validatedData.appointmentTime
      });

      res.json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          details: error.issues 
        });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Get appointment by ID
  router.get("/appointments/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin';

      let whereConditions = [eq(appointments.id, appointmentId)];
      if (userOrgId && !isSuperAdmin) {
        whereConditions.push(eq(appointments.organizationId, userOrgId));
      }

      const [appointment] = await db.select({
        id: appointments.id,
        patientId: appointments.patientId,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`.as('patientName'),
        doctorId: appointments.doctorId,
        doctorName: sql<string>`COALESCE(NULLIF(TRIM(${users.firstName} || ' ' || ${users.lastName}), ''), ${users.username})`.as('doctorName'),
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        notes: appointments.notes,
        priority: appointments.priority,
        startedAt: appointments.startedAt,
        organizationId: appointments.organizationId,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .where(and(...whereConditions))
      .limit(1);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  // Update appointment
  router.patch("/appointments/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const updateData = req.body;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // First check if appointment exists
      const [existingAppointment] = await db.select()
        .from(appointments)
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.organizationId, userOrgId)
        ))
        .limit(1);

      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Update the appointment
      const [updatedAppointment] = await db.update(appointments)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.organizationId, userOrgId)
        ))
        .returning();

      if (!updatedAppointment) {
        return res.status(404).json({ message: "Failed to update appointment" });
      }

      // Log appointment update
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction('APPOINTMENT_UPDATED', updatedAppointment.patientId, {
        appointmentId: updatedAppointment.id,
        changes: updateData
      });

      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Delete appointment
  router.delete("/appointments/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const [deletedAppointment] = await db.delete(appointments)
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.organizationId, userOrgId)
        ))
        .returning();

      if (!deletedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Log appointment deletion
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction('APPOINTMENT_DELETED', deletedAppointment.patientId, {
        appointmentId: deletedAppointment.id
      });

      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Start consultation from appointment
  router.post("/appointments/:id/start-consultation", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Update appointment status to in-progress
      const [updatedAppointment] = await db
        .update(appointments)
        .set({ 
          status: 'in-progress',
          startedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.organizationId, userOrgId)
        ))
        .returning();

      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction("Consultation Started", updatedAppointment.patientId, {
        appointmentId: appointmentId,
        startTime: new Date().toISOString()
      });

      res.json({ 
        message: "Consultation started successfully",
        appointment: updatedAppointment 
      });

    } catch (error) {
      console.error('Error starting consultation:', error);
      res.status(500).json({ message: "Failed to start consultation" });
    }
  });

  // Complete consultation workflow
  router.post("/appointments/:id/complete-consultation", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const { notes, followUpRequired, followUpDate } = req.body;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Update appointment status to completed
      const [updatedAppointment] = await db
        .update(appointments)
        .set({ 
          status: 'completed',
          notes: notes || null,
          updatedAt: new Date()
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.organizationId, userOrgId)
        ))
        .returning();

      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Create follow-up appointment if required
      if (followUpRequired && followUpDate) {
        await db.insert(appointments).values({
          patientId: updatedAppointment.patientId,
          doctorId: updatedAppointment.doctorId,
          appointmentDate: followUpDate,
          appointmentTime: "09:00",
          type: "follow-up",
          status: "scheduled",
          notes: `Follow-up from appointment #${appointmentId}`,
          organizationId: userOrgId
        });
      }

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction("Consultation Completed", updatedAppointment.patientId, {
        appointmentId: appointmentId,
        completionTime: new Date().toISOString(),
        followUpScheduled: followUpRequired || false
      });

      res.json({ 
        message: "Consultation completed successfully",
        appointment: updatedAppointment 
      });

    } catch (error) {
      console.error('Error completing consultation:', error);
      res.status(500).json({ message: "Failed to complete consultation" });
    }
  });

  return router;
}
