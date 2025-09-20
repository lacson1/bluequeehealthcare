import { db } from './storage';
import { invoices, invoiceItems, payments, patients, users, organizations } from '../shared/schema';
import { sql, eq, and, gte, lte, desc, inArray } from 'drizzle-orm';

export interface AnalyticsFilters {
  organizationId: number;
  startDate?: Date;
  endDate?: Date;
  period?: 'week' | 'month' | 'quarter' | 'year';
  serviceType?: string;
  paymentMethod?: string;
  patientId?: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  collectedRevenue: number;
  outstandingReceivables: number;
  averageInvoiceValue: number;
  averagePaymentTime: number;
  collectionRate: number;
  growthRate: number;
}

export interface PatientAnalytics {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  averageRevenuePerPatient: number;
  patientRetentionRate: number;
  topPayingPatients: Array<{
    patientId: number;
    patientName: string;
    totalSpent: number;
    visitCount: number;
  }>;
}

export interface ServiceAnalytics {
  serviceType: string;
  serviceName: string;
  totalRevenue: number;
  transactionCount: number;
  averagePrice: number;
  profitMargin: number;
  marketShare: number;
  growth: number;
}

export interface FinancialTrends {
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    invoiceCount: number;
    paymentCount: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
  paymentPatterns: Array<{
    method: string;
    total: number;
    percentage: number;
    averageAmount: number;
  }>;
}

export class BillingAnalytics {
  
  static async getRevenueMetrics(filters: AnalyticsFilters): Promise<RevenueMetrics> {
    const { organizationId, startDate, endDate } = filters;
    
    // Total invoiced amount
    const [totalInvoiced] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`.as('total')
    })
    .from(invoices)
    .where(and(
      eq(invoices.organizationId, organizationId),
      startDate ? gte(invoices.createdAt, startDate) : sql`1=1`,
      endDate ? lte(invoices.createdAt, endDate) : sql`1=1`
    ));

    // Total collected payments
    const [totalCollected] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total')
    })
    .from(payments)
    .where(and(
      eq(payments.organizationId, organizationId),
      eq(payments.status, 'completed'),
      startDate ? gte(payments.paymentDate, startDate) : sql`1=1`,
      endDate ? lte(payments.paymentDate, endDate) : sql`1=1`
    ));

    // Outstanding receivables
    const [outstanding] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(${invoices.balanceAmount} AS DECIMAL)), 0)`.as('total')
    })
    .from(invoices)
    .where(and(
      eq(invoices.organizationId, organizationId),
      sql`${invoices.balanceAmount} > 0`,
      inArray(invoices.status, ['sent', 'overdue'])
    ));

    // Average invoice value
    const [avgInvoice] = await db.select({
      average: sql<number>`COALESCE(AVG(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`.as('average')
    })
    .from(invoices)
    .where(and(
      eq(invoices.organizationId, organizationId),
      startDate ? gte(invoices.createdAt, startDate) : sql`1=1`,
      endDate ? lte(invoices.createdAt, endDate) : sql`1=1`
    ));

    // Collection rate
    const collectionRate = totalInvoiced.total > 0 ? 
      (totalCollected.total / totalInvoiced.total) * 100 : 0;

    // Growth rate calculation (compared to previous period)
    let growthRate = 0;
    if (startDate && endDate) {
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - periodLength);
      const prevEnd = new Date(endDate.getTime() - periodLength);

      const [prevRevenue] = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total')
      })
      .from(payments)
      .where(and(
        eq(payments.organizationId, organizationId),
        eq(payments.status, 'completed'),
        gte(payments.paymentDate, prevStart),
        lte(payments.paymentDate, prevEnd)
      ));

      if (prevRevenue.total > 0) {
        growthRate = ((totalCollected.total - prevRevenue.total) / prevRevenue.total) * 100;
      }
    }

    return {
      totalRevenue: totalInvoiced.total,
      collectedRevenue: totalCollected.total,
      outstandingReceivables: outstanding.total,
      averageInvoiceValue: avgInvoice.average,
      averagePaymentTime: 0, // Would need payment timestamp analysis
      collectionRate,
      growthRate
    };
  }

  static async getPatientAnalytics(filters: AnalyticsFilters): Promise<PatientAnalytics> {
    const { organizationId, startDate, endDate } = filters;

    // Total unique patients with invoices
    const [totalPatients] = await db.select({
      count: sql<number>`COUNT(DISTINCT ${invoices.patientId})`.as('count')
    })
    .from(invoices)
    .where(and(
      eq(invoices.organizationId, organizationId),
      startDate ? gte(invoices.createdAt, startDate) : sql`1=1`,
      endDate ? lte(invoices.createdAt, endDate) : sql`1=1`
    ));

    // New patients (first invoice in period)
    const [newPatients] = await db.select({
      count: sql<number>`COUNT(DISTINCT ${invoices.patientId})`.as('count')
    })
    .from(invoices)
    .where(and(
      eq(invoices.organizationId, organizationId),
      startDate ? gte(invoices.createdAt, startDate) : sql`1=1`,
      endDate ? lte(invoices.createdAt, endDate) : sql`1=1`,
      sql`${invoices.patientId} NOT IN (
        SELECT DISTINCT patient_id FROM invoices i2 
        WHERE i2.organization_id = ${organizationId} 
        AND i2.created_at < ${startDate || new Date('1900-01-01')}
      )`
    ));

    // Average revenue per patient
    const [avgRevenuePerPatient] = await db.select({
      average: sql<number>`COALESCE(AVG(patient_total), 0)`.as('average')
    })
    .from(
      db.select({
        patientTotal: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`.as('patient_total')
      })
      .from(invoices)
      .where(and(
        eq(invoices.organizationId, organizationId),
        startDate ? gte(invoices.createdAt, startDate) : sql`1=1`,
        endDate ? lte(invoices.createdAt, endDate) : sql`1=1`
      ))
      .groupBy(invoices.patientId)
      .as('patient_totals')
    );

    // Top paying patients
    const topPatients = await db.select({
      patientId: invoices.patientId,
      patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`.as('patientName'),
      totalSpent: sql<number>`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`.as('totalSpent'),
      visitCount: sql<number>`COUNT(*)`.as('visitCount')
    })
    .from(invoices)
    .innerJoin(patients, eq(invoices.patientId, patients.id))
    .where(and(
      eq(invoices.organizationId, organizationId),
      startDate ? gte(invoices.createdAt, startDate) : sql`1=1`,
      endDate ? lte(invoices.createdAt, endDate) : sql`1=1`
    ))
    .groupBy(invoices.patientId, patients.firstName, patients.lastName)
    .orderBy(desc(sql`SUM(CAST(${invoices.totalAmount} AS DECIMAL))`))
    .limit(10);

    return {
      totalPatients: totalPatients.count,
      newPatients: newPatients.count,
      returningPatients: totalPatients.count - newPatients.count,
      averageRevenuePerPatient: avgRevenuePerPatient.average,
      patientRetentionRate: totalPatients.count > 0 ? 
        ((totalPatients.count - newPatients.count) / totalPatients.count) * 100 : 0,
      topPayingPatients: topPatients
    };
  }

  static async getServiceAnalytics(filters: AnalyticsFilters): Promise<ServiceAnalytics[]> {
    const { organizationId, startDate, endDate } = filters;

    const serviceData = await db.select({
      serviceType: invoiceItems.serviceType,
      serviceName: invoiceItems.serviceName,
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL)), 0)`.as('totalRevenue'),
      transactionCount: sql<number>`COUNT(*)`.as('transactionCount'),
      averagePrice: sql<number>`COALESCE(AVG(CAST(${invoiceItems.unitPrice} AS DECIMAL)), 0)`.as('averagePrice'),
      marketShare: sql<number>`ROUND(
        (COALESCE(SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL)), 0) * 100.0) / 
        NULLIF((SELECT SUM(CAST(total_price AS DECIMAL)) FROM invoice_items ij 
                INNER JOIN invoices i ON ij.invoice_id = i.id 
                WHERE i.organization_id = ${organizationId}), 0), 2
      )`.as('marketShare')
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(and(
      eq(invoices.organizationId, organizationId),
      startDate ? gte(invoices.createdAt, startDate) : sql`1=1`,
      endDate ? lte(invoices.createdAt, endDate) : sql`1=1`
    ))
    .groupBy(invoiceItems.serviceType, invoiceItems.serviceName)
    .orderBy(desc(sql`SUM(CAST(${invoiceItems.totalPrice} AS DECIMAL))`));

    return serviceData.map(service => ({
      serviceType: service.serviceType,
      serviceName: service.serviceName,
      totalRevenue: service.totalRevenue,
      transactionCount: service.transactionCount,
      averagePrice: service.averagePrice,
      profitMargin: 0, // Would need cost data
      marketShare: service.marketShare,
      growth: 0 // Would need period comparison
    }));
  }

  static async getFinancialTrends(filters: AnalyticsFilters): Promise<FinancialTrends> {
    const { organizationId, startDate, endDate } = filters;

    // Daily revenue trend
    const dailyRevenue = await db.select({
      date: sql<string>`DATE(${payments.paymentDate})`.as('date'),
      revenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('revenue'),
      invoiceCount: sql<number>`COUNT(DISTINCT ${payments.invoiceId})`.as('invoiceCount'),
      paymentCount: sql<number>`COUNT(*)`.as('paymentCount')
    })
    .from(payments)
    .where(and(
      eq(payments.organizationId, organizationId),
      eq(payments.status, 'completed'),
      startDate ? gte(payments.paymentDate, startDate) : sql`1=1`,
      endDate ? lte(payments.paymentDate, endDate) : sql`1=1`
    ))
    .groupBy(sql`DATE(${payments.paymentDate})`)
    .orderBy(sql`DATE(${payments.paymentDate})`);

    // Payment method breakdown
    const paymentPatterns = await db.select({
      method: payments.paymentMethod,
      total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`.as('total'),
      percentage: sql<number>`ROUND(
        (COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0) * 100.0) / 
        NULLIF((SELECT SUM(CAST(amount AS DECIMAL)) FROM payments 
                WHERE organization_id = ${organizationId} 
                AND status = 'completed'), 0), 2
      )`.as('percentage'),
      averageAmount: sql<number>`COALESCE(AVG(CAST(${payments.amount} AS DECIMAL)), 0)`.as('averageAmount')
    })
    .from(payments)
    .where(and(
      eq(payments.organizationId, organizationId),
      eq(payments.status, 'completed'),
      startDate ? gte(payments.paymentDate, startDate) : sql`1=1`,
      endDate ? lte(payments.paymentDate, endDate) : sql`1=1`
    ))
    .groupBy(payments.paymentMethod)
    .orderBy(desc(sql`SUM(CAST(${payments.amount} AS DECIMAL))`));

    return {
      dailyRevenue,
      monthlyGrowth: [], // Would need monthly aggregation
      paymentPatterns
    };
  }

  static async getComprehensiveAnalytics(filters: AnalyticsFilters) {
    const [revenue, patients, services, trends] = await Promise.all([
      this.getRevenueMetrics(filters),
      this.getPatientAnalytics(filters),
      this.getServiceAnalytics(filters),
      this.getFinancialTrends(filters)
    ]);

    return {
      revenue,
      patients,
      services,
      trends,
      summary: {
        totalInvoices: 0, // Would need count
        averageCollectionTime: 0, // Would need timestamp analysis
        topPerformingServices: services.slice(0, 5),
        paymentMethodPreference: trends.paymentPatterns[0]?.method || 'cash'
      }
    };
  }
}