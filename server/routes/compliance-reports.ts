import type { Express, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { db } from "../db";
import { patients, visits, users, auditLogs, invoices, invoiceItems, medications, prescriptions, appointments, labResults, labTests } from "@shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function setupComplianceReportRoutes(app: Express) {
  
  // Generate compliance report with real data
  app.post("/api/compliance/reports/generate", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { reportId, dateRange } = req.body;
      const user = (req as any).user;
      const userId = user?.id;
      const organizationId = user?.organizationId || user?.currentOrganizationId;

      if (!userId || !organizationId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let reportData: any = {};
      let filename = '';
      let buffer: Buffer;

      switch (reportId) {
        case 'patient-registry':
          reportData = await generatePatientRegistryData(organizationId, dateRange);
          buffer = await generateExcelReport(reportData, 'Patient Registry Report');
          filename = `patient-registry-${new Date().toISOString().split('T')[0]}.xlsx`;
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          break;

        case 'clinical-audit':
          reportData = await generateClinicalAuditData(organizationId, dateRange);
          buffer = await generatePDFReport(reportData, 'Clinical Audit Trail');
          filename = `clinical-audit-${new Date().toISOString().split('T')[0]}.pdf`;
          res.setHeader('Content-Type', 'application/pdf');
          break;

        case 'financial-summary':
          reportData = await generateFinancialSummaryData(organizationId, dateRange);
          buffer = await generateExcelReport(reportData, 'Financial Summary Report');
          filename = `financial-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          break;

        case 'medication-inventory':
          reportData = await generateMedicationInventoryData(organizationId, dateRange);
          buffer = generateCSVReport(reportData);
          filename = `medication-inventory-${new Date().toISOString().split('T')[0]}.csv`;
          res.setHeader('Content-Type', 'text/csv');
          break;

        case 'staff-activity':
          reportData = await generateStaffActivityData(organizationId, dateRange);
          buffer = await generatePDFReport(reportData, 'Staff Activity Report');
          filename = `staff-activity-${new Date().toISOString().split('T')[0]}.pdf`;
          res.setHeader('Content-Type', 'application/pdf');
          break;

        case 'infection-control':
          reportData = await generateInfectionControlData(organizationId, dateRange);
          buffer = generateXMLReport(reportData, 'Infection Control Report');
          filename = `infection-control-${new Date().toISOString().split('T')[0]}.xml`;
          res.setHeader('Content-Type', 'application/xml');
          break;

        default:
          return res.status(400).json({ message: "Invalid report type" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });
}

// Data fetching functions
async function generatePatientRegistryData(organizationId: number, dateRange?: { from: string; to: string }) {
  const conditions = [eq(patients.organizationId, organizationId)];
  
  if (dateRange?.from) {
    conditions.push(gte(patients.createdAt, new Date(dateRange.from)));
  }
  if (dateRange?.to) {
    conditions.push(lte(patients.createdAt, new Date(dateRange.to)));
  }

  const patientData = await db.select({
    id: patients.id,
    firstName: patients.firstName,
    lastName: patients.lastName,
    dateOfBirth: patients.dateOfBirth,
    gender: patients.gender,
    phone: patients.phone,
    email: patients.email,
    address: patients.address,
    allergies: patients.allergies,
    createdAt: patients.createdAt,
  })
  .from(patients)
  .where(and(...conditions))
  .orderBy(desc(patients.createdAt));

  return {
    title: 'Patient Registry Report',
    columns: ['ID', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Phone', 'Email', 'Address', 'Allergies', 'Registered Date'],
    data: patientData.map(p => [
      p.id,
      p.firstName,
      p.lastName,
      p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A',
      p.gender || 'N/A',
      p.phone || 'N/A',
      p.email || 'N/A',
      p.address || 'N/A',
      p.allergies || 'N/A',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'
    ])
  };
}

async function generateClinicalAuditData(organizationId: number, dateRange?: { from: string; to: string }) {
  const conditions: any[] = [];
  
  if (dateRange?.from) {
    conditions.push(gte(auditLogs.timestamp, new Date(dateRange.from)));
  }
  if (dateRange?.to) {
    conditions.push(lte(auditLogs.timestamp, new Date(dateRange.to)));
  }

  const auditData = await db.select({
    id: auditLogs.id,
    userId: auditLogs.userId,
    action: auditLogs.action,
    details: auditLogs.details,
    timestamp: auditLogs.timestamp,
    username: users.username,
    firstName: users.firstName,
    lastName: users.lastName,
  })
  .from(auditLogs)
  .leftJoin(users, eq(auditLogs.userId, users.id))
  .where(conditions.length > 0 ? and(...conditions) : undefined)
  .orderBy(desc(auditLogs.timestamp))
  .limit(1000);

  return {
    title: 'Clinical Audit Trail',
    columns: ['ID', 'User', 'Action', 'Details', 'Timestamp'],
    data: auditData.map(a => [
      a.id,
      `${a.firstName || ''} ${a.lastName || ''} (${a.username})`.trim() || 'Unknown',
      a.action,
      a.details || 'N/A',
      a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A'
    ])
  };
}

async function generateFinancialSummaryData(organizationId: number, dateRange?: { from: string; to: string }) {
  const conditions = [eq(invoices.organizationId, organizationId)];
  
  if (dateRange?.from) {
    conditions.push(gte(invoices.createdAt, new Date(dateRange.from)));
  }
  if (dateRange?.to) {
    conditions.push(lte(invoices.createdAt, new Date(dateRange.to)));
  }

  const financialData = await db.select({
    id: invoices.id,
    invoiceNumber: invoices.invoiceNumber,
    patientId: invoices.patientId,
    totalAmount: invoices.totalAmount,
    paidAmount: invoices.paidAmount,
    status: invoices.status,
    createdAt: invoices.createdAt,
    patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
  })
  .from(invoices)
  .leftJoin(patients, eq(invoices.patientId, patients.id))
  .where(and(...conditions))
  .orderBy(desc(invoices.createdAt));

  return {
    title: 'Financial Summary Report',
    columns: ['Invoice Number', 'Patient', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Date'],
    data: financialData.map(f => [
      f.invoiceNumber,
      f.patientName || 'Unknown',
      `₦${parseFloat(f.totalAmount || '0').toLocaleString()}`,
      `₦${parseFloat(f.paidAmount || '0').toLocaleString()}`,
      `₦${(parseFloat(f.totalAmount || '0') - parseFloat(f.paidAmount || '0')).toLocaleString()}`,
      f.status,
      f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'N/A'
    ])
  };
}

async function generateMedicationInventoryData(organizationId: number, dateRange?: { from: string; to: string }) {
  const medicationData = await db.select({
    id: medications.id,
    name: medications.name,
    strength: medications.strength,
    dosageForm: medications.dosageForm,
    genericName: medications.genericName,
    brandName: medications.brandName,
    manufacturer: medications.manufacturer,
    costPerUnit: medications.costPerUnit,
  })
  .from(medications)
  .orderBy(medications.name);

  return {
    title: 'Medication Inventory Report',
    columns: ['ID', 'Medication Name', 'Generic Name', 'Brand Name', 'Strength', 'Dosage Form', 'Manufacturer', 'Cost/Unit'],
    data: medicationData.map(m => [
      m.id,
      m.name,
      m.genericName || 'N/A',
      m.brandName || 'N/A',
      m.strength || 'N/A',
      m.dosageForm || 'N/A',
      m.manufacturer || 'N/A',
      m.costPerUnit ? `₦${parseFloat(m.costPerUnit).toLocaleString()}` : 'N/A'
    ])
  };
}

async function generateStaffActivityData(organizationId: number, dateRange?: { from: string; to: string }) {
  const conditions = [eq(users.organizationId, organizationId)];

  const staffData = await db.select({
    id: users.id,
    username: users.username,
    firstName: users.firstName,
    lastName: users.lastName,
    role: users.role,
    lastLoginAt: users.lastLoginAt,
    createdAt: users.createdAt,
  })
  .from(users)
  .where(and(...conditions))
  .orderBy(users.username);

  return {
    title: 'Staff Activity Report',
    columns: ['ID', 'Username', 'Full Name', 'Role', 'Last Login', 'Account Created'],
    data: staffData.map(s => [
      s.id,
      s.username,
      `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'N/A',
      s.role,
      s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : 'Never',
      s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'
    ])
  };
}

async function generateInfectionControlData(organizationId: number, dateRange?: { from: string; to: string }) {
  const conditions = [eq(visits.organizationId, organizationId)];
  
  if (dateRange?.from) {
    conditions.push(gte(visits.visitDate, new Date(dateRange.from)));
  }
  if (dateRange?.to) {
    conditions.push(lte(visits.visitDate, new Date(dateRange.to)));
  }

  const infectionData = await db.select({
    visitId: visits.id,
    patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
    visitDate: visits.visitDate,
    diagnosis: visits.diagnosis,
    treatment: visits.treatment,
  })
  .from(visits)
  .leftJoin(patients, eq(visits.patientId, patients.id))
  .where(and(...conditions))
  .orderBy(desc(visits.visitDate))
  .limit(500);

  return {
    title: 'Infection Control Report',
    columns: ['Visit ID', 'Patient', 'Visit Date', 'Diagnosis', 'Treatment'],
    data: infectionData.map(i => [
      i.visitId,
      i.patientName || 'Unknown',
      i.visitDate ? new Date(i.visitDate).toLocaleDateString() : 'N/A',
      i.diagnosis || 'N/A',
      i.treatment || 'N/A'
    ])
  };
}

// File generation utilities
async function generateExcelReport(reportData: any, title: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  // Add title
  worksheet.mergeCells('A1', String.fromCharCode(64 + reportData.columns.length) + '1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = reportData.title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  // Add generation date
  worksheet.mergeCells('A2', String.fromCharCode(64 + reportData.columns.length) + '2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generated: ${new Date().toLocaleString()}`;
  dateCell.alignment = { horizontal: 'center' };

  // Add headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow(reportData.columns);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  reportData.data.forEach((row: any[]) => {
    worksheet.addRow(row);
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

async function generatePDFReport(reportData: any, title: string): Promise<Buffer> {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.title, 14, 20);

  // Generation date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Table
  autoTable(doc, {
    head: [reportData.columns],
    body: reportData.data,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 35 }
  });

  return Buffer.from(doc.output('arraybuffer'));
}

function generateCSVReport(reportData: any): Buffer {
  let csv = reportData.columns.join(',') + '\n';
  reportData.data.forEach((row: any[]) => {
    csv += row.map((cell: any) => `"${cell}"`).join(',') + '\n';
  });
  return Buffer.from(csv, 'utf-8');
}

function generateXMLReport(reportData: any, title: string): Buffer {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<report>\n`;
  xml += `  <title>${reportData.title}</title>\n`;
  xml += `  <generated>${new Date().toISOString()}</generated>\n`;
  xml += `  <data>\n`;
  
  reportData.data.forEach((row: any[], index: number) => {
    xml += `    <record id="${index + 1}">\n`;
    reportData.columns.forEach((col: string, i: number) => {
      const tag = col.toLowerCase().replace(/\s+/g, '_');
      xml += `      <${tag}>${row[i]}</${tag}>\n`;
    });
    xml += `    </record>\n`;
  });
  
  xml += `  </data>\n`;
  xml += `</report>`;
  
  return Buffer.from(xml, 'utf-8');
}
