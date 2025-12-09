import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VisitService } from '../VisitService';
import { db } from '../../db';
import { visits } from '@shared/schema';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('VisitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVisit', () => {
    it('should create a new visit', async () => {
      const visitData = {
        patientId: 1,
        doctorId: 1,
        organizationId: 1,
        visitDate: new Date(),
        visitType: 'consultation',
        status: 'draft',
      };

      const mockVisit = { id: 1, ...visitData };
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockVisit]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await VisitService.createVisit(visitData as any);

      expect(result).toEqual(mockVisit);
      expect(db.insert).toHaveBeenCalledWith(visits);
    });
  });

  describe('getVisitById', () => {
    it('should retrieve a visit by ID', async () => {
      const visitId = 1;
      const mockVisit = {
        id: visitId,
        patientId: 1,
        doctorId: 1,
        visitDate: new Date(),
        status: 'draft',
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockVisit]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await VisitService.getVisitById(visitId);

      expect(result).toEqual(mockVisit);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return null if visit not found', async () => {
      const visitId = 999;
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await VisitService.getVisitById(visitId);

      expect(result).toBeNull();
    });
  });

  describe('getVisitsByPatient', () => {
    it('should retrieve all visits for a patient', async () => {
      const patientId = 1;
      const organizationId = 1;
      const mockVisits = [
        { id: 1, patientId, visitDate: new Date() },
        { id: 2, patientId, visitDate: new Date() },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockVisits),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await VisitService.getVisitsByPatient(patientId, organizationId);

      expect(result).toEqual(mockVisits);
    });
  });

  describe('updateVisit', () => {
    it('should update a visit', async () => {
      const visitId = 1;
      const organizationId = 1;
      const updateData = { complaint: 'Updated complaint' };
      const mockUpdatedVisit = { id: visitId, ...updateData };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedVisit]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await VisitService.updateVisit(visitId, updateData, organizationId);

      expect(result).toEqual(mockUpdatedVisit);
      expect(db.update).toHaveBeenCalledWith(visits);
    });

    it('should return null if visit not found', async () => {
      const visitId = 999;
      const organizationId = 1;
      const updateData = { complaint: 'Updated complaint' };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await VisitService.updateVisit(visitId, updateData, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('finalizeVisit', () => {
    it('should finalize a visit', async () => {
      const visitId = 1;
      const organizationId = 1;
      const mockFinalizedVisit = { id: visitId, status: 'final' };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockFinalizedVisit]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await VisitService.finalizeVisit(visitId, organizationId);

      expect(result).toEqual(mockFinalizedVisit);
      expect(result?.status).toBe('final');
    });
  });

  describe('getVisits', () => {
    it('should get visits with filters', async () => {
      const filters = {
        organizationId: 1,
        status: 'draft',
        limit: 10,
      };

      const mockVisits = [
        { id: 1, status: 'draft' },
        { id: 2, status: 'draft' },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockVisits),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await VisitService.getVisits(filters);

      expect(result).toEqual(mockVisits);
    });
  });
});

