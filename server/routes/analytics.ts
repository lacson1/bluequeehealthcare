import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { organizations, payments, invoices, invoiceItems, patients } from "@shared/schema";
import { db } from "../db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

const router = Router();

/**
 * Analytics and reporting routes
 * Handles: dashboard stats, performance metrics, revenue analytics, clinical activity
 */
export function setupAnalyticsRoutes(): Router {
  
  // Comprehensive analytics
  router.get("/analytics/comprehensive", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const { period = 'month', startDate, endDate } = req.query;
      
      // Get organization details
      const [organization] = await db.select({
        id: organizations.id,
        name: organizations.name,
        type: organizations.type
      })
      .from(organizations)
      .where(eq(organizations.id, orgId));

      // Calculate date range
      let dateStart: Date, dateEnd: Date;
      const now = new Date();
      
      if (startDate && endDate) {
        dateStart = new Date(startDate as string);
        dateEnd = new Date(endDate as string);
      } else {
        switch (period) {
          case 'week':
            dateStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateEnd = now;
            break;
          case 'quarter':
            dateStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            dateEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
            break;
          case 'year':
            dateStart = new Date(now.getFullYear(), 0, 1);
            dateEnd = new Date(now.getFullYear(), 11, 31);
            break;
          default:
            dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
      }

      // Revenue from completed payments
      const [totalRevenue] = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total'),
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(payments)
      .where(and(
        eq(payments.organizationId, orgId),
        gte(payments.paymentDate, dateStart),
        lte(payments.paymentDate, dateEnd),
        eq(payments.status, 'completed')
      ));

      // Outstanding receivables
      const [outstanding] = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${invoices.balanceAmount} AS DECIMAL)), 0)`.as('total'),
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(invoices)
      .where(and(
        eq(invoices.organizationId, orgId),
        sql`${invoices.balanceAmount} > 0`
      ));

      // Patient analytics
      const patientAnalytics = await db.select({
        patientId: invoices.patientId,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`.as('patientName'),
        phone: patients.phone,
        totalSpent: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`.as('totalSpent'),
        invoiceCount: sql<number>`COUNT(*)`.as('invoiceCount'),
        lastVisit: sql<Date>`MAX(${invoices.createdAt})`.as('lastVisit'),
        averageInvoiceValue: sql<number>`AVG(CAST(${invoices.totalAmount} AS DECIMAL))`.as('averageInvoiceValue')
      })
      .from(invoices)
      .innerJoin(patients, eq(invoices.patientId, patients.id))
      .where(and(
        eq(invoices.organizationId, orgId),
        gte(invoices.createdAt, dateStart),
        lte(invoices.createdAt, dateEnd)
      ))
      .groupBy(invoices.patientId, patients.firstName, patients.lastName, patients.phone)
      .orderBy(desc(sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`));

      // Service revenue breakdown
      const serviceBreakdown = await db.select({
        serviceType: invoiceItems.serviceType,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL)), 0)`.as('totalRevenue'),
        transactionCount: sql<number>`COUNT(*)`.as('transactionCount'),
        averagePrice: sql<number>`COALESCE(AVG(CAST(${invoiceItems.unitPrice} AS DECIMAL)), 0)`.as('averagePrice')
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(and(
        eq(invoices.organizationId, orgId),
        gte(invoices.createdAt, dateStart),
        lte(invoices.createdAt, dateEnd)
      ))
      .groupBy(invoiceItems.serviceType)
      .orderBy(desc(sql`SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL))`));

      // Payment method analysis
      const paymentMethods = await db.select({
        method: payments.paymentMethod,
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total'),
        count: sql<number>`COUNT(*)`.as('count'),
        averageAmount: sql<number>`COALESCE(AVG(CAST(${payments.amount} AS DECIMAL)), 0)`.as('averageAmount')
      })
      .from(payments)
      .where(and(
        eq(payments.organizationId, orgId),
        gte(payments.paymentDate, dateStart),
        lte(payments.paymentDate, dateEnd),
        eq(payments.status, 'completed')
      ))
      .groupBy(payments.paymentMethod)
      .orderBy(desc(sql`SUM(CAST(${payments.amount} AS DECIMAL))`));

      // Daily revenue trend
      const dailyRevenue = await db.select({
        date: sql<string>`DATE(${payments.paymentDate})`.as('date'),
        revenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('revenue'),
        transactionCount: sql<number>`COUNT(*)`.as('transactionCount')
      })
      .from(payments)
      .where(and(
        eq(payments.organizationId, orgId),
        gte(payments.paymentDate, dateStart),
        lte(payments.paymentDate, dateEnd),
        eq(payments.status, 'completed')
      ))
      .groupBy(sql`DATE(${payments.paymentDate})`)
      .orderBy(sql`DATE(${payments.paymentDate})`);

      // Calculate collection rate
      const totalInvoiced = patientAnalytics.reduce((sum, p) => sum + Number(p.totalSpent), 0);
      const collectionRate = totalInvoiced > 0 ? (totalRevenue.total / totalInvoiced) * 100 : 0;

      res.json({
        organization: {
          id: organization?.id,
          name: organization?.name,
          type: organization?.type
        },
        period: {
          startDate: dateStart.toISOString().split('T')[0],
          endDate: dateEnd.toISOString().split('T')[0],
          type: period
        },
        revenue: {
          total: totalRevenue.total,
          paymentCount: totalRevenue.count,
          outstanding: outstanding.total,
          outstandingCount: outstanding.count,
          collectionRate: Math.round(collectionRate * 100) / 100
        },
        patients: {
          total: patientAnalytics.length,
          analytics: patientAnalytics,
          topPaying: patientAnalytics.slice(0, 10),
          averageRevenuePerPatient: patientAnalytics.length > 0 ? 
            totalRevenue.total / patientAnalytics.length : 0
        },
        services: {
          breakdown: serviceBreakdown,
          topPerforming: serviceBreakdown.slice(0, 5)
        },
        trends: {
          daily: dailyRevenue,
          paymentMethods
        }
      });
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  // Revenue analytics
  router.get("/revenue-analytics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Total revenue for current month
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const [totalRevenue] = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total')
      })
      .from(payments)
      .where(and(
        eq(payments.organizationId, orgId),
        gte(payments.paymentDate, firstDayOfMonth),
        lte(payments.paymentDate, lastDayOfMonth),
        eq(payments.status, 'completed')
      ));

      // Total patients billed this month
      const [totalPatients] = await db.select({
        count: sql<number>`COUNT(DISTINCT ${invoices.patientId})`.as('count')
      })
      .from(invoices)
      .where(and(
        eq(invoices.organizationId, orgId),
        gte(invoices.createdAt, firstDayOfMonth),
        lte(invoices.createdAt, lastDayOfMonth)
      ));

      // Average revenue per patient
      const avgRevenuePerPatient = totalPatients.count > 0 ? 
        (totalRevenue.total / totalPatients.count) : 0;

      // Previous month for growth calculation
      const prevFirstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const prevLastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      const [prevRevenue] = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total')
      })
      .from(payments)
      .where(and(
        eq(payments.organizationId, orgId),
        gte(payments.paymentDate, prevFirstDay),
        lte(payments.paymentDate, prevLastDay),
        eq(payments.status, 'completed')
      ));

      const growthRate = prevRevenue.total > 0 ? 
        ((totalRevenue.total - prevRevenue.total) / prevRevenue.total) * 100 : 0;

      // Daily revenue for charts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyRevenue = await db.select({
        date: sql<string>`DATE(${payments.paymentDate})`.as('date'),
        revenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('revenue')
      })
      .from(payments)
      .where(and(
        eq(payments.organizationId, orgId),
        gte(payments.paymentDate, thirtyDaysAgo),
        eq(payments.status, 'completed')
      ))
      .groupBy(sql`DATE(${payments.paymentDate})`)
      .orderBy(sql`DATE(${payments.paymentDate})`);

      // Service revenue breakdown
      const serviceRevenue = await db.select({
        service: invoiceItems.serviceType,
        revenue: sql<number>`COALESCE(SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL)), 0)`.as('revenue'),
        percentage: sql<number>`ROUND(
          (COALESCE(SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL)), 0) * 100.0) / 
          NULLIF((SELECT SUM(CAST(total_price AS DECIMAL)) FROM invoice_items ij 
                  INNER JOIN invoices i ON ij.invoice_id = i.id 
                  WHERE i.organization_id = ${orgId}), 0), 2
        )`.as('percentage')
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(eq(invoices.organizationId, orgId))
      .groupBy(invoiceItems.serviceType)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL)), 0)`));

      res.json({
        totalRevenue: totalRevenue.total,
        totalPatients: totalPatients.count,
        avgRevenuePerPatient,
        growthRate,
        dailyRevenue,
        serviceRevenue
      });
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
  });

  return router;
}
