import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VaccinationService } from '../VaccinationService';
import { db } from '../../db';
import { vaccinations } from '@shared/schema';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

describe('VaccinationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVaccination', () => {
    it('should create a new vaccination', async () => {
      const vaccinationData = {
        patientId: 1,
        vaccineName: 'COVID-19',
        dateAdministered: new Date(),
        administeredBy: 'Dr. Smith',
        organizationId: 1,
      };

      const mockVaccination = { id: 1, ...vaccinationData };
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockVaccination]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await VaccinationService.createVaccination(vaccinationData as any);

      expect(result).toEqual(mockVaccination);
      expect(db.insert).toHaveBeenCalledWith(vaccinations);
    });
  });

  describe('getVaccinationById', () => {
    it('should retrieve a vaccination by ID', async () => {
      const vaccinationId = 1;
      const organizationId = 1;
      const mockVaccination = {
        id: vaccinationId,
        patientId: 1,
        vaccineName: 'COVID-19',
        organizationId,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockVaccination]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await VaccinationService.getVaccinationById(vaccinationId, organizationId);

      expect(result).toEqual(mockVaccination);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return null if vaccination not found', async () => {
      const vaccinationId = 999;
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await VaccinationService.getVaccinationById(vaccinationId);

      expect(result).toBeNull();
    });
  });

  describe('getVaccinationsByPatient', () => {
    it('should retrieve all vaccinations for a patient', async () => {
      const patientId = 1;
      const organizationId = 1;
      const mockVaccinations = [
        { id: 1, patientId, vaccineName: 'COVID-19', organizationId },
        { id: 2, patientId, vaccineName: 'Flu Shot', organizationId },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockVaccinations),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await VaccinationService.getVaccinationsByPatient(patientId, organizationId);

      expect(result).toEqual(mockVaccinations);
    });
  });

  describe('updateVaccination', () => {
    it('should update a vaccination', async () => {
      const vaccinationId = 1;
      const patientId = 1;
      const organizationId = 1;
      const updateData = { notes: 'Updated notes' };
      const mockUpdatedVaccination = { id: vaccinationId, ...updateData };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedVaccination]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await VaccinationService.updateVaccination(
        vaccinationId,
        patientId,
        updateData,
        organizationId
      );

      expect(result).toEqual(mockUpdatedVaccination);
      expect(db.update).toHaveBeenCalledWith(vaccinations);
    });
  });

  describe('deleteVaccination', () => {
    it('should delete a vaccination', async () => {
      const vaccinationId = 1;
      const patientId = 1;
      const organizationId = 1;
      const mockDeletedVaccination = { id: vaccinationId, patientId };

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockDeletedVaccination]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await VaccinationService.deleteVaccination(
        vaccinationId,
        patientId,
        organizationId
      );

      expect(result).toEqual(mockDeletedVaccination);
      expect(db.delete).toHaveBeenCalledWith(vaccinations);
    });
  });

  describe('getVaccinationStatistics', () => {
    it('should retrieve vaccination statistics', async () => {
      const organizationId = 1;
      const mockStats = {
        totalVaccinations: 100,
        patientsVaccinated: 50,
        overdue: 5,
        dueSoon: 10,
      };

      vi.mocked(db.execute).mockResolvedValue({
        rows: [mockStats]
      } as any);

      const result = await VaccinationService.getVaccinationStatistics(organizationId);

      expect(result).toEqual(mockStats);
      expect(db.execute).toHaveBeenCalled();
    });
  });
});

