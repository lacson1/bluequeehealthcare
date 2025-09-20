import { Request, Response } from 'express';
import { db } from './db';
import { patients, labTests, prescriptions, appointments } from '../shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

// HL7 FHIR Integration
interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  name: Array<{
    family: string;
    given: string[];
  }>;
  birthDate: string;
  gender: string;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
  address?: Array<{
    line: string[];
    city: string;
    state: string;
    postalCode: string;
  }>;
}

interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
  };
  valueQuantity?: {
    value: number;
    unit: string;
  };
  valueString?: string;
  effectiveDateTime: string;
}

class HealthcareIntegrations {
  // Convert internal patient to FHIR format
  async exportPatientToFHIR(patientId: number): Promise<FHIRPatient | null> {
    try {
      const patient = await db
        .select()
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      if (!patient.length) return null;

      const p = patient[0];
      return {
        resourceType: 'Patient',
        id: p.id.toString(),
        name: [{
          family: p.lastName,
          given: [p.firstName]
        }],
        birthDate: p.dateOfBirth,
        gender: p.gender.toLowerCase() as 'male' | 'female',
        telecom: [
          {
            system: 'phone',
            value: p.phone
          },
          ...(p.email ? [{
            system: 'email' as const,
            value: p.email
          }] : [])
        ],
        address: p.address ? [{
          line: [p.address],
          city: '',
          state: '',
          postalCode: ''
        }] : undefined
      };
    } catch (error) {
      console.error('Failed to export patient to FHIR:', error);
      return null;
    }
  }

  // Import FHIR patient to internal format
  async importPatientFromFHIR(fhirPatient: FHIRPatient, organizationId: number) {
    try {
      const name = fhirPatient.name[0];
      const phone = fhirPatient.telecom?.find(t => t.system === 'phone')?.value || '';
      const email = fhirPatient.telecom?.find(t => t.system === 'email')?.value;
      const address = fhirPatient.address?.[0]?.line?.join(', ');

      const [newPatient] = await db.insert(patients).values({
        firstName: name.given[0] || '',
        lastName: name.family,
        dateOfBirth: fhirPatient.birthDate,
        gender: fhirPatient.gender,
        phone,
        email,
        address,
        organizationId
      }).returning();

      return newPatient;
    } catch (error) {
      console.error('Failed to import FHIR patient:', error);
      throw error;
    }
  }

  // Laboratory Information System (LIS) Integration
  async syncLabResults(organizationId: number) {
    // This would typically connect to external LIS systems
    console.log(`🔬 Syncing lab results for organization ${organizationId}`);
    
    // Placeholder for actual LIS integration
    return {
      success: true,
      synced: 0,
      message: 'LIS integration ready for configuration'
    };
  }

  // Electronic Prescribing Integration
  async submitElectronicPrescription(prescriptionId: number) {
    try {
      const prescription = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.id, prescriptionId))
        .limit(1);

      if (!prescription.length) {
        throw new Error('Prescription not found');
      }

      // Placeholder for e-prescribing integration (e.g., Surescripts)
      console.log(`💊 Submitting e-prescription ${prescriptionId} to pharmacy network`);
      
      return {
        success: true,
        prescriptionId,
        confirmationNumber: `EP${Date.now()}`,
        message: 'E-prescribing integration ready for configuration'
      };
    } catch (error) {
      console.error('Failed to submit electronic prescription:', error);
      throw error;
    }
  }

  // Appointment Scheduling Integration
  async syncExternalAppointments(organizationId: number) {
    console.log(`📅 Syncing external appointments for organization ${organizationId}`);
    
    // Placeholder for external calendar integration (Google Calendar, Outlook, etc.)
    return {
      success: true,
      synced: 0,
      message: 'External calendar integration ready for configuration'
    };
  }

  // Insurance Verification Integration
  async verifyInsurance(patientId: number) {
    try {
      const patient = await db
        .select()
        .from(patients)
        .where(eq(patients.id, patientId))
        .limit(1);

      if (!patient.length) {
        throw new Error('Patient not found');
      }

      // Placeholder for insurance verification (e.g., Eligibility API)
      console.log(`🏥 Verifying insurance for patient ${patientId}`);
      
      return {
        success: true,
        patientId,
        status: 'verified',
        coverage: 'active',
        message: 'Insurance verification integration ready for configuration'
      };
    } catch (error) {
      console.error('Failed to verify insurance:', error);
      throw error;
    }
  }

  // Pharmacy Benefit Management Integration
  async checkDrugFormulary(medicationName: string, insuranceInfo?: any) {
    console.log(`💊 Checking drug formulary for ${medicationName}`);
    
    // Placeholder for PBM integration
    return {
      success: true,
      medication: medicationName,
      covered: true,
      tier: 2,
      copay: '$15.00',
      alternatives: [],
      message: 'PBM integration ready for configuration'
    };
  }

  // Clinical Decision Support Integration
  async checkDrugInteractions(medications: string[]) {
    console.log(`⚠️ Checking drug interactions for: ${medications.join(', ')}`);
    
    // Placeholder for clinical decision support
    return {
      success: true,
      medications,
      interactions: [],
      alerts: [],
      message: 'Clinical decision support integration ready for configuration'
    };
  }

  // Telemedicine Platform Integration
  async createTelemedicineSession(appointmentId: number) {
    try {
      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      if (!appointment.length) {
        throw new Error('Appointment not found');
      }

      // Placeholder for telemedicine integration (Zoom Healthcare, Doxy.me, etc.)
      console.log(`📹 Creating telemedicine session for appointment ${appointmentId}`);
      
      return {
        success: true,
        appointmentId,
        sessionId: `TM${Date.now()}`,
        joinUrl: `https://telehealth.example.com/session/TM${Date.now()}`,
        message: 'Telemedicine integration ready for configuration'
      };
    } catch (error) {
      console.error('Failed to create telemedicine session:', error);
      throw error;
    }
  }
}

export const healthcareIntegrations = new HealthcareIntegrations();

// API endpoints for healthcare integrations
export async function handleFHIRExport(req: Request, res: Response) {
  try {
    const { patientId } = req.params;
    const fhirPatient = await healthcareIntegrations.exportPatientToFHIR(parseInt(patientId));
    
    if (!fhirPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(fhirPatient);
  } catch (error) {
    console.error('FHIR export failed:', error);
    res.status(500).json({ error: 'Failed to export patient data' });
  }
}

export async function handleLabSync(req: Request, res: Response) {
  try {
    const organizationId = (req as any).user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }
    
    const result = await healthcareIntegrations.syncLabResults(organizationId);
    res.json(result);
  } catch (error) {
    console.error('Lab sync failed:', error);
    res.status(500).json({ error: 'Failed to sync lab results' });
  }
}

export async function handleEPrescribing(req: Request, res: Response) {
  try {
    const { prescriptionId } = req.params;
    const result = await healthcareIntegrations.submitElectronicPrescription(parseInt(prescriptionId));
    res.json(result);
  } catch (error) {
    console.error('E-prescribing failed:', error);
    res.status(500).json({ error: 'Failed to submit electronic prescription' });
  }
}

export async function handleInsuranceVerification(req: Request, res: Response) {
  try {
    const { patientId } = req.params;
    const result = await healthcareIntegrations.verifyInsurance(parseInt(patientId));
    res.json(result);
  } catch (error) {
    console.error('Insurance verification failed:', error);
    res.status(500).json({ error: 'Failed to verify insurance' });
  }
}

export async function handleTelemedicineSession(req: Request, res: Response) {
  try {
    const { appointmentId } = req.params;
    const result = await healthcareIntegrations.createTelemedicineSession(parseInt(appointmentId));
    res.json(result);
  } catch (error) {
    console.error('Telemedicine session creation failed:', error);
    res.status(500).json({ error: 'Failed to create telemedicine session' });
  }
}