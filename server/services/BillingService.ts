import { db } from "../db";
import { invoices, invoiceItems, payments } from "@shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

/**
 * BillingService - Business logic for billing and invoice operations
 */
export class BillingService {
  /**
   * Create a new invoice with items
   */
  static async createInvoice(data: {
    patientId: number;
    organizationId: number;
    items: Array<{
      description: string;
      serviceType?: string;
      serviceId?: number;
      quantity: number;
      unitPrice: number;
    }>;
    notes?: string;
    dueDate?: string;
    createdBy: number;
  }) {
    const { patientId, organizationId, items, notes, dueDate, createdBy } = data;
    
    // Generate invoice number
    const invoiceCount = await db.select({ count: sql<number>`count(*)`.as('count') })
      .from(invoices)
      .where(eq(invoices.organizationId, organizationId));
    
    const invoiceNumber = `INV-${organizationId}-${String(invoiceCount[0].count + 1).padStart(4, '0')}`;
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * 0.075; // 7.5% VAT
    const totalAmount = subtotal + taxAmount;
    
    // Create invoice
    const [newInvoice] = await db.insert(invoices).values({
      patientId,
      organizationId,
      invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discountAmount: '0.00',
      totalAmount: totalAmount.toFixed(2),
      paidAmount: '0.00',
      balanceAmount: totalAmount.toFixed(2),
      currency: 'NGN',
      notes: notes || null,
      createdBy
    }).returning();

    // Create invoice items
    const invoiceItemsData = items.map(item => ({
      invoiceId: newInvoice.id,
      description: item.description,
      serviceType: item.serviceType || null,
      serviceId: item.serviceId || null,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: (item.quantity * item.unitPrice).toFixed(2)
    }));

    await db.insert(invoiceItems).values(invoiceItemsData);

    return newInvoice;
  }

  /**
   * Get invoice by ID with items and payments
   */
  static async getInvoiceById(invoiceId: number, organizationId: number) {
    const [invoice] = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)))
      .limit(1);

    if (!invoice) {
      return null;
    }

    const items = await db.select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));

    const paymentsList = await db.select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.paymentDate));

    return {
      ...invoice,
      items,
      payments: paymentsList
    };
  }

  /**
   * Get all invoices for an organization
   */
  static async getInvoices(organizationId: number, filters?: {
    patientId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let whereConditions = [eq(invoices.organizationId, organizationId)];

    if (filters?.patientId) {
      whereConditions.push(eq(invoices.patientId, filters.patientId));
    }
    if (filters?.status) {
      whereConditions.push(eq(invoices.status, filters.status));
    }
    if (filters?.startDate) {
      whereConditions.push(gte(invoices.issueDate, filters.startDate));
    }
    if (filters?.endDate) {
      whereConditions.push(lte(invoices.issueDate, filters.endDate));
    }

    return await db.select()
      .from(invoices)
      .where(and(...whereConditions))
      .orderBy(desc(invoices.createdAt));
  }

  /**
   * Record payment for an invoice
   */
  static async recordPayment(data: {
    invoiceId: number;
    organizationId: number;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    notes?: string;
    processedBy: number;
  }) {
    const { invoiceId, organizationId, amount, paymentMethod, transactionId, notes, processedBy } = data;

    // Get current invoice
    const [currentInvoice] = await db.select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)));

    if (!currentInvoice) {
      throw new Error('Invoice not found');
    }

    // Create payment record
    const [newPayment] = await db.insert(payments).values({
      invoiceId,
      patientId: currentInvoice.patientId,
      organizationId,
      paymentMethod,
      amount: amount.toFixed(2),
      currency: 'NGN',
      transactionId: transactionId || null,
      paymentDate: new Date(),
      status: 'completed',
      notes: notes || null,
      processedBy
    }).returning();

    // Update invoice amounts
    const newPaidAmount = parseFloat(currentInvoice.paidAmount) + amount;
    const newBalanceAmount = parseFloat(currentInvoice.totalAmount) - newPaidAmount;
    const newStatus = newBalanceAmount <= 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : currentInvoice.status);

    await db.update(invoices)
      .set({
        paidAmount: newPaidAmount.toFixed(2),
        balanceAmount: newBalanceAmount.toFixed(2),
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));

    return {
      payment: newPayment,
      updatedInvoice: {
        paidAmount: newPaidAmount.toFixed(2),
        balanceAmount: newBalanceAmount.toFixed(2),
        status: newStatus
      }
    };
  }

  /**
   * Get billing statistics
   */
  static async getBillingStatistics(organizationId: number, dateRange?: { start: string; end: string }) {
    let whereConditions = [eq(invoices.organizationId, organizationId)];

    if (dateRange) {
      whereConditions.push(
        gte(invoices.issueDate, dateRange.start),
        lte(invoices.issueDate, dateRange.end)
      );
    }

    const allInvoices = await db.select()
      .from(invoices)
      .where(and(...whereConditions));

    const totalInvoices = allInvoices.length;
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    const totalPaid = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);
    const totalOutstanding = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.balanceAmount), 0);
    
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').length;
    const partialInvoices = allInvoices.filter(inv => inv.status === 'partial').length;
    const overdueInvoices = allInvoices.filter(inv => inv.status === 'overdue').length;

    return {
      totalInvoices,
      totalRevenue: totalRevenue.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalOutstanding: totalOutstanding.toFixed(2),
      paidInvoices,
      partialInvoices,
      overdueInvoices,
      collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0
    };
  }
}

