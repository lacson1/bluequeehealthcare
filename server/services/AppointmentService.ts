import { db } from "../db";
import { appointments, patients, users } from "@shared/schema";
import { eq, desc, asc, and, ne, sql } from "drizzle-orm";
import { insertAppointmentSchema } from "@shared/schema";
import type { InsertAppointment } from "@shared/schema";

/**
 * AppointmentService - Business logic for appointment operations
 */
export class AppointmentService {
  /**
   * Create a new appointment with conflict checking
   */
  static async createAppointment(appointmentData: InsertAppointment) {
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
        throw new Error(`Time slot conflict: This time slot conflicts with an existing appointment at ${existing.appointmentTime}`);
      }
    }

    // No overlap found, create the appointment
    const [newAppointment] = await db.insert(appointments)
      .values(validatedData)
      .returning();
    
    return newAppointment;
  }

  /**
   * Get appointment by ID
   */
  static async getAppointmentById(appointmentId: number, organizationId?: number) {
    let whereConditions = [eq(appointments.id, appointmentId)];
    
    if (organizationId) {
      whereConditions.push(eq(appointments.organizationId, organizationId));
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
    
    return appointment || null;
  }

  /**
   * Get all appointments with filters
   */
  static async getAppointments(filters: {
    organizationId?: number;
    date?: string;
    doctorId?: number;
    patientId?: number;
    status?: string;
    isSuperAdmin?: boolean;
  }) {
    const { organizationId, date, doctorId, patientId, status, isSuperAdmin } = filters;
    
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
    
    // Build where conditions
    let whereConditions: any[] = [];
    
    if (organizationId && !isSuperAdmin) {
      whereConditions.push(eq(appointments.organizationId, organizationId));
    }
    if (doctorId) {
      whereConditions.push(eq(appointments.doctorId, doctorId));
    }
    if (patientId) {
      whereConditions.push(eq(appointments.patientId, patientId));
    }
    if (status) {
      whereConditions.push(eq(appointments.status, status));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as any;
    }
    
    // Note: orderBy with multiple columns needs to be chained
    let result = await query.orderBy(asc(appointments.appointmentDate)).orderBy(asc(appointments.appointmentTime));
    
    // Filter by date if provided (client-side filter for simplicity)
    if (date) {
      result = result.filter(appointment => appointment.appointmentDate === date);
    }
    
    // Format the response
    return result.map(appointment => ({
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
  }

  /**
   * Update appointment
   */
  static async updateAppointment(
    appointmentId: number,
    updateData: Partial<InsertAppointment>,
    organizationId?: number
  ) {
    let whereConditions = [eq(appointments.id, appointmentId)];
    
    if (organizationId) {
      whereConditions.push(eq(appointments.organizationId, organizationId));
    }
    
    const [updatedAppointment] = await db.update(appointments)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(...whereConditions))
      .returning();
    
    return updatedAppointment || null;
  }

  /**
   * Delete appointment
   */
  static async deleteAppointment(appointmentId: number, organizationId?: number) {
    let whereConditions = [eq(appointments.id, appointmentId)];
    
    if (organizationId) {
      whereConditions.push(eq(appointments.organizationId, organizationId));
    }
    
    const [deletedAppointment] = await db.delete(appointments)
      .where(and(...whereConditions))
      .returning();
    
    return deletedAppointment || null;
  }

  /**
   * Start consultation (update status to in-progress)
   */
  static async startConsultation(appointmentId: number, organizationId: number) {
    const [updatedAppointment] = await db.update(appointments)
      .set({
        status: 'in-progress',
        startedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, organizationId)
      ))
      .returning();
    
    return updatedAppointment || null;
  }

  /**
   * Complete consultation
   */
  static async completeConsultation(
    appointmentId: number,
    organizationId: number,
    notes?: string,
    followUpData?: { date: string; time?: string }
  ) {
    const [updatedAppointment] = await db.update(appointments)
      .set({
        status: 'completed',
        notes: notes || null,
        updatedAt: new Date()
      })
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, organizationId)
      ))
      .returning();
    
    if (!updatedAppointment) {
      return null;
    }

    // Create follow-up appointment if required
    if (followUpData) {
      await db.insert(appointments).values({
        patientId: updatedAppointment.patientId,
        doctorId: updatedAppointment.doctorId,
        appointmentDate: followUpData.date,
        appointmentTime: followUpData.time || "09:00",
        type: "follow-up",
        status: "scheduled",
        notes: `Follow-up from appointment #${appointmentId}`,
        organizationId: organizationId
      });
    }
    
    return updatedAppointment;
  }

  /**
   * Get appointment statistics
   */
  static async getAppointmentStatistics(organizationId: number, dateRange?: { start: string; end: string }) {
    let whereConditions = [eq(appointments.organizationId, organizationId)];
    
    if (dateRange) {
      whereConditions.push(
        sql`${appointments.appointmentDate} >= ${dateRange.start}`,
        sql`${appointments.appointmentDate} <= ${dateRange.end}`
      );
    }
    
    const allAppointments = await db.select()
      .from(appointments)
      .where(and(...whereConditions));
    
    const total = allAppointments.length;
    const scheduled = allAppointments.filter(a => a.status === 'scheduled').length;
    const inProgress = allAppointments.filter(a => a.status === 'in-progress').length;
    const completed = allAppointments.filter(a => a.status === 'completed').length;
    const cancelled = allAppointments.filter(a => a.status === 'cancelled').length;
    
    return {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }
}

