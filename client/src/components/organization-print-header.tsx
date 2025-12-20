import React from 'react';
import { format } from 'date-fns';

export interface Organization {
  id: number;
  name: string;
  type: string;
  logoUrl?: string;
  themeColor?: string;
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

export interface PrintHeaderOptions {
  documentTitle: string;
  documentId?: string;
  documentDate?: Date | string;
  showFooter?: boolean;
  pageSize?: 'A4' | 'A5' | 'A6' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

// Format organization type for display
const formatOrgType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'clinic': 'Medical Clinic',
    'hospital': 'Hospital',
    'health_center': 'Health Center',
    'pharmacy': 'Pharmacy',
    'diagnostic_center': 'Diagnostic Center',
    'dental_clinic': 'Dental Clinic',
    'eye_clinic': 'Eye Clinic',
    'specialist_center': 'Specialist Center'
  };
  return typeMap[type] || 'Healthcare Facility';
};

// Generate the organization branded print header HTML
export const generateOrganizationHeaderHTML = (
  organization: Organization,
  options: PrintHeaderOptions
): string => {
  const config = organization.letterheadConfig || {};
  const primaryColor = config.primaryColor || organization.themeColor || '#1e40af';
  const secondaryColor = config.secondaryColor || '#3b82f6';
  const docDate = options.documentDate ? new Date(options.documentDate) : new Date();

  const logoContent = organization.logoUrl
    ? `<img src="${organization.logoUrl}" alt="${organization.name}" class="org-logo-img">`
    : `<div class="org-logo-text">${(organization.name || 'HC').substring(0, 2).toUpperCase()}</div>`;

  return `
    <div class="organization-header">
      <div class="header-gradient" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);">
        <div class="header-pattern"></div>
        <div class="header-content">
          <div class="org-identity">
            <div class="org-logo-container">
              ${logoContent}
            </div>
            <div class="org-info">
              <h1 class="org-name">${organization.name}</h1>
              <p class="org-type">${formatOrgType(organization.type)}</p>
              ${config.showTagline !== false && config.tagline ? `<p class="org-tagline">${config.tagline}</p>` : ''}
              ${config.showAccreditation !== false && config.accreditation ? `<span class="org-accreditation">${config.accreditation}</span>` : ''}
            </div>
          </div>
          <div class="contact-info">
            ${organization.address ? `<div class="contact-item"><span class="contact-icon">📍</span> ${organization.address}</div>` : ''}
            ${organization.phone ? `<div class="contact-item"><span class="contact-icon">📞</span> ${organization.phone}</div>` : ''}
            ${organization.email ? `<div class="contact-item"><span class="contact-icon">✉️</span> ${organization.email}</div>` : ''}
            ${organization.website ? `<div class="contact-item"><span class="contact-icon">🌐</span> ${organization.website}</div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="document-title-bar" style="border-left-color: ${primaryColor};">
        <div class="title-content">
          <h2 class="document-title" style="color: ${primaryColor};">${options.documentTitle}</h2>
          <div class="document-meta">
            ${options.documentId ? `<span class="meta-item">Doc ID: ${options.documentId}</span>` : ''}
            <span class="meta-item">Date: ${format(docDate, 'PPP')}</span>
            <span class="meta-item">Generated: ${format(new Date(), 'PPP p')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Generate complete print document with header and footer
export const generatePrintDocument = (
  organization: Organization,
  options: PrintHeaderOptions,
  contentHTML: string
): string => {
  const config = organization.letterheadConfig || {};
  const primaryColor = config.primaryColor || organization.themeColor || '#1e40af';
  const secondaryColor = config.secondaryColor || '#3b82f6';

  const pageSettings = {
    'A4': { size: 'A4', margin: '15mm 20mm' },
    'A5': { size: 'A5', margin: '10mm 15mm' },
    'A6': { size: 'A6', margin: '8mm 10mm' },
    'Letter': { size: 'letter', margin: '15mm 20mm' }
  };

  const page = pageSettings[options.pageSize || 'A4'];

  const styles = `
    <style>
      @page {
        size: ${page.size} ${options.orientation || 'portrait'};
        margin: ${page.margin};
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.5;
        color: #1f2937;
        background: white;
        font-size: 11pt;
      }
      
      /* Header Styles */
      .organization-header {
        margin-bottom: 20px;
      }
      
      .header-gradient {
        color: white;
        padding: 20px 25px;
        position: relative;
        overflow: hidden;
        border-radius: 0 0 8px 8px;
      }
      
      .header-pattern {
        position: absolute;
        top: -50%;
        right: -20%;
        width: 100%;
        height: 200%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        opacity: 0.5;
      }
      
      .header-content {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      
      .org-identity {
        display: flex;
        align-items: flex-start;
        gap: 15px;
      }
      
      .org-logo-container {
        flex-shrink: 0;
      }
      
      .org-logo-img {
        width: 65px;
        height: 65px;
        object-fit: contain;
        background: white;
        padding: 8px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      
      .org-logo-text {
        width: 65px;
        height: 65px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
      
      .org-info {
        flex: 1;
      }
      
      .org-name {
        font-size: 24pt;
        font-weight: 700;
        margin-bottom: 2px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        letter-spacing: -0.5px;
      }
      
      .org-type {
        font-size: 10pt;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 6px;
      }
      
      .org-tagline {
        font-size: 10pt;
        font-style: italic;
        opacity: 0.85;
        margin-bottom: 8px;
      }
      
      .org-accreditation {
        font-size: 9pt;
        background: rgba(255, 255, 255, 0.2);
        padding: 3px 8px;
        border-radius: 4px;
        display: inline-block;
      }
      
      .contact-info {
        text-align: right;
        font-size: 9pt;
        opacity: 0.95;
      }
      
      .contact-item {
        margin: 3px 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 5px;
      }
      
      .contact-icon {
        font-size: 10pt;
      }
      
      /* Document Title Bar */
      .document-title-bar {
        background: #f8fafc;
        border-left: 4px solid;
        padding: 12px 18px;
        margin-top: 15px;
        border-radius: 0 4px 4px 0;
      }
      
      .title-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .document-title {
        font-size: 16pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0;
      }
      
      .document-meta {
        display: flex;
        gap: 15px;
        font-size: 9pt;
        color: #6b7280;
      }
      
      .meta-item {
        display: inline-flex;
        align-items: center;
      }
      
      /* Content Area */
      .document-content {
        padding: 20px 0;
        min-height: 400px;
      }
      
      /* Footer Styles */
      .organization-footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 2px solid ${primaryColor};
        background: #f8fafc;
        padding: 15px 20px;
        border-radius: 4px;
      }
      
      .certifications {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }
      
      .certification-badge {
        background: ${primaryColor};
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 8pt;
        font-weight: 500;
      }
      
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9pt;
        color: #6b7280;
      }
      
      .footer-note {
        font-style: italic;
        margin-bottom: 5px;
        font-size: 9pt;
      }
      
      .footer-org-name {
        font-weight: 600;
        color: ${primaryColor};
      }
      
      .disclaimer {
        font-size: 8pt;
        color: #9ca3af;
        text-align: center;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e5e7eb;
        line-height: 1.4;
      }
      
      /* Print-specific styles */
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .organization-header {
          break-inside: avoid;
        }
        
        .organization-footer {
          break-inside: avoid;
        }
        
        .no-print {
          display: none !important;
        }
      }
      
      /* Signature Section */
      .signature-section {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
        gap: 40px;
      }
      
      .signature-box {
        flex: 1;
        text-align: center;
      }
      
      .signature-line {
        border-top: 1px solid #374151;
        margin-top: 50px;
        padding-top: 8px;
        font-size: 10pt;
        color: #374151;
      }
    </style>
  `;

  const footerHTML = options.showFooter !== false ? `
    <div class="organization-footer">
      ${config.showCertifications !== false && config.certifications?.length ? `
        <div class="certifications">
          ${config.certifications.map(cert => `<span class="certification-badge">${cert}</span>`).join('')}
        </div>
      ` : ''}
      <div class="footer-content">
        <div>
          ${config.footerNote ? `<div class="footer-note">${config.footerNote}</div>` : ''}
          <span class="footer-org-name">${organization.name}</span> | ${formatOrgType(organization.type)}
        </div>
        <div>
          Printed: ${format(new Date(), 'PPP p')}
        </div>
      </div>
      <div class="disclaimer">
        ${config.disclaimer || 'This document is confidential and intended solely for the addressed recipient. Unauthorized disclosure, copying, or distribution is strictly prohibited.'}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.documentTitle} - ${organization.name}</title>
      ${styles}
    </head>
    <body>
      ${generateOrganizationHeaderHTML(organization, options)}
      
      <div class="document-content">
        ${contentHTML}
      </div>
      
      ${footerHTML}
    </body>
    </html>
  `;
};

// Open print window with organization branded document
export const printWithOrganizationHeader = (
  organization: Organization,
  options: PrintHeaderOptions,
  contentHTML: string
): void => {
  const fullHTML = generatePrintDocument(organization, options, contentHTML);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHTML);
    printWindow.document.close();
    
    // Wait for the window to be ready before printing
    const tryPrint = () => {
      try {
        if (printWindow && !printWindow.closed) {
          printWindow.focus();
          printWindow.print();
        }
      } catch (error) {
        console.error('Print error:', error);
      }
    };

    // Method 1: Check if already loaded
    if (printWindow.document.readyState === 'complete') {
      setTimeout(tryPrint, 100);
    } else {
      // Wait for load event
      printWindow.addEventListener('load', () => {
        setTimeout(tryPrint, 250);
      }, { once: true });
    }

    // Method 2: Fallback timeout
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        tryPrint();
      }
    }, 500);
  }
};

// React component for organization print header (for preview)
interface OrganizationPrintHeaderProps {
  organization: Organization;
  documentTitle: string;
  documentId?: string;
  documentDate?: Date | string;
}

export const OrganizationPrintHeader: React.FC<OrganizationPrintHeaderProps> = ({
  organization,
  documentTitle,
  documentId,
  documentDate
}) => {
  const config = organization.letterheadConfig || {};
  const primaryColor = config.primaryColor || organization.themeColor || '#1e40af';
  const secondaryColor = config.secondaryColor || '#3b82f6';
  const docDate = documentDate ? new Date(documentDate) : new Date();

  return (
    <div className="organization-print-header">
      {/* Header with gradient */}
      <div 
        className="text-white p-5 relative overflow-hidden rounded-b-lg"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23fff' fill-opacity='0.1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {organization.logoUrl ? (
                <img 
                  src={organization.logoUrl} 
                  alt={organization.name}
                  className="w-16 h-16 object-contain bg-white p-2 rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                  {(organization.name || 'HC').substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Organization Info */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{organization.name}</h1>
              <p className="text-sm opacity-90 uppercase tracking-wider">{formatOrgType(organization.type)}</p>
              {config.showTagline !== false && config.tagline && (
                <p className="text-sm italic opacity-85 mt-1">{config.tagline}</p>
              )}
              {config.showAccreditation !== false && config.accreditation && (
                <span className="inline-block text-xs bg-white/20 px-2 py-1 rounded mt-2">
                  {config.accreditation}
                </span>
              )}
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="text-right text-sm opacity-95 space-y-1">
            {organization.address && <div>📍 {organization.address}</div>}
            {organization.phone && <div>📞 {organization.phone}</div>}
            {organization.email && <div>✉️ {organization.email}</div>}
            {organization.website && <div>🌐 {organization.website}</div>}
          </div>
        </div>
      </div>
      
      {/* Document Title Bar */}
      <div 
        className="bg-slate-50 border-l-4 px-4 py-3 mt-4 rounded-r"
        style={{ borderLeftColor: primaryColor }}
      >
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
            {documentTitle}
          </h2>
          <div className="flex gap-4 text-sm text-gray-500">
            {documentId && <span>Doc ID: {documentId}</span>}
            <span>Date: {format(docDate, 'PPP')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPrintHeader;

