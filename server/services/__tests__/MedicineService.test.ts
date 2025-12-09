import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MedicineService } from '../MedicineService';
import { db } from '../../db';
import { medicines } from '@shared/schema';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MedicineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMedicine', () => {
    it('should create a new medicine', async () => {
      const medicineData = {
        name: 'Paracetamol',
        quantity: 100,
        unit: 'tablets',
        organizationId: 1,
        lowStockThreshold: 10,
      };

      const mockMedicine = { id: 1, ...medicineData };
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockMedicine]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await MedicineService.createMedicine(medicineData as any);

      expect(result).toEqual(mockMedicine);
      expect(db.insert).toHaveBeenCalledWith(medicines);
    });
  });

  describe('getMedicineById', () => {
    it('should retrieve a medicine by ID', async () => {
      const medicineId = 1;
      const organizationId = 1;
      const mockMedicine = {
        id: medicineId,
        name: 'Paracetamol',
        quantity: 100,
        organizationId,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMedicine]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await MedicineService.getMedicineById(medicineId, organizationId);

      expect(result).toEqual(mockMedicine);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return null if medicine not found', async () => {
      const medicineId = 999;
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await MedicineService.getMedicineById(medicineId);

      expect(result).toBeNull();
    });
  });

  describe('getMedicines', () => {
    it('should retrieve all medicines for an organization', async () => {
      const organizationId = 1;
      const mockMedicines = [
        { id: 1, name: 'Paracetamol', organizationId },
        { id: 2, name: 'Ibuprofen', organizationId },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockMedicines),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await MedicineService.getMedicines(organizationId);

      expect(result).toEqual(mockMedicines);
    });
  });

  describe('updateQuantity', () => {
    it('should update medicine quantity', async () => {
      const medicineId = 1;
      const organizationId = 1;
      const newQuantity = 150;
      const mockUpdatedMedicine = { id: medicineId, quantity: newQuantity };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedMedicine]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await MedicineService.updateQuantity(medicineId, newQuantity, organizationId);

      expect(result).toEqual(mockUpdatedMedicine);
      expect(result?.quantity).toBe(newQuantity);
    });
  });

  describe('getLowStockMedicines', () => {
    it('should retrieve low stock medicines', async () => {
      const organizationId = 1;
      const mockLowStock = [
        { id: 1, name: 'Medicine A', quantity: 5, lowStockThreshold: 10 },
        { id: 2, name: 'Medicine B', quantity: 0, lowStockThreshold: 10 },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockLowStock),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await MedicineService.getLowStockMedicines(organizationId);

      expect(result).toEqual(mockLowStock);
    });
  });

  describe('searchMedicines', () => {
    it('should search medicines by name', async () => {
      const searchTerm = 'para';
      const organizationId = 1;
      const mockResults = [
        { id: 1, name: 'Paracetamol', organizationId },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await MedicineService.searchMedicines(searchTerm, organizationId);

      expect(result).toEqual(mockResults);
    });
  });

  describe('getMedicineStatistics', () => {
    it('should calculate medicine statistics', async () => {
      const organizationId = 1;
      
      // Mock getMedicines
      const mockMedicines = [
        { id: 1, name: 'Medicine A', quantity: 100, cost: '10.00' },
        { id: 2, name: 'Medicine B', quantity: 0, cost: '20.00' },
        { id: 3, name: 'Medicine C', quantity: 5, cost: '15.00' },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockMedicines),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      // Mock getLowStockMedicines
      const mockLowStock = [
        { id: 3, name: 'Medicine C', quantity: 5, lowStockThreshold: 10 },
      ];

      const result = await MedicineService.getMedicineStatistics(organizationId);

      expect(result).toHaveProperty('totalMedicines');
      expect(result).toHaveProperty('outOfStock');
      expect(result).toHaveProperty('lowStock');
      expect(result).toHaveProperty('totalValue');
    });
  });
});

