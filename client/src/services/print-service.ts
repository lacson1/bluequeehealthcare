export interface PrintableDocument {
  type: 'prescription' | 'lab-order' | 'consultation';
  data: any;
  organizationInfo: {
    name: string;
    type: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
  };
  patientInfo: {
    id: number;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    address?: string;
  };
  staffInfo: {
    fullName: string;
    title?: string;
    role: string;
    username: string;
    phone?: string;
  };
  createdAt: string;
  recordId: string | number;
}

export class PrintService {
  static generatePrintHTML(document: PrintableDocument): string {
    try {
      const { organizationInfo, patientInfo, staffInfo, data, type, createdAt, recordId } = document;
      
      // Validate required fields
      if (!organizationInfo || !organizationInfo.name) {
        throw new Error('Organization information is required');
      }
      if (!patientInfo || !patientInfo.fullName) {
        throw new Error('Patient information is required');
      }
      if (!staffInfo || !staffInfo.fullName) {
        throw new Error('Staff information is required');
      }
      
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.getDocumentTitle(type)} - ${organizationInfo.name}</title>
    <style>
        @media print {
            @page {
                size: A6;
                margin: 0.3in 0.25in;
            }
            body { 
                margin: 0; 
                padding: 0;
                background: white !important; 
                font-size: 8pt;
                line-height: 1.2;
            }
            .print-container {
                margin: 0;
                padding: 0;
                box-shadow: none;
                border: none;
                border-radius: 0;
                max-width: none;
                min-height: auto;
            }
            .header {
                margin-bottom: 0.1in;
                padding: 6px 0;
            }
            .org-name {
                font-size: 14pt !important;
                margin-bottom: 2px !important;
            }
            .org-type {
                font-size: 8pt !important;
                margin-bottom: 3px !important;
            }
            .org-details {
                font-size: 6pt !important;
                padding: 3px 0 !important;
            }
            .document-title {
                margin: 0.08in 0;
                padding: 4px;
                font-size: 10pt !important;
            }
            .info-section {
                margin: 0.05in 0;
                padding: 4px;
                page-break-inside: avoid;
            }
            .info-title {
                font-size: 7pt !important;
                margin-bottom: 3px !important;
            }
            .info-grid {
                gap: 3px !important;
                font-size: 6pt !important;
            }
            .label {
                min-width: 40px !important;
                font-size: 6pt !important;
            }
            .no-print { display: none; }
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 50%, #e8f5e8 100%);
            min-height: 100vh;
        }
        
        .print-container {
            background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 50%, #f0f8f0 100%);
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border: 2px solid #22c55e;
            min-height: 420px;
        }
        
        .header {
            text-align: center;
            border-bottom: 1px solid #22c55e;
            padding: 4px 2px;
            margin-bottom: 5px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 3px 3px 0 0;
        }
        
        .org-name {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 1px;
            color: #166534;
            letter-spacing: 0.3px;
        }
        
        .org-type {
            font-size: 6px;
            color: #15803d;
            margin-bottom: 2px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .org-details {
            font-size: 5px;
            line-height: 1.1;
            color: #374151;
            padding: 2px 0;
            border-top: 1px solid #bbf7d0;
            margin-top: 2px;
        }
        
        .document-title {
            text-align: center;
            font-size: 8px;
            font-weight: bold;
            margin: 4px 0;
            text-transform: uppercase;
            border: 1px solid #22c55e;
            padding: 2px;
            background: #f0fdf4;
            color: #166534;
            letter-spacing: 0.3px;
            border-radius: 3px;
        }
        
        .info-section {
            margin: 3px 0;
            border: 1px solid #bbf7d0;
            border-radius: 3px;
            padding: 3px;
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            box-shadow: 0 1px 1px rgba(34,197,94,0.1);
        }
        
        .info-title {
            font-weight: bold;
            font-size: 6px;
            margin-bottom: 2px;
            border-bottom: 1px solid #22c55e;
            padding-bottom: 1px;
            color: #166534;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px;
            font-size: 5px;
        }
        
        .info-item {
            margin-bottom: 1px;
            padding: 1px 0;
        }
        
        .label {
            font-weight: bold;
            display: inline-block;
            min-width: 20px;
            color: #374151;
            font-size: 5px;
        }
        
        .content-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #000;
        }
        
        .content-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .medication-item {
            border-bottom: 1px solid #eee;
            padding: 10px 0;
            margin-bottom: 10px;
        }
        
        .medication-name {
            font-weight: bold;
            font-size: 14px;
        }
        
        .medication-details {
            margin-top: 5px;
            font-size: 12px;
        }
        
        .lab-test {
            margin: 8px 0;
            padding: 8px;
            border-left: 3px solid #007bff;
            background-color: #f8f9fa;
        }
        
        .consultation-field {
            margin: 10px 0;
            padding: 8px;
            border: 1px solid #ddd;
            background-color: #fafafa;
        }
        
        .field-label {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .field-value {
            margin-left: 10px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ccc;
            font-size: 11px;
        }
        
        .signature-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        
        .signature-box {
            text-align: center;
        }
        
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="print-container">
        <div class="header">
            <div class="org-name">${organizationInfo.name}</div>
            <div class="org-type">${organizationInfo.type.toUpperCase()}</div>
        <div class="org-details">
            ${organizationInfo.address ? organizationInfo.address + '<br>' : ''}
            ${organizationInfo.phone ? 'Tel: ' + organizationInfo.phone : ''}
            ${organizationInfo.email ? ' | Email: ' + organizationInfo.email : ''}
            ${organizationInfo.website ? '<br>Web: ' + organizationInfo.website : ''}
        </div>
    </div>
    
    <div class="document-title">${this.getDocumentTitle(type)}</div>
    
    <div class="info-section">
        <div class="info-title">PATIENT INFORMATION</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="label">Patient ID:</span> ${patientInfo.id}
            </div>
            <div class="info-item">
                <span class="label">Date:</span> ${new Date(createdAt).toLocaleDateString()}
            </div>
            <div class="info-item">
                <span class="label">Name:</span> ${patientInfo.fullName}
            </div>
            <div class="info-item">
                <span class="label">Time:</span> ${new Date(createdAt).toLocaleTimeString()}
            </div>
            <div class="info-item">
                <span class="label">Date of Birth:</span> ${patientInfo.dateOfBirth}
            </div>
            <div class="info-item">
                <span class="label">Record #:</span> ${recordId}
            </div>
            <div class="info-item">
                <span class="label">Gender:</span> ${patientInfo.gender}
            </div>
            <div class="info-item">
                <span class="label">Phone:</span> ${patientInfo.phone}
            </div>
        </div>
        ${patientInfo.address ? `<div class="info-item"><span class="label">Address:</span> ${patientInfo.address}</div>` : ''}
    </div>
    
    <div class="info-section">
        <div class="info-title">HEALTHCARE PROVIDER</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="label">Provider:</span> ${staffInfo.title ? staffInfo.title + ' ' : ''}${staffInfo.fullName}
            </div>
            <div class="info-item">
                <span class="label">Role:</span> ${staffInfo.role}
            </div>
            ${staffInfo.phone ? `<div class="info-item"><span class="label">Phone:</span> ${staffInfo.phone}</div>` : ''}
        </div>
    </div>
    
    ${this.generateContentSection(type, data, organizationInfo)}
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">Healthcare Provider Signature</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Date</div>
        </div>
    </div>
    
    <div class="footer">
        <div>Printed on: ${currentDate} at ${currentTime}</div>
        <div style="margin-top: 5px;">This document was generated electronically by ${organizationInfo.name} clinic management system.</div>
    </div>
    
    </div><!-- Close print-container -->
    
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
    `;
    } catch (error) {
      console.error('Error generating print HTML:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate print document: ${errorMessage}`);
    }
  }

  private static getDocumentTitle(type: string): string {
    switch (type) {
      case 'prescription':
        return 'PRESCRIPTION';
      case 'lab-order':
        return 'LABORATORY ORDER';
      case 'consultation':
        return 'CONSULTATION RECORD';
      default:
        return 'MEDICAL DOCUMENT';
    }
  }

  private static generateContentSection(type: string, data: any, organization?: any): string {
    switch (type) {
      case 'prescription':
        return this.generatePrescriptionContent(data, organization);
      case 'lab-order':
        return this.generateLabOrderContent(data);
      case 'consultation':
        return this.generateConsultationContent(data);
      default:
        return '<div class="content-section">Content not available</div>';
    }
  }

  private static generateQRCode(prescriptionData: any): string {
    // Create a comprehensive data string for the QR code
    const qrData = {
      prescriptionId: prescriptionData.id,
      patientId: prescriptionData.patientId,
      medication: prescriptionData.medicationName,
      dosage: prescriptionData.dosage,
      frequency: prescriptionData.frequency,
      duration: prescriptionData.duration,
      instructions: prescriptionData.instructions,
      prescribedBy: prescriptionData.prescribedBy,
      date: prescriptionData.startDate || prescriptionData.createdAt,
      status: prescriptionData.status
    };
    
    const dataString = JSON.stringify(qrData);
    
    // Generate QR code using a public API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(dataString)}`;
    
    return `
      <div class="qr-code-section">
        <div class="qr-code-title">SCAN FOR PHARMACY</div>
        <img src="${qrCodeUrl}" alt="Prescription QR Code" style="width: 60px; height: 60px;">
      </div>
    `;
  }

  private static generatePrescriptionContent(prescription: any, organization: any = null): string {
    console.log('Generating prescription content for:', prescription);
    console.log('Organization data:', organization);
    
    const prescriptionDate = prescription.startDate ? new Date(prescription.startDate).toLocaleDateString() : new Date().toLocaleDateString();
    
    // Use organization data if provided, otherwise fetch from database
    const orgName = organization?.name || 'Grace';
    const orgType = organization?.type || 'clinic';
    const orgAddress = organization?.address || '123 Healthcare Avenue, Lagos, Nigeria';
    const orgPhone = organization?.phone || '+234 802 123 4567';
    const orgEmail = organization?.email || 'grace@clinic.com';
    
    // Support both single prescription and JSON-structured prescription data
    const isStructuredPrescription = prescription.prescription || (prescription.doctor || prescription.patient || prescription.medications);
    
    console.log('Is structured prescription:', isStructuredPrescription);
    
    if (isStructuredPrescription) {
      return this.generateStructuredPrescriptionContent(prescription);
    }
    
    return `
    <style>
        .prescription-medication {
            border: 3px solid #22c55e;
            padding: 25px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 8px;
            margin: 20px 0;
            min-height: 240px;
            flex-grow: 1;
        }
        .rx-header {
            font-size: 20px;
            font-weight: bold;
            color: #166534;
            margin-bottom: 18px;
            text-align: center;
            border-bottom: 3px solid #bbf7d0;
            padding-bottom: 10px;
        }
        .med-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-bottom: 18px;
        }
        .med-item {
            display: flex;
            flex-direction: column;
        }
        .med-label {
            font-weight: bold;
            color: #15803d;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .med-value {
            color: #374151;
            font-size: 16px;
            line-height: 1.4;
        }
        @media print {
            .prescription-medication {
                padding: 8px !important;
                margin: 0.08in 0 !important;
                background: #f0fdf4 !important;
            }
            .rx-header {
                font-size: 11pt !important;
                margin-bottom: 4px !important;
                padding-bottom: 3px !important;
            }
            .med-details {
                gap: 4px !important;
                margin-bottom: 4px !important;
            }
            .med-label {
                font-size: 7pt !important;
                margin-bottom: 1px !important;
            }
            .med-value {
                font-size: 8pt !important;
            }
        }
    </style>
    
    <div class="prescription-medication">
        <div class="rx-header">
            ℞ ${prescription.medicationName || prescription.name || 'Prescribed Medication'}
        </div>
        <div class="med-details">
            <div class="med-item">
                <span class="med-label">Dosage</span>
                <span class="med-value">${prescription.dosage || 'As prescribed'}</span>
            </div>
            <div class="med-item">
                <span class="med-label">Frequency</span>
                <span class="med-value">${prescription.frequency || 'As directed'}</span>
            </div>
            <div class="med-item">
                <span class="med-label">Duration</span>
                <span class="med-value">${prescription.duration || 'As prescribed'}</span>
            </div>
            <div class="med-item">
                <span class="med-label">Prescribed by</span>
                <span class="med-value">Dr. ${prescription.prescribedBy || 'admin'}</span>
            </div>
        </div>
        ${prescription.instructions ? `
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #bbf7d0;">
            <span class="med-label">Special Instructions:</span><br>
            <span class="med-value">${prescription.instructions}</span>
        </div>
        ` : ''}
    </div>
    `;
  }

  private static generateStructuredPrescriptionContent(data: any): string {
    const { prescription } = data;
    const doctor = prescription?.doctor || {};
    const clinic = doctor?.clinic || {};
    const patient = prescription?.patient || {};
    const medications = prescription?.medications || [];
    const specialInstructions = prescription?.specialInstructions || [];
    const futureNeeds = prescription?.futureNeeds || {};
    
    return `
    <style>
        @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .no-print { display: none; }
        }
        .prescription-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .clinic-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
        .clinic-details {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.5;
        }
        .prescription-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            color: #1e40af;
            margin: 30px 0;
            text-decoration: underline;
        }
        .section {
            margin: 25px 0;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            background-color: #f9fafb;
        }
        .section-title {
            font-weight: bold;
            font-size: 18px;
            color: #374151;
            margin-bottom: 15px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 5px;
        }
        .info-row {
            display: flex;
            margin: 8px 0;
            font-size: 16px;
        }
        .info-label {
            font-weight: bold;
            min-width: 140px;
            color: #374151;
        }
        .info-value {
            color: #1f2937;
        }
        .medication-item {
            background: white;
            border: 2px solid #2563eb;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        .medication-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
        }
        .medication-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .med-detail {
            display: flex;
            align-items: center;
        }
        .med-label {
            font-weight: bold;
            min-width: 80px;
            color: #374151;
        }
        .special-instructions {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .special-instructions h4 {
            color: #92400e;
            margin: 0 0 10px 0;
        }
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: end;
        }
        .signature-box {
            text-align: center;
        }
        .signature-line {
            border-bottom: 2px solid #000;
            width: 250px;
            height: 50px;
            margin-bottom: 10px;
        }
        .date-section {
            text-align: right;
        }
    </style>
    
    <div class="prescription-header">
        <div class="clinic-name">${clinic.name || 'Medical Centre'}</div>
        <div class="clinic-details">
            ${clinic.address || 'N/A'}<br>
            Tel: ${clinic.phone || 'N/A'}
        </div>
    </div>
    
    <div class="prescription-title">PRESCRIPTION</div>
    
    <div class="section">
        <div class="section-title">Doctor Information</div>
        <div class="info-row">
            <span class="info-label">Doctor Name:</span>
            <span class="info-value">${doctor.name || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Qualification:</span>
            <span class="info-value">${doctor.qualification || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Registration No:</span>
            <span class="info-value">${doctor.registrationNo || 'N/A'}</span>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-row">
            <span class="info-label">Patient Name:</span>
            <span class="info-value">${patient.name || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Age:</span>
            <span class="info-value">${patient.age ? patient.age + ' years' : 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Gender:</span>
            <span class="info-value">${patient.gender || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${patient.address || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${patient.phone || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${prescription.date || new Date().toLocaleDateString()}</span>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Prescribed Medications</div>
        ${medications.map((med: any, index: number) => `
            <div class="medication-item">
                <div class="medication-name">Rx ${index + 1}: ${med.name || 'Medication'}</div>
                <div class="medication-details">
                    <div class="med-detail">
                        <span class="med-label">Dosage:</span>
                        <span>${med.dosage || 'As prescribed'}</span>
                    </div>
                    <div class="med-detail">
                        <span class="med-label">Frequency:</span>
                        <span>${med.frequency || 'As directed'}</span>
                    </div>
                    <div class="med-detail">
                        <span class="med-label">Duration:</span>
                        <span>${med.duration || 'As needed'}</span>
                    </div>
                    <div class="med-detail">
                        <span class="med-label">Instructions:</span>
                        <span>${med.instructions || 'Take as directed'}</span>
                    </div>
                </div>
            </div>
        `).join('')}
        ${medications.length === 0 ? '<div style="text-align: center; color: #6b7280; font-style: italic;">No medications prescribed</div>' : ''}
    </div>
    
    ${specialInstructions.length > 0 ? `
        <div class="special-instructions">
            <h4>Special Instructions</h4>
            <ul style="margin: 0; padding-left: 20px;">
                ${specialInstructions.map((instruction: string) => `<li>${instruction}</li>`).join('')}
            </ul>
        </div>
    ` : ''}
    
    ${futureNeeds.nextReviewDate || futureNeeds.additionalTests ? `
        <div class="section">
            <div class="section-title">Future Care</div>
            ${futureNeeds.nextReviewDate ? `
                <div class="info-row">
                    <span class="info-label">Next Review:</span>
                    <span class="info-value">${futureNeeds.nextReviewDate}</span>
                </div>
            ` : ''}
            ${futureNeeds.additionalTests ? `
                <div class="info-row">
                    <span class="info-label">Additional Tests:</span>
                    <span class="info-value">${futureNeeds.additionalTests}</span>
                </div>
            ` : ''}
        </div>
    ` : ''}
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div style="font-weight: bold;">Doctor's Signature</div>
        </div>
        <div class="date-section">
            <div>Date: ${prescription.date || new Date().toLocaleDateString()}</div>
            <div style="margin-top: 10px;">Time: ${new Date().toLocaleTimeString()}</div>
        </div>
    </div>
    `;
  }

  private static generateLabOrderContent(labOrder: any): string {
    let content = `
    <div class="content-section">
        <div class="content-title">LABORATORY TESTS ORDERED</div>
    `;

    if (labOrder.tests && labOrder.tests.length > 0) {
      labOrder.tests.forEach((test: any, index: number) => {
        content += `
        <div class="lab-test">
            <div><strong>${index + 1}. ${test.name || test.testName || 'Laboratory Test'}</strong></div>
            ${test.category ? `<div><em>Category:</em> ${test.category}</div>` : ''}
            ${test.description ? `<div><em>Description:</em> ${test.description}</div>` : ''}
            ${test.instructions ? `<div><em>Instructions:</em> ${test.instructions}</div>` : ''}
        </div>
        `;
      });
    } else {
      content += '<div>No laboratory tests ordered.</div>';
    }

    if (labOrder.notes || labOrder.instructions) {
      content += `
      <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">
          <div class="field-label">ADDITIONAL INSTRUCTIONS:</div>
          <div class="field-value">${labOrder.notes || labOrder.instructions}</div>
      </div>
      `;
    }

    content += '</div>';
    return content;
  }

  private static generateConsultationContent(consultation: any): string {
    if (!consultation) {
      return '<div class="content-section"><div class="content-title">CONSULTATION DETAILS</div><div>No consultation data available.</div></div>';
    }
    
    let content = `
    <div class="content-section">
        <div class="content-title">CONSULTATION DETAILS</div>
    `;

    if (consultation.formName) {
      const formName = String(consultation.formName || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      content += `
      <div class="consultation-field">
          <div class="field-label">CONSULTATION TYPE:</div>
          <div class="field-value">${formName}</div>
      </div>
      `;
    }

    if (consultation.formData && typeof consultation.formData === 'object') {
      try {
        Object.entries(consultation.formData).forEach(([key, value]: [string, any]) => {
          if (value !== null && value !== undefined) {
            let valueStr = '';
            try {
              if (Array.isArray(value)) {
                valueStr = value.map(v => String(v || '')).join(', ');
              } else if (typeof value === 'object') {
                valueStr = JSON.stringify(value);
              } else {
                valueStr = String(value);
              }
              
              if (valueStr.trim()) {
                // Escape HTML to prevent XSS
                valueStr = valueStr.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                const fieldName = key.includes('field_') ? 'Clinical Notes' : 
                                 key.replace(/([A-Z])/g, ' $1')
                                    .replace(/[_-]/g, ' ')
                                    .replace(/^./, str => str.toUpperCase())
                                    .trim();
                
                content += `
                <div class="consultation-field">
                    <div class="field-label">${fieldName.toUpperCase().replace(/</g, '&lt;').replace(/>/g, '&gt;')}:</div>
                    <div class="field-value">${valueStr}</div>
                </div>
                `;
              }
            } catch (err) {
              console.warn(`Error formatting field ${key}:`, err);
            }
          }
        });
      } catch (err) {
        console.warn('Error processing formData:', err);
      }
    }

    if (consultation.diagnosis) {
      const diagnosis = String(consultation.diagnosis).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      content += `
      <div class="consultation-field">
          <div class="field-label">DIAGNOSIS:</div>
          <div class="field-value">${diagnosis}</div>
      </div>
      `;
    }

    if (consultation.treatment) {
      const treatment = String(consultation.treatment).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      content += `
      <div class="consultation-field">
          <div class="field-label">TREATMENT PLAN:</div>
          <div class="field-value">${treatment}</div>
      </div>
      `;
    }

    content += '</div>';
    return content;
  }

  static async printDocument(document: PrintableDocument): Promise<void> {
    try {
      console.log('PrintService.printDocument called with:', {
        type: document.type,
        recordId: document.recordId,
        hasData: !!document.data,
        hasPatientInfo: !!document.patientInfo,
        hasOrganizationInfo: !!document.organizationInfo,
        hasStaffInfo: !!document.staffInfo
      });
      
      // Validate required fields
      if (!document.organizationInfo || !document.organizationInfo.name) {
        throw new Error('Organization information is missing');
      }
      
      if (!document.patientInfo || !document.patientInfo.fullName) {
        throw new Error('Patient information is missing');
      }
      
      if (!document.staffInfo || !document.staffInfo.fullName) {
        throw new Error('Staff information is missing');
      }
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Print window was blocked. Please allow popups for this site and try again.');
      }
      
      console.log('Generating print HTML...');
      const html = this.generatePrintHTML(document);
      console.log('Print HTML generated, length:', html.length);
      
      printWindow.document.write(html);
      printWindow.document.close();
      
      console.log('Print window opened successfully');
      
      // Wait a bit for the window to load before triggering print
      setTimeout(() => {
        printWindow.focus();
      }, 100);
    } catch (error) {
      console.error('Error in printDocument:', error);
      throw error instanceof Error ? error : new Error('Failed to open print window');
    }
  }

  static async downloadPDF(document: PrintableDocument): Promise<void> {
    // Note: This requires html2pdf.js library
    const html = this.generatePrintHTML(document);
    const element = window.document.createElement('div');
    element.innerHTML = html;
    
    if ((window as any).html2pdf) {
      const filename = `${document.type}-${document.recordId}-${new Date().toISOString().split('T')[0]}.pdf`;
      (window as any).html2pdf().from(element).save(filename);
    } else {
      // Fallback to opening print dialog
      this.printDocument(document);
    }
  }
}