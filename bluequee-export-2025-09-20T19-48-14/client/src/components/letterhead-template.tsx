import React from 'react';
import { format } from 'date-fns';

interface LetterheadConfig {
  logo?: string;
  tagline?: string;
  accreditation?: string;
  certifications?: string[];
  footerNote?: string;
  disclaimer?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactLayout?: 'horizontal' | 'vertical';
  showLogo?: boolean;
  showTagline?: boolean;
  showAccreditation?: boolean;
  showCertifications?: boolean;
  headerHeight?: number;
  footerHeight?: number;
}

interface Organization {
  id: number;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  themeColor?: string;
  letterheadConfig?: LetterheadConfig;
}

interface LetterheadTemplateProps {
  organization: Organization;
  documentType: 'lab_result' | 'lab_order' | 'prescription' | 'patient_record';
  documentTitle: string;
  documentId?: string;
  children: React.ReactNode;
}

export const generateLetterheadHTML = (
  organization: Organization,
  documentType: string,
  documentTitle: string,
  documentId?: string,
  contentHTML?: string
): string => {
  const config = organization.letterheadConfig || {};
  const primaryColor = config.primaryColor || organization.themeColor || '#1e40af';
  const secondaryColor = config.secondaryColor || '#3b82f6';
  
  const formatOrgType = (type: string) => {
    const typeMap: Record<string, string> = {
      'clinic': 'Medical Clinic',
      'hospital': 'Hospital',
      'health_center': 'Health Center',
      'pharmacy': 'Pharmacy',
      'diagnostic_center': 'Diagnostic Center'
    };
    return typeMap[type] || 'Healthcare Facility';
  };

  const letterheadStyles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: #1f2937;
        background: white;
      }
      
      .letterhead-header {
        background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
        color: white;
        padding: ${config.headerHeight || 30}px 40px;
        position: relative;
        overflow: hidden;
      }
      
      .letterhead-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 100%;
        height: 200%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        opacity: 0.3;
      }
      
      .letterhead-content {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .org-identity {
        flex: 1;
      }
      
      .org-logo {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 12px;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
      
      .org-name {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .org-type {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .org-tagline {
        font-size: 13px;
        font-style: italic;
        opacity: 0.8;
        margin-bottom: 12px;
      }
      
      .org-accreditation {
        font-size: 11px;
        background: rgba(255, 255, 255, 0.15);
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
      }
      
      .contact-info {
        text-align: right;
        font-size: 12px;
        opacity: 0.9;
        ${config.contactLayout === 'vertical' ? 'line-height: 1.8;' : ''}
      }
      
      .contact-item {
        margin: 2px 0;
        ${config.contactLayout === 'horizontal' ? 'display: inline; margin-right: 15px;' : ''}
      }
      
      .document-header {
        background: #f8fafc;
        border-left: 4px solid ${primaryColor};
        padding: 20px 40px;
        margin: 0;
      }
      
      .document-title {
        font-size: 24px;
        font-weight: 700;
        color: ${primaryColor};
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .document-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #6b7280;
      }
      
      .document-body {
        padding: 30px 40px;
        min-height: 400px;
      }
      
      .letterhead-footer {
        background: #f1f5f9;
        padding: ${config.footerHeight || 20}px 40px;
        border-top: 2px solid ${primaryColor};
        margin-top: 40px;
      }
      
      .certifications {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .certification-badge {
        background: ${primaryColor};
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
      }
      
      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #6b7280;
      }
      
      .footer-note {
        font-style: italic;
        margin-bottom: 8px;
      }
      
      .disclaimer {
        font-size: 10px;
        color: #9ca3af;
        text-align: center;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
      }
      
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .letterhead-header { break-inside: avoid; }
        .document-body { page-break-inside: avoid; }
      }
      
      /* Document-specific styles */
      .lab-result-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .lab-result-table th,
      .lab-result-table td {
        border: 1px solid #e5e7eb;
        padding: 12px;
        text-align: left;
      }
      
      .lab-result-table th {
        background: ${primaryColor};
        color: white;
        font-weight: 600;
      }
      
      .status-normal { color: #059669; font-weight: 600; }
      .status-abnormal { color: #d97706; font-weight: 600; }
      .status-critical { color: #dc2626; font-weight: 600; }
      
      .section {
        margin: 25px 0;
        page-break-inside: avoid;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: ${primaryColor};
        margin-bottom: 12px;
        padding-bottom: 4px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 15px 0;
      }
      
      .info-item {
        margin: 8px 0;
      }
      
      .info-label {
        font-weight: 600;
        color: #374151;
        margin-right: 8px;
      }
      
      .info-value {
        color: #1f2937;
      }
    </style>
  `;

  const logoContent = config.showLogo !== false ? (
    organization.logoUrl ? 
      `<img src="${organization.logoUrl}" alt="${organization.name}" class="org-logo" style="width: 60px; height: 60px; object-fit: contain; background: white; padding: 8px; border-radius: 12px;">` :
      `<div class="org-logo">${organization.name.substring(0, 2).toUpperCase()}</div>`
  ) : '';

  const taglineContent = config.showTagline !== false && config.tagline ? 
    `<div class="org-tagline">${config.tagline}</div>` : '';

  const accreditationContent = config.showAccreditation !== false && config.accreditation ? 
    `<div class="org-accreditation">${config.accreditation}</div>` : '';

  const certificationsContent = config.showCertifications !== false && config.certifications?.length ? 
    `<div class="certifications">
      ${config.certifications.map(cert => `<span class="certification-badge">${cert}</span>`).join('')}
    </div>` : '';

  const footerNoteContent = config.footerNote ? 
    `<div class="footer-note">${config.footerNote}</div>` : '';

  const disclaimerContent = config.disclaimer ? 
    `<div class="disclaimer">${config.disclaimer}</div>` : 
    `<div class="disclaimer">This document is confidential and intended solely for the addressed recipient. Any unauthorized disclosure is strictly prohibited.</div>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${documentTitle} - ${organization.name}</title>
      ${letterheadStyles}
    </head>
    <body>
      <div class="letterhead-header">
        <div class="letterhead-content">
          <div class="org-identity">
            ${logoContent}
            <div class="org-name">${organization.name}</div>
            <div class="org-type">${formatOrgType(organization.type)}</div>
            ${taglineContent}
            ${accreditationContent}
          </div>
          <div class="contact-info">
            ${organization.address ? `<div class="contact-item">📍 ${organization.address}</div>` : ''}
            ${organization.phone ? `<div class="contact-item">📞 ${organization.phone}</div>` : ''}
            ${organization.email ? `<div class="contact-item">✉️ ${organization.email}</div>` : ''}
            ${organization.website ? `<div class="contact-item">🌐 ${organization.website}</div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="document-header">
        <div class="document-title">${documentTitle}</div>
        <div class="document-meta">
          <span>Document ID: ${documentId || 'N/A'}</span>
          <span>Generated: ${format(new Date(), 'PPP p')}</span>
        </div>
      </div>
      
      <div class="document-body">
        ${contentHTML || ''}
      </div>
      
      <div class="letterhead-footer">
        ${certificationsContent}
        <div class="footer-content">
          <div>
            ${footerNoteContent}
            <strong>${organization.name}</strong> | ${formatOrgType(organization.type)}
          </div>
          <div>
            Generated on ${format(new Date(), 'PPP')}
          </div>
        </div>
        ${disclaimerContent}
      </div>
    </body>
    </html>
  `;
};

export default generateLetterheadHTML;