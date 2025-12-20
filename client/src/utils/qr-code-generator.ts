import { openPrintWindowWithLetterhead } from './organization-print';
import { formatDateTime } from '@/lib/date-utils';

export interface MedicationQRCodeData {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  prescribedBy?: string;
  startDate?: string;
  endDate?: string;
  prescriptionId?: number;
}

export interface PatientQRCodeData {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  id: number;
  title?: string;
}

export interface OrganizationQRCodeData {
  name: string;
  phone?: string;
  address?: string;
  license?: string;
}

/**
 * Generate QR code text for medication prescription
 */
export function generateMedicationQRText(
  medication: MedicationQRCodeData,
  patient?: PatientQRCodeData | { name: string }
): string {
  const patientName = patient
    ? 'firstName' in patient && 'lastName' in patient
      ? `${patient.firstName} ${patient.lastName}`
      : 'name' in patient && patient.name
        ? patient.name
        : 'Patient'
    : 'Patient';

  const patientPhone = patient && 'phone' in patient ? patient.phone : undefined;
  const patientDOB = patient && 'dateOfBirth' in patient ? patient.dateOfBirth : undefined;

  return `PRESCRIPTION FOR DISPENSING

RX NUMBER: ${medication.prescriptionId ? `RX-${medication.prescriptionId}` : `RX-${Date.now()}`}
PATIENT: ${patientName}
${patientDOB ? `DOB: ${patientDOB}` : ''}
${patientPhone ? `PHONE: ${patientPhone}` : ''}

MEDICATION: ${medication.name}
STRENGTH: ${medication.dosage || 'As prescribed'}
FREQUENCY: ${medication.frequency || 'As directed'}
DURATION: ${medication.duration || 'As needed'}
INSTRUCTIONS: ${medication.instructions || 'Take as directed'}

${medication.prescribedBy ? `PRESCRIBER: ${medication.prescribedBy}` : ''}
${medication.startDate ? `DATE ISSUED: ${formatDateTime(medication.startDate)}` : `DATE ISSUED: ${new Date().toLocaleDateString()}`}
${medication.endDate ? `EXPIRES: ${formatDateTime(medication.endDate)}` : ''}

Generated: ${new Date().toLocaleString()}
This is a valid prescription for dispensing at any licensed pharmacy.`;
}

/**
 * Generate QR code JSON data for medication prescription
 */
export function generateMedicationQRData(
  medication: MedicationQRCodeData,
  patient?: PatientQRCodeData | { name: string },
  organization?: OrganizationQRCodeData
): string {
  const patientName = patient
    ? 'firstName' in patient && 'lastName' in patient
      ? `${patient.firstName} ${patient.lastName}`
      : 'name' in patient && patient.name
        ? patient.name
        : 'Patient'
    : 'Patient';

  const qrData = {
    type: 'MEDICATION_PRESCRIPTION',
    prescriptionId: medication.prescriptionId || null,
    medication: {
      name: medication.name,
      dosage: medication.dosage || 'As prescribed',
      frequency: medication.frequency || 'As directed',
      duration: medication.duration || 'As needed',
      instructions: medication.instructions || 'Take as directed',
    },
    patient: patient && 'id' in patient
      ? {
          name: patientName,
          id: patient.id,
          phone: patient.phone || 'Not provided',
          dateOfBirth: patient.dateOfBirth || 'Not provided',
        }
      : { name: patientName },
    prescriber: medication.prescribedBy
      ? { name: medication.prescribedBy }
      : null,
    organization: organization
      ? {
          name: organization.name,
          phone: organization.phone || null,
          address: organization.address || null,
          license: organization.license || null,
        }
      : null,
    dates: {
      startDate: medication.startDate || new Date().toISOString(),
      endDate: medication.endDate || null,
    },
    generatedAt: new Date().toISOString(),
  };

  return JSON.stringify(qrData, null, 2);
}

/**
 * Generate and display QR code with organization letterhead
 */
export async function generateMedicationQRCode(
  medication: MedicationQRCodeData,
  patient?: PatientQRCodeData | { name: string },
  options: {
    organizationId?: number;
    organization?: any;
    autoPrint?: boolean;
    showInDialog?: boolean;
  } = {}
): Promise<void> {
  const qrText = generateMedicationQRText(medication, patient);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

  const patientName = patient
    ? 'firstName' in patient && 'lastName' in patient
      ? `${patient.firstName} ${patient.lastName}`
      : 'name' in patient && patient.name
        ? patient.name
        : 'Patient'
    : 'Patient';

  const contentHTML = `
    <style>
      .qr-container {
        text-align: center;
        margin: 30px 0;
        padding: 20px;
        background: #f0fdf4;
        border-radius: 8px;
      }
      .medication-info {
        background: #f9fafb;
        padding: 15px;
        border-radius: 6px;
        margin: 15px 0;
        border-left: 4px solid #22c55e;
      }
      .medication-name {
        font-weight: bold;
        color: #059669;
        font-size: 18px;
        margin-bottom: 10px;
      }
      .detail-line {
        margin: 5px 0;
        font-size: 14px;
        color: #374151;
      }
      .rx-number {
        font-weight: bold;
        color: #dc2626;
        font-size: 16px;
        margin: 10px 0;
        text-align: center;
      }
      .verification {
        background: #fef3c7;
        padding: 10px;
        border-radius: 6px;
        margin: 15px 0;
        border-left: 4px solid #f59e0b;
        font-size: 12px;
        text-align: center;
      }
    </style>
    
    <div class="rx-number">
      RX #: ${medication.prescriptionId ? `RX-${medication.prescriptionId}` : `RX-${Date.now()}`}
    </div>
    
    <div class="medication-info">
      <div class="medication-name">${medication.name}</div>
      ${medication.dosage ? `<div class="detail-line"><strong>Dosage:</strong> ${medication.dosage}</div>` : ''}
      ${medication.frequency ? `<div class="detail-line"><strong>Frequency:</strong> ${medication.frequency}</div>` : ''}
      ${medication.duration ? `<div class="detail-line"><strong>Duration:</strong> ${medication.duration}</div>` : ''}
      ${medication.instructions ? `<div class="detail-line"><strong>Instructions:</strong> ${medication.instructions}</div>` : ''}
      ${patient ? `<div class="detail-line"><strong>Patient:</strong> ${patientName}</div>` : ''}
      ${medication.prescribedBy ? `<div class="detail-line"><strong>Prescribed By:</strong> ${medication.prescribedBy}</div>` : ''}
    </div>
    
    <div class="qr-container">
      <img src="${qrCodeUrl}" alt="Medication QR Code" style="border: 2px solid #22c55e; padding: 8px; background: white; max-width: 100%;" />
      <div style="margin-top: 10px; font-size: 12px; color: #059669;">
        <strong>Scan this QR code for complete medication information</strong>
      </div>
    </div>
    
    <div class="verification">
      <strong>Valid Prescription for Pharmacy Dispensing</strong><br>
      Generated: ${new Date().toLocaleString()}<br>
      ${medication.prescriptionId ? `Prescription ID: RX-${medication.prescriptionId}` : ''}
    </div>
  `;

  await openPrintWindowWithLetterhead(
    contentHTML,
    `Medication QR Code - ${medication.name}`,
    {
      documentId: medication.prescriptionId ? `RX-QR-${medication.prescriptionId}` : `QR-${Date.now()}`,
      documentDate: new Date(),
      organizationId: options.organizationId,
      organization: options.organization,
      pageSize: 'A5',
      orientation: 'portrait',
      autoPrint: options.autoPrint !== false
    }
  );
}

/**
 * Download QR code data as JSON file
 */
export function downloadMedicationQRData(
  medication: MedicationQRCodeData,
  patient?: PatientQRCodeData | { name: string },
  organization?: OrganizationQRCodeData
): void {
  try {
    const qrData = generateMedicationQRData(medication, patient, organization);
    const blob = new Blob([qrData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = medication.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `medication-qr-${sanitizedName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading medication QR code:', error);
    throw new Error('Failed to download QR code data');
  }
}

/**
 * Get QR code image URL
 */
export function getMedicationQRCodeUrl(
  medication: MedicationQRCodeData,
  patient?: PatientQRCodeData | { name: string },
  size: number = 300
): string {
  const qrText = generateMedicationQRText(medication, patient);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrText)}`;
}

