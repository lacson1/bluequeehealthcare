import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * Healthcare Integrations Routes (FHIR, Lab Sync, E-prescribing, etc.)
 */
export function setupIntegrationsRoutes(): Router {

  // FHIR export endpoint
  router.get('/fhir/patient/:patientId', authenticateToken, async (req, res) => {
    try {
      const { handleFHIRExport } = await import('../healthcare-integrations');
      return await handleFHIRExport(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'FHIR export failed' });
    }
  });

  // Lab sync endpoint
  router.post('/integrations/lab-sync', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { handleLabSync } = await import('../healthcare-integrations');
      return await handleLabSync(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'Lab sync failed' });
    }
  });

  // E-prescribing endpoint
  router.post('/integrations/e-prescribe/:prescriptionId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { handleEPrescribing } = await import('../healthcare-integrations');
      return await handleEPrescribing(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'E-prescribing failed' });
    }
  });

  // Insurance verification endpoint
  router.post('/integrations/verify-insurance/:patientId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { handleInsuranceVerification } = await import('../healthcare-integrations');
      return await handleInsuranceVerification(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'Insurance verification failed' });
    }
  });

  // Telemedicine session endpoint
  router.post('/integrations/telemedicine/:appointmentId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { handleTelemedicineSession } = await import('../healthcare-integrations');
      return await handleTelemedicineSession(req, res);
    } catch (error) {
      return res.status(500).json({ error: 'Telemedicine session failed' });
    }
  });

  // Additional integration endpoints (if they exist in routes.ts)
  router.post('/fhir/patient/:patientId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // This might be a duplicate - check routes.ts
      return res.status(501).json({ message: 'FHIR POST endpoint not implemented' });
    } catch (error) {
      return res.status(500).json({ error: 'FHIR operation failed' });
    }
  });

  router.post('/integrations/e-prescribe', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Alternative e-prescribe endpoint (without URL parameter)
      const { prescriptionId } = req.body;
      if (!prescriptionId) {
        return res.status(400).json({ error: 'Prescription ID is required in request body' });
      }
      // Create a mock request object with the prescriptionId in params
      const mockReq = { ...req, params: { prescriptionId } };
      const { handleEPrescribing } = await import('../healthcare-integrations');
      return await handleEPrescribing(mockReq as any, res);
    } catch (error) {
      return res.status(500).json({ error: 'E-prescribing failed' });
    }
  });

  router.post('/integrations/verify-insurance', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Alternative insurance verification endpoint (without URL parameter)
      const { patientId } = req.body;
      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID is required in request body' });
      }
      // Create a mock request object with the patientId in params
      const mockReq = { ...req, params: { patientId } };
      const { handleInsuranceVerification } = await import('../healthcare-integrations');
      return await handleInsuranceVerification(mockReq as any, res);
    } catch (error) {
      return res.status(500).json({ error: 'Insurance verification failed' });
    }
  });

  router.post('/integrations/telemedicine', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Alternative telemedicine endpoint (without URL parameter)
      const { appointmentId } = req.body;
      if (!appointmentId) {
        return res.status(400).json({ error: 'Appointment ID is required in request body' });
      }
      // Create a mock request object with the appointmentId in params
      const mockReq = { ...req, params: { appointmentId } };
      const { handleTelemedicineSession } = await import('../healthcare-integrations');
      return await handleTelemedicineSession(mockReq as any, res);
    } catch (error) {
      return res.status(500).json({ error: 'Telemedicine session failed' });
    }
  });

  return router;
}
