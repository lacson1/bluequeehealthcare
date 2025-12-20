import { PrintableDocument, PrintService } from './print-service';

export async function fetchPrintData() {
  // Default values
  let currentUser = {
    title: '',
    firstName: 'User',
    lastName: '',
    username: 'user',
    role: 'staff',
    phone: ''
  };
  
  let organization: any = {
    id: 1,
    name: 'Healthcare Facility',
    type: 'clinic',
    address: '123 Healthcare Avenue',
    phone: '+234 802 123 4567',
    email: 'info@clinic.com',
    website: 'www.clinic.com',
    themeColor: '#1e40af',
    letterheadConfig: {
      tagline: 'Excellence in Healthcare Services',
      accreditation: 'Licensed Healthcare Facility',
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      showLogo: true,
      showTagline: true,
      showAccreditation: true
    }
  };
  
  // Fetch current user info
  try {
    const userResponse = await fetch('/api/profile', {
      credentials: 'include'
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      currentUser = {
        title: userData.title || '',
        firstName: userData.firstName || 'User',
        lastName: userData.lastName || '',
        username: userData.username || 'user',
        role: userData.role || 'staff',
        phone: userData.phone || ''
      };
    } else {
      console.warn('Could not fetch user profile for print, using defaults');
    }
  } catch (error) {
    console.warn('Error fetching user profile for print, using defaults:', error);
  }
  
  // Fetch organization data from dedicated print endpoint or organization endpoint
  try {
    // Try the print-specific endpoint first
    let orgResponse = await fetch('/api/print/organization', {
      credentials: 'include'
    });
    
    // If that fails, try the regular organization endpoint
    if (!orgResponse.ok) {
      // Try to get organization from user's current organization
      const userOrgResponse = await fetch('/api/organizations/current', {
        credentials: 'include'
      });
      if (userOrgResponse.ok) {
        const userOrgData = await userOrgResponse.json();
        orgResponse = { ok: true, json: async () => userOrgData } as Response;
      }
    }
    
    if (orgResponse.ok) {
      const orgData = await orgResponse.json();
      organization = {
        id: orgData.id,
        name: orgData.name || organization.name,
        type: orgData.type || organization.type,
        address: orgData.address || organization.address,
        phone: orgData.phone || organization.phone,
        email: orgData.email || organization.email,
        website: orgData.website || organization.website,
        logoUrl: orgData.logoUrl,
        themeColor: orgData.themeColor || '#1e40af',
        letterheadConfig: orgData.letterheadConfig || {
          tagline: orgData.tagline,
          accreditation: orgData.accreditation,
          primaryColor: orgData.themeColor || '#1e40af',
          secondaryColor: orgData.secondaryColor || '#3b82f6',
          showLogo: true,
          showTagline: true,
          showAccreditation: true
        }
      };
    } else {
      console.warn('Could not fetch organization data for print, using defaults');
    }
  } catch (error) {
    console.warn('Error fetching organization data for print, using defaults:', error);
  }
  
  return {
    currentUser,
    organization
  };
}

export function formatPatientInfo(patient: any) {
  if (!patient) {
    throw new Error('Patient information is required for printing');
  }
  
  return {
    id: patient.id || 0,
    fullName: `${patient.title || ''} ${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient',
    dateOfBirth: patient.dateOfBirth || 'N/A',
    gender: patient.gender || 'N/A',
    phone: patient.phone || 'N/A',
    address: patient.address || ''
  };
}

import { getDisplayName } from '../utils/name-utils';

export function formatStaffInfo(user: any) {
  if (!user) {
    return {
      fullName: 'Healthcare Provider',
      title: '',
      role: 'Staff',
      username: 'user',
      phone: ''
    };
  }
  
  const role = user.role || 'staff';
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
  
  return {
    fullName: getDisplayName({
      title: user.title,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username
    }),
    title: user.title || '',
    role: formattedRole,
    username: user.username || 'user',
    phone: user.phone || ''
  };
}

export function formatOrganizationInfo(org: any) {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    address: org.address,
    phone: org.phone,
    email: org.email,
    website: org.website,
    logoUrl: org.logoUrl,
    themeColor: org.themeColor,
    letterheadConfig: org.letterheadConfig
  };
}

export async function printPrescription(prescription: any, patient: any) {
  try {
    const { currentUser, organization } = await fetchPrintData();
    const patientInfo = formatPatientInfo(patient);
    const staffInfo = formatStaffInfo(currentUser);
    
    // Use the new letterhead utility for consistent branding
    const { openPrintWindowWithLetterhead } = await import('@/utils/organization-print');
    const { generateMedicationQRText } = await import('@/utils/qr-code-generator');
    
    // Generate QR code data
    const qrCodeData = generateMedicationQRText(
      {
        name: prescription.medicationName || prescription.name || 'Prescribed Medication',
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions,
        prescribedBy: prescription.prescribedBy || staffInfo.fullName,
        startDate: prescription.startDate || prescription.createdAt,
        prescriptionId: prescription.id
      },
      {
        firstName: patient.firstName || patientInfo.fullName.split(' ')[0],
        lastName: patient.lastName || patientInfo.fullName.split(' ').slice(1).join(' '),
        phone: patient.phone || patientInfo.phone,
        dateOfBirth: patient.dateOfBirth || patientInfo.dateOfBirth,
        id: patient.id || patientInfo.id,
        title: patient.title
      }
    );
    
    // Generate QR code URL (using a public QR code API)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrCodeData)}`;
    
    const prescriptionContent = `
      <style>
        .prescription-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #22c55e;
        }
        .medication-name {
          font-size: 18px;
          font-weight: bold;
          color: #166534;
          margin-bottom: 10px;
        }
        .medication-detail {
          margin: 5px 0;
          font-size: 14px;
        }
        .patient-info {
          background: #f0fdf4;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .qr-code-section {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .qr-code-label {
          font-size: 10px;
          color: #6b7280;
          margin-top: 5px;
        }
      </style>
      
      <div class="patient-info">
        <h3 style="font-weight: bold; margin-bottom: 10px;">Patient Information</h3>
        <p><strong>Name:</strong> ${patientInfo.fullName}</p>
        <p><strong>DOB:</strong> ${patientInfo.dateOfBirth}</p>
        <p><strong>Gender:</strong> ${patientInfo.gender}</p>
        <p><strong>Phone:</strong> ${patientInfo.phone}</p>
      </div>
      
      <div class="prescription-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div class="medication-name">${prescription.medicationName || prescription.name || 'Prescribed Medication'}</div>
          <span style="font-size: 10px; color: #6b7280; background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">
            RX #${prescription.id}
          </span>
        </div>
        <div class="medication-detail"><strong>Dosage:</strong> ${prescription.dosage || 'As prescribed'}</div>
        <div class="medication-detail"><strong>Frequency:</strong> ${prescription.frequency || 'As directed'}</div>
        <div class="medication-detail"><strong>Duration:</strong> ${prescription.duration || 'As prescribed'}</div>
        ${prescription.instructions ? `<div class="medication-detail" style="margin-top: 8px; padding: 8px; background-color: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;"><strong>Instructions:</strong> ${prescription.instructions}</div>` : ''}
        <div class="medication-detail" style="margin-top: 10px;"><strong>Prescribed By:</strong> ${staffInfo.title ? staffInfo.title + ' ' : ''}${staffInfo.fullName}</div>
      </div>
      
      <div class="qr-code-section">
        <img src="${qrCodeUrl}" alt="Prescription QR Code" style="width: 60px; height: 60px; border: 1px solid #d1d5db; padding: 4px; background: white; border-radius: 4px;" />
        <p class="qr-code-label">Scan to verify prescription</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="font-weight: bold; margin-bottom: 30px;">Prescribing Physician</p>
            <p style="border-top: 1px solid #000; padding-top: 5px;">${staffInfo.fullName}</p>
            <p style="font-size: 11px; color: #6b7280; margin-top: 5px;">License No: _______________</p>
          </div>
          <div>
            <p style="font-weight: bold; margin-bottom: 30px;">Pharmacy Dispensing</p>
            <p style="color: #6b7280; margin-bottom: 5px;">Dispensed by: _______________</p>
            <p style="border-top: 1px solid #000; padding-top: 5px; margin-top: 20px;">Date: ${new Date(prescription.createdAt || new Date()).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;
    
    await openPrintWindowWithLetterhead(
      prescriptionContent,
      'Medical Prescription',
      {
        documentId: `RX-${prescription.id}`,
        documentDate: prescription.createdAt || new Date(),
        organizationId: (organization as any).id,
        organization: formatOrganizationInfo(organization) as any,
        pageSize: 'A5',
        orientation: 'portrait',
        autoPrint: true
      }
    );
  } catch (error) {
    // Production: Error printing prescription
    throw new Error('Failed to print prescription. Please try again.');
  }
}

export async function printLabOrder(labOrder: any, patient: any) {
  try {
    const { currentUser, organization } = await fetchPrintData();
    
    const document: PrintableDocument = {
      type: 'lab-order',
      data: labOrder,
      organizationInfo: formatOrganizationInfo(organization),
      patientInfo: formatPatientInfo(patient),
      staffInfo: formatStaffInfo(currentUser),
      createdAt: labOrder.createdAt || new Date().toISOString(),
      recordId: labOrder.id
    };
    
    await PrintService.printDocument(document);
  } catch (error) {
    // Production: Error printing lab order
    throw new Error('Failed to print lab order. Please try again.');
  }
}

export async function printConsultation(consultation: any, patient: any) {
  try {
    if (!consultation) {
      throw new Error('Consultation data is required for printing');
    }
    
    // If patient is not provided, try to fetch it from the consultation record
    let patientData = patient;
    if (!patientData && consultation.patientId) {
      try {
        const response = await fetch(`/api/patients/${consultation.patientId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          patientData = await response.json();
        }
      } catch (fetchError) {
        console.warn('Could not fetch patient data:', fetchError);
      }
    }
    
    if (!patientData) {
      throw new Error('Patient information is required for printing. Please ensure patient data is available.');
    }
    
    const { currentUser, organization } = await fetchPrintData();
    const patientInfo = formatPatientInfo(patientData);
    const staffInfo = formatStaffInfo(currentUser);
    
    // Use the organization print utility for consistent branding (same as prescriptions)
    const { openPrintWindowWithLetterhead } = await import('@/utils/organization-print');
    
    // Generate consultation content HTML
    const consultationContent = generateConsultationPrintContent(
      consultation,
      patientInfo,
      staffInfo
    );
    
    const printWindow = await openPrintWindowWithLetterhead(
      consultationContent,
      'Consultation Record',
      {
        documentId: `CONSULT-${consultation.id || consultation.recordId || 'N/A'}`,
        documentDate: consultation.createdAt || new Date(),
        organizationId: (organization as any).id,
        organization: formatOrganizationInfo(organization) as any,
        pageSize: 'A4',
        orientation: 'portrait',
        autoPrint: true
      }
    );
    
    if (!printWindow) {
      throw new Error('Print window was blocked. Please allow popups for this site and try again.');
    }
  } catch (error) {
    console.error('Error printing consultation:', error);
    // Preserve the original error message if it's meaningful
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to print consultation. Please try again.';
    throw new Error(errorMessage);
  }
}

function generateConsultationPrintContent(
  consultation: any,
  patientInfo: ReturnType<typeof formatPatientInfo>,
  staffInfo: ReturnType<typeof formatStaffInfo>
): string {
  const consultationDate = consultation.createdAt 
    ? new Date(consultation.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const consultationTime = consultation.createdAt
    ? new Date(consultation.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Organize form data into clinical categories
  const formData = consultation.formData || {};
  
  // Group fields by category for professional medical documentation
  const categorizeField = (key: string): string => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('complaint') || lowerKey.includes('symptom') || lowerKey.includes('history') || lowerKey.includes('duration')) return 'subjective';
    if (lowerKey.includes('exam') || lowerKey.includes('vital') || lowerKey.includes('finding') || lowerKey.includes('observation') || lowerKey.includes('measurement')) return 'objective';
    if (lowerKey.includes('diagnosis') || lowerKey.includes('assessment') || lowerKey.includes('impression')) return 'assessment';
    if (lowerKey.includes('plan') || lowerKey.includes('treatment') || lowerKey.includes('prescription') || lowerKey.includes('recommendation') || lowerKey.includes('follow')) return 'plan';
    return 'clinical';
  };
  
  const groupedData: Record<string, Array<{key: string, value: any}>> = {
    subjective: [],
    objective: [],
    assessment: [],
    plan: [],
    clinical: []
  };
  
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      const category = categorizeField(key);
      groupedData[category].push({ key, value });
    }
  });
  
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.map(v => String(v || '')).join(', ');
    } else if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join('; ');
    }
    return String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  
  const formatFieldName = (key: string): string => {
    if (key.includes('field_')) return 'Clinical Notes';
    return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, str => str.toUpperCase()).trim();
  };
  
  const generateDataTable = (data: Array<{key: string, value: any}>, hasData: boolean): string => {
    if (!hasData || data.length === 0) return '';
    
    return `
      <table class="data-table">
        <tbody>
          ${data.map(({ key, value }) => `
            <tr>
              <td class="field-label">${formatFieldName(key)}</td>
              <td class="field-value">${formatValue(value)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateSOAPSection = (title: string, letter: string, color: string, data: Array<{key: string, value: any}>, additionalContent: string = ''): string => {
    if (data.length === 0 && !additionalContent) return '';
    
    return `
      <div class="soap-section">
        <div class="soap-header" style="background: ${color};">
          <span class="soap-letter">${letter}</span>
          <span class="soap-title">${title}</span>
        </div>
        <div class="soap-content">
          ${generateDataTable(data, data.length > 0)}
          ${additionalContent}
        </div>
      </div>
    `;
  };
  
  return `
    <style>
      /* Professional Medical Document Styles */
      .consultation-header {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: white;
        padding: 20px 25px;
        border-radius: 8px;
        margin-bottom: 25px;
        position: relative;
        overflow: hidden;
      }
      .consultation-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -10%;
        width: 50%;
        height: 200%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/></svg>');
        opacity: 0.3;
      }
      .consultation-header h2 {
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 8px 0;
        letter-spacing: -0.5px;
        position: relative;
      }
      .consultation-header .meta {
        font-size: 13px;
        opacity: 0.9;
        position: relative;
      }
      
      /* Patient & Provider Info Cards */
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 25px;
      }
      .info-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      .info-card-header {
        background: linear-gradient(135deg, #475569 0%, #64748b 100%);
        color: white;
        padding: 10px 15px;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .info-card-body {
        padding: 15px;
      }
      .info-row {
        display: flex;
        margin: 6px 0;
        font-size: 13px;
        line-height: 1.4;
      }
      .info-label {
        font-weight: 600;
        min-width: 100px;
        color: #475569;
      }
      .info-value {
        color: #1e293b;
      }
      
      /* SOAP Format Sections */
      .soap-section {
        margin-bottom: 20px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        page-break-inside: avoid;
      }
      .soap-header {
        padding: 12px 18px;
        color: white;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .soap-letter {
        width: 28px;
        height: 28px;
        background: rgba(255,255,255,0.25);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
      }
      .soap-title {
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .soap-content {
        background: white;
        padding: 15px 18px;
      }
      
      /* Data Tables */
      .data-table {
        width: 100%;
        border-collapse: collapse;
      }
      .data-table tr {
        border-bottom: 1px solid #f1f5f9;
      }
      .data-table tr:last-child {
        border-bottom: none;
      }
      .field-label {
        padding: 10px 12px 10px 0;
        font-weight: 600;
        color: #475569;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        width: 35%;
        vertical-align: top;
      }
      .field-value {
        padding: 10px 0;
        color: #1e293b;
        font-size: 13px;
        line-height: 1.5;
      }
      
      /* Highlighted Sections (Diagnosis/Treatment) */
      .highlight-section {
        margin: 15px 0;
        padding: 15px 18px;
        border-radius: 6px;
        border-left: 4px solid;
      }
      .highlight-section.diagnosis {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-left-color: #f59e0b;
      }
      .highlight-section.treatment {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        border-left-color: #10b981;
      }
      .highlight-section .label {
        font-weight: 700;
        margin-bottom: 6px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .highlight-section.diagnosis .label { color: #92400e; }
      .highlight-section.treatment .label { color: #065f46; }
      .highlight-section .content {
        font-size: 13px;
        line-height: 1.6;
      }
      .highlight-section.diagnosis .content { color: #78350f; }
      .highlight-section.treatment .content { color: #064e3b; }
      
      /* Signature Section */
      .signature-section {
        margin-top: 40px;
        padding-top: 25px;
        border-top: 2px solid #e2e8f0;
        page-break-inside: avoid;
      }
      .signature-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 60px;
      }
      .signature-box {
        text-align: center;
      }
      .signature-line {
        border-top: 2px solid #1e293b;
        margin-top: 50px;
        padding-top: 8px;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .signature-details {
        margin-top: 5px;
        font-size: 11px;
        color: #64748b;
      }
      
      /* Print Optimizations */
      @media print {
        .soap-section {
          break-inside: avoid;
        }
        .info-card {
          break-inside: avoid;
        }
        .consultation-header {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    </style>
    
    <!-- Document Header -->
    <div class="consultation-header">
      <h2>${consultation.formName || consultation.title || 'Clinical Consultation Record'}</h2>
      <div class="meta">
        <strong>Record ID:</strong> ${consultation.id || consultation.recordId || 'N/A'} &nbsp;|&nbsp; 
        <strong>Date:</strong> ${consultationDate} &nbsp;|&nbsp; 
        <strong>Time:</strong> ${consultationTime}
      </div>
    </div>
    
    <!-- Patient & Provider Information -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-header">Patient Information</div>
        <div class="info-card-body">
          <div class="info-row">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${patientInfo.fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date of Birth:</span>
            <span class="info-value">${patientInfo.dateOfBirth}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Gender:</span>
            <span class="info-value">${patientInfo.gender}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${patientInfo.phone}</span>
          </div>
          ${patientInfo.address ? `
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${patientInfo.address}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="info-card">
        <div class="info-card-header">Healthcare Provider</div>
        <div class="info-card-body">
          <div class="info-row">
            <span class="info-label">Provider:</span>
            <span class="info-value">${staffInfo.title ? staffInfo.title + ' ' : ''}${staffInfo.fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Role:</span>
            <span class="info-value">${staffInfo.role}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Specialty:</span>
            <span class="info-value">${consultation.specialistRole ? consultation.specialistRole.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : staffInfo.role}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Clinical Documentation (SOAP Format) -->
    ${generateSOAPSection('Subjective', 'S', '#f59e0b', groupedData.subjective, 
      consultation.chiefComplaint ? `
        <div class="highlight-section diagnosis" style="background: #fef9c3; border-left-color: #eab308; margin-top: 10px;">
          <div class="label" style="color: #854d0e;">Chief Complaint</div>
          <div class="content" style="color: #713f12;">${String(consultation.chiefComplaint).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      ` : ''
    )}
    
    ${generateSOAPSection('Objective', 'O', '#3b82f6', groupedData.objective)}
    
    ${generateSOAPSection('Assessment', 'A', '#8b5cf6', groupedData.assessment,
      consultation.diagnosis ? `
        <div class="highlight-section diagnosis">
          <div class="label">Clinical Diagnosis</div>
          <div class="content">${String(consultation.diagnosis).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      ` : ''
    )}
    
    ${generateSOAPSection('Plan', 'P', '#10b981', groupedData.plan,
      consultation.treatment ? `
        <div class="highlight-section treatment">
          <div class="label">Treatment Plan</div>
          <div class="content">${String(consultation.treatment).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      ` : ''
    )}
    
    ${groupedData.clinical.length > 0 ? `
      <div class="soap-section">
        <div class="soap-header" style="background: linear-gradient(135deg, #475569 0%, #64748b 100%);">
          <span class="soap-letter">+</span>
          <span class="soap-title">Additional Clinical Data</span>
        </div>
        <div class="soap-content">
          ${generateDataTable(groupedData.clinical, true)}
        </div>
      </div>
    ` : ''}
    
    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-grid">
        <div class="signature-box">
          <div class="signature-line">Healthcare Provider Signature</div>
          <div class="signature-details">${staffInfo.title ? staffInfo.title + ' ' : ''}${staffInfo.fullName}<br>${staffInfo.role}</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Date & Stamp</div>
          <div class="signature-details">${consultationDate}</div>
        </div>
      </div>
    </div>
  `;
}