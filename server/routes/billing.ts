import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { invoices, invoiceItems, payments, patients, users, servicePrices, insuranceClaims } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

/**
 * Billing and invoice management routes
 * Handles: invoices, payments, billing operations
 */
export function setupBillingRoutes(): Router {
  
  // Get all invoices
  router.get("/invoices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;
      
      let query = db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        patientId: invoices.patientId,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`.as('patientName'),
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        balanceAmount: invoices.balanceAmount,
        currency: invoices.currency,
        createdAt: invoices.createdAt
      })
      .from(invoices)
      .innerJoin(patients, eq(invoices.patientId, patients.id))
      .where(
        patientId 
          ? and(eq(invoices.organizationId, orgId), eq(invoices.patientId, patientId))
          : eq(invoices.organizationId, orgId)
      )
      .orderBy(desc(invoices.createdAt));

      const invoicesList = await query;
      res.json(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  // Create new invoice
  router.post("/invoices", authenticateToken, requireAnyRole(['admin', 'nurse', 'receptionist']), async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      const userId = req.user?.id;
      
      if (!orgId || !userId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const { patientId, items, notes, dueDate } = req.body;
      
      if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Patient ID and items are required" });
      }
      
      // Generate invoice number
      const invoiceCount = await db.select({ count: sql<number>`count(*)`.as('count') })
        .from(invoices)
        .where(eq(invoices.organizationId, orgId));
      
      const invoiceNumber = `INV-${orgId}-${String(invoiceCount[0].count + 1).padStart(4, '0')}`;
      
      // Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * 0.075; // 7.5% VAT
      const totalAmount = subtotal + taxAmount;
      
      // Create invoice
      const [newInvoice] = await db.insert(invoices).values({
        patientId,
        organizationId: orgId,
        invoiceNumber,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate,
        status: 'draft',
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        discountAmount: '0.00',
        totalAmount: totalAmount.toFixed(2),
        paidAmount: '0.00',
        balanceAmount: totalAmount.toFixed(2),
        currency: 'NGN',
        notes,
        createdBy: userId
      }).returning();

      // Create invoice items
      for (const item of items) {
        await db.insert(invoiceItems).values({
          invoiceId: newInvoice.id,
          description: item.description,
          serviceType: item.serviceType,
          serviceId: item.serviceId,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: (item.quantity * item.unitPrice).toFixed(2)
        });
      }

      res.json({ message: 'Invoice created successfully', invoiceId: newInvoice.id, invoice: newInvoice });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  });

  // Get invoice details with items
  router.get("/invoices/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      const invoiceId = parseInt(req.params.id);
      
      if (!orgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Get invoice details
      const [invoiceDetails] = await db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        patientId: invoices.patientId,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`.as('patientName'),
        patientPhone: patients.phone,
        patientEmail: patients.email,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        balanceAmount: invoices.balanceAmount,
        currency: invoices.currency,
        notes: invoices.notes,
        createdAt: invoices.createdAt
      })
      .from(invoices)
      .innerJoin(patients, eq(invoices.patientId, patients.id))
      .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, orgId)));

      if (!invoiceDetails) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Get invoice items
      const items = await db.select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId));

      // Get payments
      const paymentsList = await db.select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
        transactionId: payments.transactionId,
        status: payments.status,
        notes: payments.notes,
        processedBy: sql<string>`COALESCE(NULLIF(TRIM(${users.firstName} || ' ' || ${users.lastName}), ''), ${users.username})`.as('processedBy')
      })
      .from(payments)
      .leftJoin(users, eq(payments.processedBy, users.id))
      .where(eq(payments.invoiceId, invoiceId));

      res.json({
        ...invoiceDetails,
        items,
        payments: paymentsList
      });
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      res.status(500).json({ error: 'Failed to fetch invoice details' });
    }
  });

  // Update invoice status
  router.patch("/invoices/:id", authenticateToken, requireAnyRole(['admin', 'nurse', 'receptionist']), async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;

      if (!orgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      if (status && !['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid invoice status' });
      }

      const [updatedInvoice] = await db.update(invoices)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, orgId)))
        .returning();

      if (!updatedInvoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json(updatedInvoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  });

  // Record payment
  router.post("/payments", authenticateToken, requireAnyRole(['admin', 'nurse', 'receptionist']), async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      const userId = req.user?.id;
      
      if (!orgId || !userId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const { invoiceId, amount, paymentMethod, transactionId, notes } = req.body;
      
      if (!invoiceId || !amount || !paymentMethod) {
        return res.status(400).json({ error: "Invoice ID, amount, and payment method are required" });
      }
      
      // Get current invoice
      const [currentInvoice] = await db.select()
        .from(invoices)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, orgId)));

      if (!currentInvoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Create payment record
      const [newPayment] = await db.insert(payments).values({
        invoiceId,
        patientId: currentInvoice.patientId,
        organizationId: orgId,
        paymentMethod,
        amount: amount.toFixed(2),
        currency: 'NGN',
        transactionId,
        paymentDate: new Date(),
        status: 'completed',
        notes,
        processedBy: userId
      }).returning();

      // Update invoice amounts
      const newPaidAmount = parseFloat(currentInvoice.paidAmount) + amount;
      const newBalanceAmount = parseFloat(currentInvoice.totalAmount) - newPaidAmount;
      const newStatus = newBalanceAmount <= 0 ? 'paid' : 'partial';

      await db.update(invoices)
        .set({
          paidAmount: newPaidAmount.toFixed(2),
          balanceAmount: newBalanceAmount.toFixed(2),
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));

      res.json({ 
        message: 'Payment recorded successfully',
        payment: newPayment,
        updatedInvoice: {
          paidAmount: newPaidAmount.toFixed(2),
          balanceAmount: newBalanceAmount.toFixed(2),
          status: newStatus
        }
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  // Get payments for an invoice
  router.get("/invoices/:id/payments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      const invoiceId = parseInt(req.params.id);

      if (!orgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Verify invoice belongs to organization
      const [invoice] = await db.select()
        .from(invoices)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.organizationId, orgId)))
        .limit(1);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const paymentsList = await db.select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
        transactionId: payments.transactionId,
        status: payments.status,
        notes: payments.notes,
        processedBy: sql<string>`COALESCE(NULLIF(TRIM(${users.firstName} || ' ' || ${users.lastName}), ''), ${users.username})`.as('processedBy')
      })
      .from(payments)
      .leftJoin(users, eq(payments.processedBy, users.id))
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.paymentDate));

      res.json(paymentsList);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  // =====================
  // SERVICE PRICES ROUTES
  // =====================

  // Get service prices
  router.get("/service-prices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user!.organizationId;

      const prices = await db.select()
        .from(servicePrices)
        .where(and(eq(servicePrices.organizationId, orgId), eq(servicePrices.isActive, true)))
        .orderBy(servicePrices.serviceType, servicePrices.serviceName);

      return res.json(prices);
    } catch (error) {
      console.error('Error fetching service prices:', error);
      return res.status(500).json({ error: 'Failed to fetch service prices' });
    }
  });

  // Create/update service price
  router.post("/service-prices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user!.id;

      const { serviceType, serviceName, serviceCode, basePrice, effectiveDate, expiryDate } = req.body;

      await db.insert(servicePrices).values({
        organizationId: orgId,
        serviceType,
        serviceName,
        serviceCode,
        basePrice: basePrice.toFixed(2),
        currency: 'NGN',
        isActive: true,
        effectiveDate,
        expiryDate,
        createdBy: userId
      });

      return res.json({ message: 'Service price created successfully' });
    } catch (error) {
      console.error('Error creating service price:', error);
      return res.status(500).json({ error: 'Failed to create service price' });
    }
  });

  // =====================
  // INSURANCE CLAIMS ROUTES
  // =====================

  // Get insurance claims
  router.get("/insurance-claims", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user!.organizationId;

      const claims = await db.select({
        id: insuranceClaims.id,
        claimNumber: insuranceClaims.claimNumber,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`.as('patientName'),
        insuranceProvider: insuranceClaims.insuranceProvider,
        policyNumber: insuranceClaims.policyNumber,
        claimAmount: insuranceClaims.claimAmount,
        approvedAmount: insuranceClaims.approvedAmount,
        status: insuranceClaims.status,
        submissionDate: insuranceClaims.submissionDate,
        approvalDate: insuranceClaims.approvalDate
      })
        .from(insuranceClaims)
        .innerJoin(patients, eq(insuranceClaims.patientId, patients.id))
        .where(eq(insuranceClaims.organizationId, orgId))
        .orderBy(desc(insuranceClaims.submissionDate));

      return res.json(claims);
    } catch (error) {
      console.error('Error fetching insurance claims:', error);
      return res.status(500).json({ error: 'Failed to fetch insurance claims' });
    }
  });

  // Submit insurance claim
  router.post("/insurance-claims", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user!.id;

      const { patientId, invoiceId, insuranceProvider, policyNumber, claimAmount, notes } = req.body;

      // Generate claim number
      const claimCount = await db.select({ count: sql<number>`count(*)`.as('count') })
        .from(insuranceClaims)
        .where(eq(insuranceClaims.organizationId, orgId));

      const claimNumber = `CLM-${orgId}-${String(claimCount[0].count + 1).padStart(4, '0')}`;

      await db.insert(insuranceClaims).values({
        organizationId: orgId,
        patientId,
        invoiceId: invoiceId || null,
        insuranceProvider,
        policyNumber,
        claimNumber,
        claimAmount: claimAmount.toFixed(2),
        status: 'submitted',
        submissionDate: new Date(),
        notes: notes || null,
        submittedBy: userId
      });

      return res.json({ message: 'Insurance claim submitted successfully', claimNumber });
    } catch (error) {
      console.error('Error submitting insurance claim:', error);
      return res.status(500).json({ error: 'Failed to submit insurance claim' });
    }
  });

  return router;
}
