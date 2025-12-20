import type { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { verifyToken, getJwtSecret } from "../middleware/auth";
import jwt from "jsonwebtoken";
import { patients, visits, prescriptions, labResults, messages, appointments, consentForms, patientConsents } from "@shared/schema";

// Extend Request interface to include patient authentication
interface PatientAuthRequest extends Request {
  patient?: any;
}

/**
 * Patient portal routes
 * Handles: patient authentication, patient-facing APIs, patient self-service
 */
export function setupPatientPortalRoutes(app: Express): void {

  // Patient Portal Authentication Middleware
  const authenticatePatient = async (req: PatientAuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = verifyToken(token) as any;

      // Fetch patient data
      const [patient] = await db.select()
        .from(patients)
        .where(eq(patients.id, decoded.patientId))
        .limit(1);

      if (!patient) {
        return res.status(401).json({ error: 'Patient not found' });
      }

      req.patient = patient;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Patient authentication
  app.post('/api/patient-portal/auth/login', async (req, res) => {
    try {
      const { patientId, phone, dateOfBirth } = req.body;

      // Find patient by ID and verify credentials
      const [patient] = await db.select()
        .from(patients)
        .where(eq(patients.id, parseInt(patientId)));

      if (!patient) {
        return res.status(401).json({ message: 'Invalid patient credentials' });
      }

      // Verify phone and date of birth match
      const phoneMatch = patient.phone === phone;
      const dobMatch = patient.dateOfBirth === dateOfBirth;

      if (!phoneMatch || !dobMatch) {
        return res.status(401).json({ message: 'Invalid patient credentials' });
      }

      // Create patient session token
      const patientToken = jwt.sign(
        { patientId: patient.id, type: 'patient' },
        getJwtSecret(),
        { expiresIn: '24h' }
      );

      return res.json({
        token: patientToken,
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          email: patient.email,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address
        }
      });
    } catch (error) {
      console.error('Patient authentication error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  });

  app.post('/api/patient-portal/auth/logout', async (_req, res) => {
    // Logout is handled client-side by removing the token
    return res.json({ message: "Logged out successfully" });
  });

  // Patient data access
  app.get('/api/patient-portal/profile', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      // Return the patient data from the authentication middleware
      return res.json(req.patient);
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      return res.status(500).json({ error: 'Failed to fetch patient profile' });
    }
  });

  app.get('/api/patient-portal/medications', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const patientMedications = await db.select({
        id: prescriptions.id,
        medicationName: prescriptions.medicationName,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        instructions: prescriptions.instructions,
        status: prescriptions.status,
        prescribedBy: prescriptions.prescribedBy,
        startDate: prescriptions.startDate,
        endDate: prescriptions.endDate,
        createdAt: prescriptions.createdAt,
        organizationId: prescriptions.organizationId
      })
        .from(prescriptions)
        .where(eq(prescriptions.patientId, patientId))
        .orderBy(desc(prescriptions.createdAt));

      return res.json(patientMedications);
    } catch (error) {
      console.error('Error fetching patient medications:', error);
      return res.status(500).json({ message: 'Failed to fetch medications' });
    }
  });

  app.get('/api/patient-portal/appointments', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      // Get patient appointments
      const patientAppointments = await db.select()
        .from(appointments)
        .where(eq(appointments.patientId, patientId))
        .orderBy(desc(appointments.appointmentDate));

      return res.json(patientAppointments);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  app.post('/api/patient-portal/appointments', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const { appointmentType, preferredDate, preferredTime, reason, notes } = req.body;

      if (!appointmentType || !preferredDate || !reason) {
        return res.status(400).json({ error: 'Appointment type, preferred date, and reason are required' });
      }

      // Create appointment request
      const appointmentData = {
        id: Date.now(),
        patientId,
        appointmentType,
        preferredDate,
        preferredTime,
        reason,
        notes,
        status: 'pending',
        createdAt: new Date()
      };

      return res.status(201).json(appointmentData);
    } catch (error) {
      console.error('Error booking patient appointment:', error);
      return res.status(500).json({ error: 'Failed to book appointment' });
    }
  });

  // Appointment requests endpoint (for submitting appointment requests)
  app.post('/api/patient-portal/appointment-requests', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const { type, preferredDate, preferredTime, reason, urgency } = req.body;

      if (!type || !preferredDate || !reason) {
        return res.status(400).json({ error: 'Appointment type, preferred date, and reason are required' });
      }

      // Create appointment request (similar to appointments endpoint)
      const appointmentRequest = {
        id: Date.now(),
        patientId,
        type,
        preferredDate,
        preferredTime,
        reason,
        urgency: urgency || 'routine',
        status: 'pending',
        createdAt: new Date()
      };

      return res.status(201).json(appointmentRequest);
    } catch (error) {
      console.error('Error creating appointment request:', error);
      return res.status(500).json({ error: 'Failed to create appointment request' });
    }
  });

  app.get('/api/patient-portal/lab-results', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const patientLabResults = await db.select({
        id: labResults.id,
        testName: labResults.testName,
        result: labResults.result,
        normalRange: labResults.normalRange,
        status: labResults.status,
        notes: labResults.notes,
        testDate: labResults.testDate,
        unit: sql<string>`''`.as('unit'), // Add empty unit field for compatibility
        date: labResults.testDate
      })
        .from(labResults)
        .where(eq(labResults.patientId, patientId))
        .orderBy(desc(labResults.testDate));

      return res.json(patientLabResults);
    } catch (error) {
      console.error('Error fetching patient lab results:', error);
      return res.status(500).json({ error: 'Failed to fetch lab results' });
    }
  });

  app.get('/api/patient-portal/visit-history', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const patientVisits = await db.select()
        .from(visits)
        .where(eq(visits.patientId, patientId))
        .orderBy(desc(visits.visitDate));

      return res.json(patientVisits);
    } catch (error) {
      console.error('Error fetching patient visits:', error);
      return res.status(500).json({ message: 'Failed to fetch visits' });
    }
  });

  app.get('/api/patient-portal/visits', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const patientVisits = await db.select()
        .from(visits)
        .where(eq(visits.patientId, patientId))
        .orderBy(desc(visits.visitDate));

      return res.json(patientVisits);
    } catch (error) {
      console.error('Error fetching patient visits:', error);
      return res.status(500).json({ message: 'Failed to fetch visits' });
    }
  });

  app.get('/api/patient-portal/prescriptions', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const patientPrescriptions = await db.select({
        id: prescriptions.id,
        medicationName: prescriptions.medicationName,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        instructions: prescriptions.instructions,
        status: prescriptions.status,
        prescribedBy: prescriptions.prescribedBy,
        startDate: prescriptions.startDate,
        endDate: prescriptions.endDate,
        createdAt: prescriptions.createdAt
      })
        .from(prescriptions)
        .where(eq(prescriptions.patientId, patientId))
        .orderBy(desc(prescriptions.createdAt));

      return res.json(patientPrescriptions);
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
  });

  app.get('/api/patient-portal/medical-records', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const patientRecords = await db.select()
        .from(visits)
        .where(eq(visits.patientId, patientId))
        .orderBy(desc(visits.visitDate));

      return res.json(patientRecords);
    } catch (error) {
      console.error('Error fetching patient medical records:', error);
      return res.status(500).json({ error: 'Failed to fetch medical records' });
    }
  });

  app.get('/api/patient-portal/messages', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      // Fetch messages for the authenticated patient
      const patientMessages = await db.select({
        id: messages.id,
        subject: messages.subject,
        message: messages.message,
        messageType: messages.messageType,
        priority: messages.priority,
        status: messages.status,
        sentAt: messages.sentAt,
        readAt: messages.readAt,
        repliedAt: messages.repliedAt,
        recipientType: messages.recipientType,
        recipientRole: messages.recipientRole,
        routingReason: messages.routingReason
      })
        .from(messages)
        .where(eq(messages.patientId, patientId))
        .orderBy(desc(messages.sentAt));

      return res.json(patientMessages);
    } catch (error) {
      console.error('Error fetching patient messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/patient-portal/messages', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient?.id;
      if (!patientId) {
        return res.status(401).json({ error: 'Patient authentication required' });
      }

      const { subject, message, messageType = 'general', priority = 'normal', targetOrganizationId } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
      }

      // Get patient details
      const [patient] = await db.select()
        .from(patients)
        .where(eq(patients.id, patientId));

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Determine target organization
      const targetOrgId = targetOrganizationId;
      if (!targetOrgId) {
        return res.status(400).json({ message: "Target organization ID required" });
      }

      // Create message (simplified - full routing logic would be in routes.ts)
      // For now, create a basic message without complex routing
      const [savedMessage] = await db.insert(messages).values({
        patientId,
        subject,
        message,
        status: 'sent',
        organizationId: targetOrgId,
        staffId: null // Will be assigned by routing logic in full implementation
      } as any).returning();

      res.status(201).json(savedMessage);
    } catch (error) {
      console.error('Error sending patient message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Patient Portal Consent Management
  app.get('/api/patient-portal/pending-consents', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient!.id;

      // Get consent forms that haven't been signed by this patient
      const result = await db
        .select({
          id: consentForms.id,
          title: consentForms.title,
          description: consentForms.description,
          consentType: consentForms.consentType,
          category: consentForms.category,
          template: consentForms.template,
          riskFactors: consentForms.riskFactors,
          benefits: consentForms.benefits,
          alternatives: consentForms.alternatives
        })
        .from(consentForms)
        .where(
          and(
            eq(consentForms.isActive, true),
            sql`${consentForms.id} NOT IN (
              SELECT consent_form_id FROM patient_consents 
              WHERE patient_id = ${patientId} AND status = 'active'
            )`
          )
        )
        .orderBy(consentForms.title);

      return res.json(result);
    } catch (error) {
      console.error('Error fetching pending consents:', error);
      return res.status(500).json({ message: "Failed to fetch pending consents" });
    }
  });

  app.post('/api/patient-portal/sign-consent', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient!.id;
      const {
        consentFormId,
        digitalSignature,
        consentGivenBy = 'patient',
        guardianName,
        guardianRelationship,
        interpreterUsed = false,
        interpreterName,
        additionalNotes
      } = req.body;

      if (!consentFormId || !digitalSignature) {
        return res.status(400).json({ message: "Consent form ID and digital signature are required" });
      }

      // Check if consent already exists
      const existingConsent = await db
        .select()
        .from(patientConsents)
        .where(and(
          eq(patientConsents.patientId, patientId),
          eq(patientConsents.consentFormId, consentFormId),
          eq(patientConsents.status, 'active')
        ))
        .limit(1);

      if (existingConsent.length > 0) {
        return res.status(400).json({ message: "Consent already signed for this form" });
      }

      // Create new patient consent
      const [newConsent] = await db
        .insert(patientConsents)
        .values({
          patientId,
          consentFormId,
          consentGivenBy,
          guardianName: guardianName || null,
          guardianRelationship: guardianRelationship || null,
          interpreterUsed,
          interpreterName: interpreterName || null,
          digitalSignature,
          signatureDate: new Date(),
          status: 'active',
          organizationId: req.patient!.organizationId || 1,
          consentData: additionalNotes ? { notes: additionalNotes } : {}
        } as any)
        .returning();

      res.json({
        success: true,
        message: "Consent form signed successfully",
        consent: newConsent
      });
    } catch (error) {
      console.error('Error signing consent:', error);
      return res.status(500).json({ message: "Failed to sign consent form" });
    }
  });

  app.get('/api/patient-portal/signed-consents', authenticatePatient, async (req: PatientAuthRequest, res) => {
    try {
      const patientId = req.patient!.id;

      const result = await db
        .select({
          id: patientConsents.id,
          consentFormTitle: consentForms.title,
          consentType: consentForms.consentType,
          category: consentForms.category,
          consentGivenBy: patientConsents.consentGivenBy,
          guardianName: patientConsents.guardianName,
          signatureDate: patientConsents.signatureDate,
          status: patientConsents.status,
          expiryDate: patientConsents.expiryDate
        })
        .from(patientConsents)
        .leftJoin(consentForms, eq(patientConsents.consentFormId, consentForms.id))
        .where(eq(patientConsents.patientId, patientId))
        .orderBy(desc(patientConsents.signatureDate));

      return res.json(result);
    } catch (error) {
      console.error('Error fetching signed consents:', error);
      return res.status(500).json({ message: "Failed to fetch signed consents" });
    }
  });
}
