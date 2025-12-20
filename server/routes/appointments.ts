import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { insertAppointmentSchema, appointments, patients, users, type InsertAppointment, availabilitySlots, blackoutDates, appointmentReminders } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, asc, and, ne, sql, inArray } from "drizzle-orm";
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

      // Use AppointmentService to get appointments
      const { AppointmentService } = await import("../services/AppointmentService");
      const allAppointments = await AppointmentService.getAppointments({
        organizationId: userOrgId,
        date: date as string | undefined,
        isSuperAdmin
      });

      res.json(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({
        message: "Failed to fetch appointments",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create appointment
  router.post("/appointments", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      // Add organization ID from authenticated user, default to 1 if not set
      const appointmentData = {
        ...req.body,
        organizationId: req.user?.organizationId || 1 // Default to organization 1 if not set
      };

      // Use AppointmentService to create appointment (handles conflict checking)
      const { AppointmentService } = await import("../services/AppointmentService");
      const appointment = await AppointmentService.createAppointment(appointmentData);

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction('APPOINTMENT_SCHEDULED', appointment.patientId, {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime
      });

      res.json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          details: error.issues
        });
      } else if (error instanceof Error) {
        if (error.message.includes('Time slot conflict')) {
          return res.status(409).json({
            message: "Time slot conflict",
            error: error.message
          });
        }
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Get appointment by ID
  router.get("/appointments/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const appointmentId = Number.parseInt(req.params.id, 10);
      const userOrgId = req.user?.organizationId;
      const isSuperAdmin = req.user?.role === 'superadmin';

      // Use AppointmentService to get appointment
      const { AppointmentService } = await import("../services/AppointmentService");
      const appointment = await AppointmentService.getAppointmentById(
        appointmentId,
        isSuperAdmin ? undefined : userOrgId
      );

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
      const appointmentId = Number.parseInt(req.params.id, 10);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Validate update data - only allow valid appointment fields
      const allowedFields = ['appointmentDate', 'appointmentTime', 'duration', 'type', 'status', 'notes', 'priority', 'patientId', 'doctorId', 'organizationId'] as const;
      const filteredUpdateData: Partial<Record<typeof allowedFields[number], unknown>> = {};
      for (const key of allowedFields) {
        if (key in req.body && req.body[key] !== undefined) {
          filteredUpdateData[key] = req.body[key];
        }
      }

      // Use AppointmentService to update appointment
      const { AppointmentService } = await import("../services/AppointmentService");
      const updatedAppointment = await AppointmentService.updateAppointment(
        appointmentId,
        filteredUpdateData,
        userOrgId
      );

      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Log appointment update
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction('APPOINTMENT_UPDATED', updatedAppointment.patientId, {
        appointmentId: updatedAppointment.id,
        changes: filteredUpdateData
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
      const appointmentId = Number.parseInt(req.params.id, 10);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Use AppointmentService to delete appointment
      const { AppointmentService } = await import("../services/AppointmentService");
      const deletedAppointment = await AppointmentService.deleteAppointment(appointmentId, userOrgId);

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
      const appointmentId = Number.parseInt(req.params.id, 10);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Use AppointmentService to start consultation
      const { AppointmentService } = await import("../services/AppointmentService");
      const updatedAppointment = await AppointmentService.startConsultation(appointmentId, userOrgId);

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
      const appointmentId = Number.parseInt(req.params.id, 10);
      const userOrgId = req.user?.organizationId;
      const { notes, followUpRequired, followUpDate } = req.body;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Use AppointmentService to complete consultation
      const { AppointmentService } = await import("../services/AppointmentService");
      const followUpData = followUpRequired && followUpDate ? {
        date: followUpDate,
        time: "09:00"
      } : undefined;

      const updatedAppointment = await AppointmentService.completeConsultation(
        appointmentId,
        userOrgId,
        notes,
        followUpData
      );

      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
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

  // =====================
  // AVAILABILITY SLOTS ROUTES
  // =====================

  // Get availability slots
  router.get("/availability-slots", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { doctorId } = req.query;
      const slotConditions = [
        eq(availabilitySlots.organizationId, req.user!.organizationId!)
      ];

      if (doctorId) {
        slotConditions.push(eq(availabilitySlots.doctorId, parseInt(doctorId as string)));
      }

      let query = db.select({
        id: availabilitySlots.id,
        doctorId: availabilitySlots.doctorId,
        dayOfWeek: availabilitySlots.dayOfWeek,
        startTime: availabilitySlots.startTime,
        endTime: availabilitySlots.endTime,
        slotDuration: availabilitySlots.slotDuration,
        isActive: availabilitySlots.isActive,
        doctorName: users.username
      })
        .from(availabilitySlots)
        .leftJoin(users, eq(availabilitySlots.doctorId, users.id))
        .where(and(...slotConditions));

      const slots = await query;
      return res.json(slots);
    } catch (error) {
      console.error('Error fetching availability slots:', error);
      return res.status(500).json({ message: "Failed to fetch availability slots" });
    }
  });

  // Create availability slot
  router.post("/availability-slots", authenticateToken, requireAnyRole(['doctor', 'admin']), async (req: AuthRequest, res) => {
    try {
      const slotData = {
        ...req.body,
        organizationId: req.user!.organizationId,
        doctorId: req.body.doctorId || req.user!.id
      };

      const [newSlot] = await db
        .insert(availabilitySlots)
        .values(slotData)
        .returning();

      res.json(newSlot);
    } catch (error) {
      console.error('Error creating availability slot:', error);
      return res.status(500).json({ message: "Failed to create availability slot" });
    }
  });

  // =====================
  // BLACKOUT DATES ROUTES
  // =====================

  // Get blackout dates
  router.get("/blackout-dates", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { doctorId } = req.query;
      const dateConditions = [
        eq(blackoutDates.organizationId, req.user!.organizationId!)
      ];

      if (doctorId) {
        dateConditions.push(eq(blackoutDates.doctorId, parseInt(doctorId as string)));
      }

      const dates = await db
        .select()
        .from(blackoutDates)
        .where(and(...dateConditions))
        .orderBy(asc(blackoutDates.date));

      return res.json(dates);
    } catch (error) {
      console.error('Error fetching blackout dates:', error);
      return res.status(500).json({ message: "Failed to fetch blackout dates" });
    }
  });

  // Create blackout date
  router.post("/blackout-dates", authenticateToken, requireAnyRole(['doctor', 'admin']), async (req: AuthRequest, res) => {
    try {
      const dateData = {
        ...req.body,
        organizationId: req.user!.organizationId,
        doctorId: req.body.doctorId || req.user!.id
      };

      const [newDate] = await db
        .insert(blackoutDates)
        .values(dateData)
        .returning();

      res.json(newDate);
    } catch (error) {
      console.error('Error creating blackout date:', error);
      return res.status(500).json({ message: "Failed to create blackout date" });
    }
  });

  // =====================
  // APPOINTMENT REMINDERS ROUTES
  // =====================

  // Get appointment reminders
  router.get("/appointment-reminders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { appointmentId } = req.query;
      let query = db.select({
        id: appointmentReminders.id,
        appointmentId: appointmentReminders.appointmentId,
        reminderType: appointmentReminders.reminderType,
        scheduledTime: appointmentReminders.scheduledTime,
        status: appointmentReminders.status,
        sentAt: appointmentReminders.sentAt,
        failureReason: appointmentReminders.failureReason,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime
      })
        .from(appointmentReminders)
        .leftJoin(appointments, eq(appointmentReminders.appointmentId, appointments.id))
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .where(eq(appointmentReminders.organizationId, req.user!.organizationId!));

      if (appointmentId) {
        query = query.where(and(
          eq(appointmentReminders.organizationId, req.user!.organizationId!),
          eq(appointmentReminders.appointmentId, parseInt(appointmentId as string))
        ));
      }

      const reminders = await query.orderBy(desc(appointmentReminders.scheduledTime));
      return res.json(reminders);
    } catch (error) {
      console.error('Error fetching appointment reminders:', error);
      return res.status(500).json({ message: "Failed to fetch appointment reminders" });
    }
  });

  // Create appointment reminder
  router.post("/appointment-reminders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reminderData = {
        ...req.body,
        organizationId: req.user!.organizationId
      };

      const [newReminder] = await db
        .insert(appointmentReminders)
        .values(reminderData)
        .returning();

      res.json(newReminder);
    } catch (error) {
      console.error('Error creating appointment reminder:', error);
      return res.status(500).json({ message: "Failed to create appointment reminder" });
    }
  });

  return router;
}
