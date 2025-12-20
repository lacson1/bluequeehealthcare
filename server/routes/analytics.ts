import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { organizations, payments, invoices, invoiceItems, patients, visits, labOrders, prescriptions, appointments } from "@shared/schema";
import { db } from "../db";
import { eq, and, gte, lte, lt, sql, desc, isNotNull } from "drizzle-orm";

const router = Router();

/**
 * Analytics and reporting routes
 * Handles: dashboard stats, performance metrics, revenue analytics, clinical activity
 */
export function setupAnalyticsRoutes(): Router {
  
  // Dashboard analytics - returns data for the analytics dashboard charts
  router.get("/analytics/dashboard", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Get data for the last 6 months
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      
      console.log(`[Analytics] Fetching dashboard data for org ${orgId}, period: ${sixMonthsAgo.toISOString()} to ${now.toISOString()}`);

      // Patient trends - get total patient count up to each month (cumulative)
      // First get total patients before the 6-month period
      let baselineCount = 0;
      try {
        const baselinePatientsResult = await db.select({
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(patients)
        .where(and(
          eq(patients.organizationId, orgId),
          lt(patients.createdAt, sixMonthsAgo)
        ));
        baselineCount = Number(baselinePatientsResult[0]?.count || 0);
      } catch (err) {
        console.warn('[Analytics] Error getting baseline patients, defaulting to 0:', err);
        baselineCount = 0;
      }

      // Then get new patients by month
      let patientTrendsData: Array<{ month: string; count: number }> = [];
      try {
        patientTrendsData = await db.select({
          month: sql<string>`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`.as('month'),
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(patients)
        .where(and(
          eq(patients.organizationId, orgId),
          gte(patients.createdAt, sixMonthsAgo)
        ))
        .groupBy(sql`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${patients.createdAt}, 'YYYY-MM')`);
      } catch (err: any) {
        console.error('[Analytics] Error fetching patient trends:', err?.message);
        throw err;
      }

      // Calculate cumulative patient counts
      let cumulativePatients = baselineCount;
      const patientTrends = patientTrendsData.map((item) => {
        cumulativePatients += Number(item.count);
        return {
          date: item.month,
          value: cumulativePatients,
          label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      });

      // Visit trends - visits by month
      let visitTrendsData: Array<{ month: string; count: number }> = [];
      try {
        visitTrendsData = await db.select({
          month: sql<string>`TO_CHAR(${visits.visitDate}, 'YYYY-MM')`.as('month'),
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(visits)
        .where(and(
          eq(visits.organizationId, orgId),
          gte(visits.visitDate, sixMonthsAgo)
        ))
        .groupBy(sql`TO_CHAR(${visits.visitDate}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${visits.visitDate}, 'YYYY-MM')`);
      } catch (err: any) {
        console.error('[Analytics] Error fetching visit trends:', err?.message);
        // Continue with empty array
      }

      const visitTrends = visitTrendsData.map(item => ({
        date: item.month,
        value: Number(item.count),
        label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));

      // Revenue trends - revenue by month
      let revenueTrendsData: Array<{ month: string; total: number }> = [];
      try {
        revenueTrendsData = await db.select({
          month: sql<string>`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`.as('month'),
          total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total')
        })
        .from(payments)
        .where(and(
          eq(payments.organizationId, orgId),
          gte(payments.paymentDate, sixMonthsAgo),
          eq(payments.status, 'completed')
        ))
        .groupBy(sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${payments.paymentDate}, 'YYYY-MM')`);
      } catch (err: any) {
        console.error('[Analytics] Error fetching revenue trends:', err?.message);
        // Continue with empty array
      }

      const revenueTrends = revenueTrendsData.map(item => ({
        date: item.month,
        value: Number(item.total),
        label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));

      // Lab order trends - lab orders by month
      let labOrderTrendsData: Array<{ month: string; count: number }> = [];
      try {
        labOrderTrendsData = await db.select({
          month: sql<string>`TO_CHAR(${labOrders.createdAt}, 'YYYY-MM')`.as('month'),
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(labOrders)
        .where(and(
          eq(labOrders.organizationId, orgId),
          gte(labOrders.createdAt, sixMonthsAgo)
        ))
        .groupBy(sql`TO_CHAR(${labOrders.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${labOrders.createdAt}, 'YYYY-MM')`);
      } catch (err: any) {
        console.error('[Analytics] Error fetching lab order trends:', err?.message);
        // Continue with empty array
      }

      const labOrderTrends = labOrderTrendsData.map(item => ({
        date: item.month,
        value: Number(item.count),
        label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));

      // Prescription trends - prescriptions by month
      let prescriptionTrendsData: Array<{ month: string; count: number }> = [];
      try {
        prescriptionTrendsData = await db.select({
          month: sql<string>`TO_CHAR(${prescriptions.createdAt}, 'YYYY-MM')`.as('month'),
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(prescriptions)
        .where(and(
          eq(prescriptions.organizationId, orgId),
          gte(prescriptions.createdAt, sixMonthsAgo)
        ))
        .groupBy(sql`TO_CHAR(${prescriptions.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${prescriptions.createdAt}, 'YYYY-MM')`);
      } catch (err: any) {
        console.error('[Analytics] Error fetching prescription trends:', err?.message);
        // Continue with empty array
      }

      const prescriptionTrends = prescriptionTrendsData.map(item => ({
        date: item.month,
        value: Number(item.count),
        label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));

      // Top diagnoses - from visits
      let topDiagnosesData: Array<{ diagnosis: string | null; count: number }> = [];
      try {
        topDiagnosesData = await db.select({
          diagnosis: visits.diagnosis,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(visits)
        .where(and(
          eq(visits.organizationId, orgId),
          isNotNull(visits.diagnosis),
          sql`${visits.diagnosis} != ''`
        ))
        .groupBy(visits.diagnosis)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);
      } catch (err: any) {
        console.error('[Analytics] Error fetching top diagnoses:', err?.message);
        // Continue with empty array
      }

      const totalDiagnoses = topDiagnosesData.reduce((sum, item) => sum + Number(item.count), 0);
      const topDiagnoses = topDiagnosesData.map(item => ({
        name: item.diagnosis || 'Unknown',
        count: Number(item.count),
        percentage: totalDiagnoses > 0 ? Math.round((Number(item.count) / totalDiagnoses) * 100) : 0
      }));

      // Top medications - from prescriptions
      let topMedicationsData: Array<{ medicationName: string | null; count: number }> = [];
      try {
        topMedicationsData = await db.select({
          medicationName: prescriptions.medicationName,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(prescriptions)
        .where(and(
          eq(prescriptions.organizationId, orgId),
          isNotNull(prescriptions.medicationName)
        ))
        .groupBy(prescriptions.medicationName)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);
      } catch (err: any) {
        console.error('[Analytics] Error fetching top medications:', err?.message);
        // Continue with empty array
      }

      const topMedications = topMedicationsData.map(item => ({
        name: item.medicationName || 'Unknown',
        count: Number(item.count)
      }));

      // Department stats - using visit types as departments
      let departmentStatsData: Array<{ visitType: string | null; patients: number; visits: number }> = [];
      try {
        departmentStatsData = await db.select({
          visitType: visits.visitType,
          patients: sql<number>`COUNT(DISTINCT ${visits.patientId})`.as('patients'),
          visits: sql<number>`COUNT(*)`.as('visits')
        })
        .from(visits)
        .where(and(
          eq(visits.organizationId, orgId),
          gte(visits.visitDate, sixMonthsAgo)
        ))
        .groupBy(visits.visitType)
        .orderBy(desc(sql`COUNT(*)`));
      } catch (err: any) {
        console.error('[Analytics] Error fetching department stats:', err?.message);
        // Continue with empty array
      }

      const departmentStats = departmentStatsData.map(item => ({
        name: item.visitType || 'General',
        patients: Number(item.patients),
        visits: Number(item.visits)
      }));

      // Ensure all trend arrays have at least some data points
      // Fill in missing months with zero values if needed
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(date.toISOString().slice(0, 7));
      }

      const fillTrendData = (trendData: Array<{ date: string; value: number; label?: string }>, isCumulative: boolean = false) => {
        const filled: Array<{ date: string; value: number; label?: string }> = [];
        months.forEach(month => {
          const existing = trendData.find(t => t.date === month);
          if (existing) {
            filled.push(existing);
          } else {
            // For cumulative trends (like patients), keep previous value; for counts, use 0
            const prevValue = isCumulative && filled.length > 0 ? filled[filled.length - 1].value : (isCumulative ? baselineCount : 0);
            filled.push({
              date: month,
              value: prevValue,
              label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            });
          }
        });
        return filled;
      };

      const response = {
        patientTrends: fillTrendData(patientTrends, true), // Cumulative
        visitTrends: fillTrendData(visitTrends, false), // Count per month
        revenueTrends: fillTrendData(revenueTrends, false), // Count per month
        labOrderTrends: fillTrendData(labOrderTrends, false), // Count per month
        prescriptionTrends: fillTrendData(prescriptionTrends, false), // Count per month
        topDiagnoses: topDiagnoses.length > 0 ? topDiagnoses : [
          { name: 'No diagnoses recorded', count: 0, percentage: 0 }
        ],
        topMedications: topMedications.length > 0 ? topMedications : [
          { name: 'No medications recorded', count: 0 }
        ],
        departmentStats: departmentStats.length > 0 ? departmentStats : [
          { name: 'General', patients: 0, visits: 0 }
        ]
      };
      
      console.log(`[Analytics] Successfully fetched dashboard data: ${response.patientTrends.length} patient trend points, ${response.visitTrends.length} visit trend points`);
      res.json(response);
    } catch (error: any) {
      console.error('[Analytics] Error fetching dashboard analytics:', error);
      console.error('[Analytics] Error stack:', error?.stack);
      console.error('[Analytics] Error details:', {
        message: error?.message,
        name: error?.name,
        code: error?.code
      });
      res.status(500).json({ 
        error: 'Failed to fetch dashboard analytics',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
    }
  });

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
