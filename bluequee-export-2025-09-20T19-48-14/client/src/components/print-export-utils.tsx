import html2pdf from 'html2pdf.js';
import Papa from 'papaparse';

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
}

export interface PrintOptions {
  filename: string;
  organization?: Organization;
  showHeader?: boolean;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
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
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
            <link rel="stylesheet" href="/src/index.css">
            <style>
              @media print {
                body { margin: 0; padding: 20px; }
                .no-print { display: none !important; }
                .print-only { display: block !important; }
              }
              .no-print { display: none; }
              .print-only { display: none; }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
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