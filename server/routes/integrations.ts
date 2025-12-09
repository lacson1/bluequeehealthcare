import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import type { Response } from "express";

const router = Router();

/**
 * External integration routes
 * Handles: lab sync, e-prescribing, insurance verification, telemedicine, FHIR
 */
export function setupIntegrationRoutes(): Router {
  
  // FHIR export
  router.get('/fhir/patient/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleFHIRExport } = await import('../healthcare-integrations');
      await handleFHIRExport(req, res);
    } catch (error) {
      console.error('Error in FHIR export:', error);
      res.status(500).json({ error: 'Failed to export FHIR data' });
    }
  });

  // Lab system integrations
  router.post('/integrations/lab-sync', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleLabSync } = await import('../healthcare-integrations');
      await handleLabSync(req, res);
    } catch (error) {
      console.error('Error in lab sync:', error);
      res.status(500).json({ error: 'Failed to sync lab data' });
    }
  });

  // E-prescribing
  router.post('/integrations/e-prescribe/:prescriptionId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleEPrescribing } = await import('../healthcare-integrations');
      await handleEPrescribing(req, res);
    } catch (error) {
      console.error('Error in e-prescribing:', error);
      res.status(500).json({ error: 'Failed to process e-prescription' });
    }
  });

  router.post('/integrations/e-prescribe', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleEPrescribing } = await import('../healthcare-integrations');
      await handleEPrescribing(req, res);
    } catch (error) {
      console.error('Error in e-prescribing:', error);
      res.status(500).json({ error: 'Failed to process e-prescription' });
    }
  });

  // Insurance verification
  router.post('/integrations/verify-insurance/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleInsuranceVerification } = await import('../healthcare-integrations');
      await handleInsuranceVerification(req, res);
    } catch (error) {
      console.error('Error in insurance verification:', error);
      res.status(500).json({ error: 'Failed to verify insurance' });
    }
  });

  router.post('/integrations/verify-insurance', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleInsuranceVerification } = await import('../healthcare-integrations');
      await handleInsuranceVerification(req, res);
    } catch (error) {
      console.error('Error in insurance verification:', error);
      res.status(500).json({ error: 'Failed to verify insurance' });
    }
  });

  // Telemedicine
  router.post('/integrations/telemedicine/:appointmentId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleTelemedicineSession } = await import('../healthcare-integrations');
      await handleTelemedicineSession(req, res);
    } catch (error) {
      console.error('Error in telemedicine session:', error);
      res.status(500).json({ error: 'Failed to create telemedicine session' });
    }
  });

  router.post('/integrations/telemedicine', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { handleTelemedicineSession } = await import('../healthcare-integrations');
      await handleTelemedicineSession(req, res);
    } catch (error) {
      console.error('Error in telemedicine session:', error);
      res.status(500).json({ error: 'Failed to create telemedicine session' });
    }
  });

  return router;
}
