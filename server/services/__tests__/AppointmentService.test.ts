import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppointmentService } from '../AppointmentService';
import { db } from '../../db';
import { appointments } from '@shared/schema';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('AppointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        patientId: 1,
        doctorId: 1,
        organizationId: 1,
        appointmentDate: '2024-12-20',
        appointmentTime: '10:00',
        duration: 30,
        type: 'consultation',
        status: 'scheduled',
      };

      const mockAppointment = { id: 1, ...appointmentData };
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAppointment]),
      };

      // Mock no existing appointments (no conflicts)
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await AppointmentService.createAppointment(appointmentData as any);

      expect(result).toEqual(mockAppointment);
      expect(db.insert).toHaveBeenCalledWith(appointments);
    });

    it('should throw error on time slot conflict', async () => {
      const appointmentData = {
        patientId: 1,
        doctorId: 1,
        organizationId: 1,
        appointmentDate: '2024-12-20',
        appointmentTime: '10:00',
        duration: 30,
        type: 'consultation',
        status: 'scheduled',
      };

      // Mock existing appointment at same time
      const existingAppointment = {
        id: 2,
        doctorId: 1,
        appointmentDate: '2024-12-20',
        appointmentTime: '10:00',
        duration: 30,
        status: 'scheduled',
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([existingAppointment]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      await expect(
        AppointmentService.createAppointment(appointmentData as any)
      ).rejects.toThrow('Time slot conflict');
    });
  });

  describe('getAppointmentById', () => {
    it('should retrieve an appointment by ID', async () => {
      const appointmentId = 1;
      const organizationId = 1;
      const mockAppointment = {
        id: appointmentId,
        patientId: 1,
        doctorId: 1,
        appointmentDate: '2024-12-20',
        status: 'scheduled',
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockAppointment]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await AppointmentService.getAppointmentById(appointmentId, organizationId);

      expect(result).toEqual(mockAppointment);
    });
  });

  describe('updateAppointment', () => {
    it('should update an appointment', async () => {
      const appointmentId = 1;
      const organizationId = 1;
      const updateData = { status: 'completed' };
      const mockUpdatedAppointment = { id: appointmentId, ...updateData };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedAppointment]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await AppointmentService.updateAppointment(
        appointmentId,
        updateData,
        organizationId
      );

      expect(result).toEqual(mockUpdatedAppointment);
    });
  });

  describe('startConsultation', () => {
    it('should start a consultation', async () => {
      const appointmentId = 1;
      const organizationId = 1;
      const mockUpdatedAppointment = {
        id: appointmentId,
        status: 'in-progress',
        startedAt: new Date(),
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedAppointment]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await AppointmentService.startConsultation(appointmentId, organizationId);

      expect(result).toEqual(mockUpdatedAppointment);
      expect(result?.status).toBe('in-progress');
    });
  });

  describe('completeConsultation', () => {
    it('should complete a consultation', async () => {
      const appointmentId = 1;
      const organizationId = 1;
      const mockUpdatedAppointment = {
        id: appointmentId,
        patientId: 1,
        doctorId: 1,
        status: 'completed',
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedAppointment]),
      };

      const mockInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await AppointmentService.completeConsultation(
        appointmentId,
        organizationId,
        'Notes here'
      );

      expect(result).toEqual(mockUpdatedAppointment);
      expect(result?.status).toBe('completed');
    });
  });
});

