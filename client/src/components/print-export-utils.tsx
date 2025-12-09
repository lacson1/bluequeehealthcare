import html2pdf from 'html2pdf.js';
import Papa from 'papaparse';
import { 
  generatePrintDocument, 
  printWithOrganizationHeader,
  generateOrganizationHeaderHTML,
  OrganizationPrintHeader,
  type Organization as OrgType,
  type PrintHeaderOptions 
} from './organization-print-header';

export interface Organization {
  id: number;
  name: string;
  type: string;
  logoUrl?: string;
  themeColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  letterheadConfig?: {
    tagline?: string;
    accreditation?: string;
    certifications?: string[];
    footerNote?: string;
    disclaimer?: string;
    primaryColor?: string;
    secondaryColor?: string;
    showLogo?: boolean;
    showTagline?: boolean;
    showAccreditation?: boolean;
    showCertifications?: boolean;
  };
}

export interface PrintOptions {
  filename: string;
  organization?: Organization;
  showHeader?: boolean;
  format?: 'a4' | 'letter' | 'A4' | 'A5' | 'A6' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  documentTitle?: string;
  documentId?: string;
  showFooter?: boolean;
}

// Export data as CSV
export const exportToCSV = (data: any[], filename: string) => {
  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export CSV file');
  }
};

// Export HTML element as PDF
export const exportToPDF = async (elementId: string, options: PrintOptions) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const pdfOptions = {
      margin: [10, 10, 10, 10],
      filename: `${options.filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: options.format || 'a4', 
        orientation: options.orientation || 'portrait' 
      }
    };

    await html2pdf().set(pdfOptions).from(element).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF file');
  }
};

// Print current page or specific element
export const printElement = (elementId?: string) => {
  try {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }
      
      // Get computed styles from the element to ensure print matches preview
      const computedStyles = window.getComputedStyle(element);
      const bgColor = computedStyles.backgroundColor || '#f0fdf4';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
            <style>
              /* Reset and base styles */
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              
              @page {
                size: 148mm 210mm; /* A5 size */
                margin: 8mm;
              }
              
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #1f2937;
                background: ${bgColor};
                padding: 0;
                margin: 0;
              }
              
              /* Print container */
              .print-content {
                background: #f0fdf4;
                padding: 12px;
                max-width: 148mm;
                min-height: 200mm;
              }
              
              /* Header styles */
              .print-header {
                border-bottom: 2px solid #22c55e;
                padding-bottom: 10px;
                margin-bottom: 12px;
              }
              
              .print-header h1 {
                font-size: 16px;
                font-weight: bold;
                color: #166534;
                margin-bottom: 2px;
              }
              
              .print-header p {
                font-size: 10px;
                color: #4b5563;
              }
              
              /* Section styles */
              .section {
                margin-bottom: 10px;
                padding: 8px;
                background: #dcfce7;
                border-radius: 4px;
              }
              
              .section-title {
                font-size: 10px;
                font-weight: 600;
                color: #166534;
                margin-bottom: 6px;
                text-transform: uppercase;
              }
              
              /* Info grid */
              .info-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 4px 12px;
              }
              
              .info-item {
                font-size: 10px;
              }
              
              .info-item strong {
                color: #374151;
              }
              
              /* Medication styles */
              .medication {
                border-left: 3px solid #22c55e;
                padding-left: 8px;
                margin-bottom: 8px;
              }
              
              .medication h4 {
                font-size: 11px;
                font-weight: 600;
                color: #166534;
                margin-bottom: 4px;
              }
              
              .medication p {
                font-size: 10px;
                margin-bottom: 2px;
              }
              
              /* Footer */
              .print-footer {
                border-top: 1px solid #bbf7d0;
                padding-top: 8px;
                margin-top: 12px;
                font-size: 9px;
                color: #6b7280;
              }
              
              .signature-grid {
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
              }
              
              .signature-box {
                text-align: center;
              }
              
              .signature-line {
                border-top: 1px solid #374151;
                width: 80px;
                margin-top: 20px;
                padding-top: 4px;
                font-size: 8px;
              }
              
              /* Tailwind-like utility classes */
              .text-center { text-align: center; }
              .text-xs { font-size: 10px; }
              .text-sm { font-size: 11px; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mt-2 { margin-top: 8px; }
              .mt-3 { margin-top: 12px; }
              .p-2 { padding: 8px; }
              .p-3 { padding: 12px; }
              .p-4 { padding: 16px; }
              .pt-2 { padding-top: 8px; }
              .pb-4 { padding-bottom: 16px; }
              .pl-2 { padding-left: 8px; }
              .py-1 { padding-top: 4px; padding-bottom: 4px; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .border-t { border-top: 1px solid #d1d5db; }
              .border-b { border-bottom: 1px solid #d1d5db; }
              .border-l-2 { border-left: 2px solid #22c55e; }
              .rounded { border-radius: 4px; }
              .bg-green-50 { background-color: #f0fdf4; }
              .bg-green-100 { background-color: #dcfce7; }
              .text-gray-500 { color: #6b7280; }
              .text-gray-600 { color: #4b5563; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .gap-2 { gap: 8px; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .space-x-4 > * + * { margin-left: 16px; }
              
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  background: #f0fdf4 !important;
                }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="print-content">
              ${element.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
      // Fallback if onload doesn't fire
      setTimeout(() => {
        if (!printWindow.closed) {
      printWindow.print();
      printWindow.close();
        }
      }, 500);
    } else {
      window.print();
    }
  } catch (error) {
    console.error('Print failed:', error);
    throw new Error('Failed to print document');
  }
};

// Generate clinic header for documents
export const generateClinicHeader = (organization?: Organization) => {
  if (!organization) return null;

  return (
    <div className="print-header border-b-2 pb-4 mb-6" style={{ borderColor: organization.themeColor }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {organization.logoUrl && (
            <img 
              src={organization.logoUrl} 
              alt={`${organization.name} Logo`}
              className="h-16 w-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: organization.themeColor }}>
              {organization.name}
            </h1>
            <p className="text-sm text-gray-600 capitalize">{organization.type}</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          {organization.address && <p>{organization.address}</p>}
          {organization.phone && <p>Phone: {organization.phone}</p>}
          {organization.email && <p>Email: {organization.email}</p>}
          {organization.website && <p>Web: {organization.website}</p>}
        </div>
      </div>
    </div>
  );
};

// Format date for documents
export const formatDocumentDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Print with organization branded header
export const printWithBranding = (
  organization: Organization,
  options: {
    documentTitle: string;
    documentId?: string;
    documentDate?: Date | string;
    pageSize?: 'A4' | 'A5' | 'A6' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    showFooter?: boolean;
  },
  contentHTML: string
): void => {
  printWithOrganizationHeader(
    organization as OrgType,
    {
      documentTitle: options.documentTitle,
      documentId: options.documentId,
      documentDate: options.documentDate,
      pageSize: options.pageSize,
      orientation: options.orientation,
      showFooter: options.showFooter
    },
    contentHTML
  );
};

// Generate branded PDF document
export const generateBrandedPDF = async (
  organization: Organization,
  options: {
    filename: string;
    documentTitle: string;
    documentId?: string;
    documentDate?: Date | string;
    pageSize?: 'A4' | 'A5' | 'A6' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    showFooter?: boolean;
  },
  contentHTML: string
): Promise<void> => {
  const fullHTML = generatePrintDocument(
    organization as OrgType,
    {
      documentTitle: options.documentTitle,
      documentId: options.documentId,
      documentDate: options.documentDate,
      pageSize: options.pageSize,
      orientation: options.orientation,
      showFooter: options.showFooter
    },
    contentHTML
  );

  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = fullHTML;
  document.body.appendChild(container);

  const pageSizeMap: Record<string, string> = {
    'A4': 'a4',
    'A5': 'a5',
    'A6': 'a6',
    'Letter': 'letter'
  };

  try {
    const pdfOptions = {
      margin: [10, 10, 10, 10],
      filename: `${options.filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: pageSizeMap[options.pageSize || 'A4'] || 'a4', 
        orientation: options.orientation || 'portrait' 
      }
    };

    await html2pdf().set(pdfOptions).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
};

// Quick print function for common document types
export const quickPrint = {
  prescription: (org: Organization, patientName: string, prescriptionId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Prescription',
      documentId: `RX-${prescriptionId}`,
      pageSize: 'A5'
    }, content);
  },
  
  labOrder: (org: Organization, patientName: string, orderId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Laboratory Order',
      documentId: `LAB-${orderId}`,
      pageSize: 'A4'
    }, content);
  },
  
  labResult: (org: Organization, patientName: string, resultId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Laboratory Result Report',
      documentId: `LAB-${resultId}`,
      pageSize: 'A4'
    }, content);
  },
  
  consultation: (org: Organization, patientName: string, consultationId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Consultation Record',
      documentId: `CON-${consultationId}`,
      pageSize: 'A4'
    }, content);
  },
  
  discharge: (org: Organization, patientName: string, dischargeId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Discharge Summary',
      documentId: `DIS-${dischargeId}`,
      pageSize: 'A4'
    }, content);
  },
  
  certificate: (org: Organization, patientName: string, certId: string | number, certType: string, content: string) => {
    printWithBranding(org, {
      documentTitle: `Medical Certificate - ${certType}`,
      documentId: `CERT-${certId}`,
      pageSize: 'A4'
    }, content);
  },
  
  invoice: (org: Organization, patientName: string, invoiceId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Invoice',
      documentId: `INV-${invoiceId}`,
      pageSize: 'A4'
    }, content);
  },
  
  receipt: (org: Organization, patientName: string, receiptId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Payment Receipt',
      documentId: `REC-${receiptId}`,
      pageSize: 'A5'
    }, content);
  },
  
  referral: (org: Organization, patientName: string, referralId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Referral Letter',
      documentId: `REF-${referralId}`,
      pageSize: 'A4'
    }, content);
  },

  appointment: (org: Organization, patientName: string, appointmentId: string | number, content: string) => {
    printWithBranding(org, {
      documentTitle: 'Appointment Confirmation',
      documentId: `APT-${appointmentId}`,
      pageSize: 'A5'
    }, content);
  }
};

// Re-export organization print header utilities
export { 
  generatePrintDocument, 
  printWithOrganizationHeader,
  generateOrganizationHeaderHTML,
  OrganizationPrintHeader 
} from './organization-print-header';