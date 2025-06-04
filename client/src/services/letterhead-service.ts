import { format } from 'date-fns';

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
}

interface LetterheadConfig {
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
}

export class LetterheadService {
  private static getDefaultConfig(org: Organization): LetterheadConfig {
    const configs: Record<string, LetterheadConfig> = {
      'hospital': {
        tagline: 'Excellence in Healthcare Services',
        accreditation: 'Licensed Hospital - Ministry of Health Certified',
        certifications: ['ISO 15189:2012', 'CLIA Certified', 'JCI Accredited'],
        footerNote: 'Committed to providing world-class healthcare services',
        disclaimer: 'This medical report is confidential and intended solely for the patient and authorized healthcare providers.',
        primaryColor: org.themeColor || '#1e40af',
        secondaryColor: '#3b82f6',
        showLogo: true,
        showTagline: true,
        showAccreditation: true,
        showCertifications: true
      },
      'clinic': {
        tagline: 'Quality Healthcare for Your Family',
        accreditation: 'Licensed Medical Clinic - Reg. No: MC/2024/001',
        certifications: ['ISO 9001:2015', 'Clinical Excellence Award'],
        footerNote: 'Your trusted healthcare partner in the community',
        disclaimer: 'This medical report contains confidential information. Please consult with qualified medical professionals for interpretation.',
        primaryColor: org.themeColor || '#059669',
        secondaryColor: '#10b981',
        showLogo: true,
        showTagline: true,
        showAccreditation: true,
        showCertifications: true
      },
      'health_center': {
        tagline: 'Community Health Excellence',
        accreditation: 'Licensed Health Center - PHC/2024/001',
        certifications: ['WHO Standards Compliant', 'Community Health Certified'],
        footerNote: 'Serving our community with dedication and care',
        disclaimer: 'This health report is confidential. Results should be discussed with your healthcare provider.',
        primaryColor: org.themeColor || '#7c3aed',
        secondaryColor: '#8b5cf6',
        showLogo: true,
        showTagline: true,
        showAccreditation: true,
        showCertifications: true
      }
    };

    return configs[org.type] || configs['clinic'];
  }

  private static formatOrgType(type: string): string {
    const typeMap: Record<string, string> = {
      'clinic': 'Medical Clinic',
      'hospital': 'Hospital',
      'health_center': 'Health Center',
      'pharmacy': 'Pharmacy',
      'diagnostic_center': 'Diagnostic Center'
    };
    return typeMap[type] || 'Healthcare Facility';
  }

  public static generateLabResultHTML(
    organization: Organization,
    labResult: any
  ): string {
    const config = this.getDefaultConfig(organization);
    
    const letterheadStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.4; 
          color: #1f2937;
          background: white;
          font-size: 12px;
          margin: 10mm 15mm;
        }
        
        .letterhead-header {
          background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%);
          color: white;
          padding: 15px 20px;
          position: relative;
          overflow: hidden;
          margin: -10mm -15mm 15px -15mm;
        }
        
        .letterhead-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 80%;
          height: 200%;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.4;
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
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 6px;
          border: 2px solid rgba(255, 255, 255, 0.4);
        }
        
        .org-name {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 2px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .org-type {
          font-size: 11px;
          opacity: 0.9;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        
        .org-tagline {
          font-size: 10px;
          font-style: italic;
          opacity: 0.85;
          margin-bottom: 5px;
        }
        
        .org-accreditation {
          font-size: 9px;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 4px;
          border-radius: 3px;
          display: inline-block;
        }
        
        .contact-info {
          text-align: right;
          font-size: 9px;
          opacity: 0.9;
        }
        
        .contact-item {
          margin: 1px 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 3px;
        }
        
        .document-header {
          background: #f8fafc;
          border-left: 3px solid ${config.primaryColor};
          padding: 10px 15px;
          margin: 0 0 8px 0;
        }
        
        .document-title {
          font-size: 16px;
          font-weight: 700;
          color: ${config.primaryColor};
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .document-meta {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #6b7280;
        }
        
        .document-body {
          padding: 12px 0;
          min-height: auto;
        }
        
        .section {
          margin: 8px 0;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: ${config.primaryColor};
          margin-bottom: 5px;
          padding-bottom: 2px;
          border-bottom: 1px solid #e5e7eb;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 5px 0;
        }
        
        .info-item {
          margin: 2px 0;
          display: flex;
          align-items: center;
        }
        
        .info-label {
          font-weight: 600;
          color: #374151;
          margin-right: 5px;
          min-width: 80px;
          font-size: 10px;
        }
        
        .info-value {
          color: #1f2937;
          flex: 1;
          font-size: 10px;
        }
        
        .lab-result-table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .lab-result-table th,
        .lab-result-table td {
          border: 1px solid #e5e7eb;
          padding: 6px 8px;
          text-align: left;
        }
        
        .lab-result-table th {
          background: ${config.primaryColor};
          color: white;
          font-weight: 600;
          font-size: 10px;
        }
        
        .lab-result-table td {
          font-size: 10px;
        }
        
        .result-value {
          font-weight: 600;
          color: #1f2937;
        }
        
        .status-normal { color: #059669; font-weight: 600; }
        .status-abnormal { color: #d97706; font-weight: 600; }
        .status-critical { color: #dc2626; font-weight: 600; }
        
        .clinical-notes {
          margin-top: 6px;
          padding: 6px 8px;
          background: #f8fafc;
          border-left: 2px solid ${config.primaryColor};
          border-radius: 3px;
          font-size: 10px;
        }
        
        .interpretation-box {
          padding: 6px 8px;
          background: #f1f5f9;
          border-radius: 4px;
          margin: 6px 0;
          font-size: 10px;
        }
        
        .letterhead-footer {
          background: #f8fafc;
          padding: 8px 12px;
          border-top: 1px solid ${config.primaryColor};
          margin-top: 12px;
        }
        
        .certifications {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          margin-bottom: 4px;
        }
        
        .certification-badge {
          background: ${config.primaryColor};
          color: white;
          padding: 1px 3px;
          border-radius: 2px;
          font-size: 7px;
          font-weight: 500;
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8px;
          color: #6b7280;
        }
        
        .footer-note {
          font-style: italic;
          margin-bottom: 3px;
          font-size: 8px;
        }
        
        .disclaimer {
          font-size: 7px;
          color: #9ca3af;
          text-align: center;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid #e5e7eb;
          line-height: 1.2;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .letterhead-header { break-inside: avoid; }
          .document-body { page-break-inside: avoid; }
          .section { break-inside: avoid; }
        }
      </style>
    `;

    const logoContent = organization.logoUrl ? 
      `<img src="${organization.logoUrl}" alt="${organization.name}" style="width: 55px; height: 55px; object-fit: contain; background: white; padding: 6px; border-radius: 10px;">` :
      `<div class="org-logo">${organization.name.substring(0, 2).toUpperCase()}</div>`;

    const contentHTML = `
      <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Patient Name:</span>
              <span class="info-value">${labResult.patientName || 'Unknown Patient'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Patient ID:</span>
              <span class="info-value">P${String(labResult.patientId || 0).padStart(6, '0')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Test Date:</span>
              <span class="info-value">${labResult.completedDate ? format(new Date(labResult.completedDate), 'PPP') : 'Not specified'}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Report ID:</span>
              <span class="info-value">LAB-${String(labResult.id).padStart(3, '0')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Report Date:</span>
              <span class="info-value">${format(new Date(), 'PPP')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Reviewed By:</span>
              <span class="info-value">${labResult.reviewedBy || 'Lab Staff'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Laboratory Test Results</div>
        <table class="lab-result-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Result</th>
              <th>Reference Range</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${labResult.testName || 'Unknown Test'}</strong></td>
              <td class="result-value">${labResult.result || 'Pending'}</td>
              <td>${labResult.normalRange || 'See lab standards'}</td>
              <td>
                <span class="status-${labResult.status || 'normal'}">
                  ${(labResult.status || 'normal').charAt(0).toUpperCase() + (labResult.status || 'normal').slice(1)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        ${labResult.notes ? `
        <div class="clinical-notes">
          <strong>Clinical Notes:</strong><br>
          ${labResult.notes}
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Clinical Interpretation</div>
        <div class="interpretation-box">
          <p><strong>Result Summary:</strong> ${labResult.testName} shows ${labResult.status || 'normal'} values.</p>
          <p><strong>Clinical Significance:</strong> Results should be interpreted in conjunction with clinical history and other diagnostic findings.</p>
          <p><strong>Follow-up:</strong> Consult with your healthcare provider for proper interpretation and any necessary follow-up actions.</p>
        </div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Laboratory Result Report - ${organization.name}</title>
        ${letterheadStyles}
      </head>
      <body>
        <div class="letterhead-header">
          <div class="letterhead-content">
            <div class="org-identity">
              ${config.showLogo !== false ? logoContent : ''}
              <div class="org-name">${organization.name}</div>
              <div class="org-type">${this.formatOrgType(organization.type)}</div>
              ${config.showTagline !== false && config.tagline ? `<div class="org-tagline">${config.tagline}</div>` : ''}
              ${config.showAccreditation !== false && config.accreditation ? `<div class="org-accreditation">${config.accreditation}</div>` : ''}
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
          <div class="document-title">Laboratory Result Report</div>
          <div class="document-meta">
            <span>Document ID: LAB-${String(labResult.id).padStart(3, '0')}</span>
            <span>Generated: ${format(new Date(), 'PPP p')}</span>
          </div>
        </div>
        
        <div class="document-body">
          ${contentHTML}
        </div>
        
        <div class="letterhead-footer">
          ${config.showCertifications !== false && config.certifications?.length ? `
          <div class="certifications">
            ${config.certifications.map(cert => `<span class="certification-badge">${cert}</span>`).join('')}
          </div>
          ` : ''}
          <div class="footer-content">
            <div>
              ${config.footerNote ? `<div class="footer-note">${config.footerNote}</div>` : ''}
              <strong>${organization.name}</strong> | ${this.formatOrgType(organization.type)}
            </div>
            <div>
              Generated on ${format(new Date(), 'PPP')}
            </div>
          </div>
          <div class="disclaimer">
            ${config.disclaimer || 'This document is confidential and intended solely for the addressed recipient. Any unauthorized disclosure is strictly prohibited.'}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default LetterheadService;