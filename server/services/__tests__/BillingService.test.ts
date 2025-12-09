import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '../BillingService';
import { db } from '../../db';
import { invoices, invoiceItems, payments } from '@shared/schema';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BillingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should create a new invoice with items', async () => {
      const invoiceData = {
        patientId: 1,
        organizationId: 1,
        items: [
          { description: 'Consultation', quantity: 1, unitPrice: 5000 },
          { description: 'Lab Test', quantity: 2, unitPrice: 2000 },
        ],
        createdBy: 1,
      };

      const mockInvoice = {
        id: 1,
        invoiceNumber: 'INV-1-0001',
        patientId: 1,
        totalAmount: '9450.00',
      };

      const mockCountSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockInvoice]),
      };

      vi.mocked(db.select).mockReturnValue(mockCountSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await BillingService.createInvoice(invoiceData);

      expect(result).toEqual(mockInvoice);
      expect(db.insert).toHaveBeenCalledWith(invoices);
      expect(db.insert).toHaveBeenCalledWith(invoiceItems);
    });
  });

  describe('getInvoiceById', () => {
    it('should retrieve an invoice with items and payments', async () => {
      const invoiceId = 1;
      const organizationId = 1;
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'INV-1-0001',
        patientId: 1,
        totalAmount: '5000.00',
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockInvoice]),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await BillingService.getInvoiceById(invoiceId, organizationId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(invoiceId);
    });

    it('should return null if invoice not found', async () => {
      const invoiceId = 999;
      const organizationId = 1;

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await BillingService.getInvoiceById(invoiceId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('recordPayment', () => {
    it('should record a payment and update invoice', async () => {
      const paymentData = {
        invoiceId: 1,
        organizationId: 1,
        amount: 5000,
        paymentMethod: 'cash',
        processedBy: 1,
      };

      const mockInvoice = {
        id: 1,
        patientId: 1,
        totalAmount: '10000.00',
        paidAmount: '0.00',
        status: 'draft',
      };

      const mockPayment = {
        id: 1,
        invoiceId: 1,
        amount: '5000.00',
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockInvoice]),
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockPayment]),
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      vi.mocked(db.insert).mockReturnValue(mockInsert as any);
      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await BillingService.recordPayment(paymentData);

      expect(result).toBeDefined();
      expect(result.payment).toEqual(mockPayment);
      expect(db.insert).toHaveBeenCalledWith(payments);
      expect(db.update).toHaveBeenCalledWith(invoices);
    });
  });

  describe('getBillingStatistics', () => {
    it('should calculate billing statistics', async () => {
      const organizationId = 1;
      const mockInvoices = [
        { id: 1, totalAmount: '10000.00', paidAmount: '10000.00', balanceAmount: '0.00', status: 'paid' },
        { id: 2, totalAmount: '5000.00', paidAmount: '2500.00', balanceAmount: '2500.00', status: 'partial' },
        { id: 3, totalAmount: '3000.00', paidAmount: '0.00', balanceAmount: '3000.00', status: 'overdue' },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockInvoices),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await BillingService.getBillingStatistics(organizationId);

      expect(result).toHaveProperty('totalInvoices');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('totalPaid');
      expect(result).toHaveProperty('totalOutstanding');
      expect(result).toHaveProperty('collectionRate');
    });
  });
});

