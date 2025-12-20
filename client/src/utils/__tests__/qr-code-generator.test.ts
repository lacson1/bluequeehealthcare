import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock formatDateTime before importing the module
vi.mock('@/lib/date-utils', async () => {
  const actual = await vi.importActual('@/lib/date-utils');
  return {
    ...actual,
    formatDateTime: (date: string | Date) => {
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return new Date(date).toLocaleDateString();
      }
    }
  };
});

import {
  generateMedicationQRText,
  generateMedicationQRData,
  getMedicationQRCodeUrl,
  downloadMedicationQRData,
  type MedicationQRCodeData,
  type PatientQRCodeData,
} from '../qr-code-generator';

describe('QR Code Generator', () => {
  const mockMedication: MedicationQRCodeData = {
    name: 'Paracetamol',
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: '5 days',
    instructions: 'Take with food',
    prescribedBy: 'Dr. John Doe',
    startDate: '2024-01-15T10:00:00Z',
    endDate: '2024-01-20T10:00:00Z',
    prescriptionId: 12345,
  };

  const mockPatient: PatientQRCodeData = {
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+2348012345678',
    dateOfBirth: '1990-05-15',
    id: 1,
    title: 'Mrs.',
  };

  // Verify mockPatient structure
  beforeEach(() => {
    expect(mockPatient.firstName).toBeDefined();
    expect(mockPatient.lastName).toBeDefined();
  });

  beforeEach(() => {
    // Mock window.open
    global.window.open = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMedicationQRText', () => {
    it('should generate QR text with all medication details', () => {
      const qrText = generateMedicationQRText(mockMedication, mockPatient);
      
      // Debug: log the actual output
      if (!qrText.includes('Jane Smith')) {
        console.log('QR Text:', qrText);
        console.log('Patient:', mockPatient);
      }

      expect(qrText).toContain('PRESCRIPTION FOR DISPENSING');
      expect(qrText).toContain('RX-12345');
      expect(qrText).toContain('Jane Smith');
      expect(qrText).toContain('Paracetamol');
      expect(qrText).toContain('500mg');
      expect(qrText).toContain('Twice daily');
      expect(qrText).toContain('5 days');
      expect(qrText).toContain('Take with food');
      expect(qrText).toContain('Dr. John Doe');
      expect(qrText).toContain('+2348012345678');
      expect(qrText).toContain('1990-05-15');
    });

    it('should generate QR text with minimal medication data', () => {
      const minimalMedication: MedicationQRCodeData = {
        name: 'Aspirin',
        prescriptionId: 999,
      };

      const qrText = generateMedicationQRText(minimalMedication);

      expect(qrText).toContain('PRESCRIPTION FOR DISPENSING');
      expect(qrText).toContain('RX-999');
      expect(qrText).toContain('Aspirin');
      expect(qrText).toContain('As prescribed');
      expect(qrText).toContain('As directed');
      expect(qrText).toContain('Patient');
    });

    it('should handle patient with name only', () => {
      const qrText = generateMedicationQRText(mockMedication, { name: 'Test Patient' });

      expect(qrText).toContain('Test Patient');
      // When patient is just { name: string }, phone and DOB won't be included
      expect(qrText).toContain('PATIENT: Test Patient');
    });

    it('should generate RX number when prescriptionId is missing', () => {
      const medicationWithoutId = { ...mockMedication, prescriptionId: undefined };
      const qrText = generateMedicationQRText(medicationWithoutId, mockPatient);

      expect(qrText).toContain('RX NUMBER: RX-');
      expect(qrText).not.toContain('RX-12345');
    });
  });

  describe('generateMedicationQRData', () => {
    it('should generate valid JSON data', () => {
      const qrData = generateMedicationQRData(mockMedication, mockPatient);

      expect(() => JSON.parse(qrData)).not.toThrow();
      const parsed = JSON.parse(qrData);

      expect(parsed.type).toBe('MEDICATION_PRESCRIPTION');
      expect(parsed.prescriptionId).toBe(12345);
      expect(parsed.medication.name).toBe('Paracetamol');
      // Patient should have full details when PatientQRCodeData is provided
      expect(parsed.patient).toBeDefined();
      expect(parsed.patient.name).toBe('Jane Smith');
      expect(parsed.patient.id).toBe(1);
      expect(parsed.patient.phone).toBe('+2348012345678');
      expect(parsed.prescriber).toBeDefined();
      expect(parsed.prescriber.name).toBe('Dr. John Doe');
    });

    it('should include organization data when provided', () => {
      const organization = {
        name: 'Test Clinic',
        phone: '+2348012345678',
        address: '123 Test St',
        license: 'TEST-LICENSE-001',
      };

      const qrData = generateMedicationQRData(mockMedication, mockPatient, organization);
      const parsed = JSON.parse(qrData);

      expect(parsed.organization).toBeDefined();
      expect(parsed.organization.name).toBe('Test Clinic');
      expect(parsed.organization.phone).toBe('+2348012345678');
    });

    it('should handle missing optional fields', () => {
      const minimalMedication: MedicationQRCodeData = {
        name: 'Aspirin',
      };

      const qrData = generateMedicationQRData(minimalMedication);
      const parsed = JSON.parse(qrData);

      expect(parsed.prescriptionId).toBeNull();
      expect(parsed.prescriber).toBeNull();
      expect(parsed.organization).toBeNull();
      expect(parsed.patient.name).toBe('Patient');
    });
  });

  describe('getMedicationQRCodeUrl', () => {
    it('should generate valid QR code URL', () => {
      const url = getMedicationQRCodeUrl(mockMedication, mockPatient);

      expect(url).toContain('https://api.qrserver.com/v1/create-qr-code/');
      expect(url).toContain('size=300x300');
      expect(url).toContain('data=');
    });

    it('should accept custom size parameter', () => {
      const url = getMedicationQRCodeUrl(mockMedication, mockPatient, 500);

      expect(url).toContain('size=500x500');
    });

    it('should URL encode the QR data', () => {
      const url = getMedicationQRCodeUrl(mockMedication, mockPatient);

      // URL should be properly encoded
      expect(url).toMatch(/data=[^&]+/);
      expect(decodeURIComponent(url.split('data=')[1])).toContain('PRESCRIPTION FOR DISPENSING');
    });
  });

  describe('downloadMedicationQRData', () => {
    it('should create download link and trigger download', () => {
      // Mock DOM methods
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      downloadMedicationQRData(mockMedication, mockPatient);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toContain('medication-qr-paracetamol');
      expect(mockAnchor.download).toContain('.json');
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should sanitize medication name in filename', () => {
      const specialCharMedication: MedicationQRCodeData = {
        name: 'Medication (Special) & More!',
        prescriptionId: 1,
      };

      const mockClick = vi.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());

      downloadMedicationQRData(specialCharMedication);

      // The sanitization replaces non-alphanumeric with hyphens
      expect(mockAnchor.download).toMatch(/medication-qr-medication/);
      expect(mockAnchor.download).not.toContain('(');
      expect(mockAnchor.download).not.toContain(')');
      expect(mockAnchor.download).not.toContain('!');
      expect(mockAnchor.download).toContain('.json');
    });

    it('should throw error on failure', () => {
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM error');
      });

      expect(() => {
        downloadMedicationQRData(mockMedication, mockPatient);
      }).toThrow('Failed to download QR code data');
    });
  });
});

