/**
 * Emergency Access Routes
 * API endpoints for Break-the-Glass emergency access functionality
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireAnyRole } from '../middleware/auth';
import { EmergencyAccessService } from '../services/EmergencyAccessService';

const router = Router();

/**
 * POST /api/emergency-access/request
 * Request emergency access to a patient's records
 */
router.post('/request', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { patientId, reason, justification } = req.body;

    if (!patientId || !reason || !justification) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['patientId', 'reason', 'justification']
      });
    }

    const result = await EmergencyAccessService.requestEmergencyAccess({
      userId,
      patientId: Number(patientId),
      reason,
      justification,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    if (result.success) {
      res.json({
        success: true,
        grant: {
          id: result.grant?.id,
          expiresAt: result.grant?.expiresAt,
          accessToken: result.grant?.accessToken
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Emergency access request failed:', error);
    res.status(500).json({ error: 'Failed to process emergency access request' });
  }
});

/**
 * GET /api/emergency-access/verify/:patientId
 * Verify if user has active emergency access to a patient
 */
router.get('/verify/:patientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { patientId } = req.params;
    const { token } = req.query;

    const hasAccess = EmergencyAccessService.verifyAccess(
      userId, 
      Number(patientId), 
      token as string | undefined
    );

    const grant = EmergencyAccessService.getActiveAccess(userId, Number(patientId));

    res.json({
      hasAccess,
      grant: hasAccess ? {
        id: grant?.id,
        expiresAt: grant?.expiresAt,
        reason: grant?.reason
      } : null
    });
  } catch (error) {
    console.error('Emergency access verification failed:', error);
    res.status(500).json({ error: 'Failed to verify emergency access' });
  }
});

/**
 * POST /api/emergency-access/revoke/:grantId
 * Revoke emergency access (admin/supervisor only)
 */
router.post(
  '/revoke/:grantId', 
  authenticateToken, 
  requireAnyRole(['admin', 'superadmin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { grantId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: 'Revocation reason is required' });
      }

      const success = await EmergencyAccessService.revokeAccess(grantId, userId, reason);

      if (success) {
        res.json({ success: true, message: 'Emergency access revoked' });
      } else {
        res.status(404).json({ error: 'Grant not found or already expired' });
      }
    } catch (error) {
      console.error('Emergency access revocation failed:', error);
      res.status(500).json({ error: 'Failed to revoke emergency access' });
    }
  }
);

/**
 * GET /api/emergency-access/pending-reviews
 * Get all emergency access grants pending review (compliance officers)
 */
router.get(
  '/pending-reviews', 
  authenticateToken, 
  requireAnyRole(['admin', 'superadmin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const pendingReviews = EmergencyAccessService.getPendingReviews();
      res.json(pendingReviews);
    } catch (error) {
      console.error('Failed to get pending reviews:', error);
      res.status(500).json({ error: 'Failed to get pending reviews' });
    }
  }
);

/**
 * POST /api/emergency-access/review/:grantId
 * Review an emergency access grant
 */
router.post(
  '/review/:grantId',
  authenticateToken,
  requireAnyRole(['admin', 'superadmin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { grantId } = req.params;
      const { approved, notes } = req.body;

      if (typeof approved !== 'boolean' || !notes) {
        return res.status(400).json({ 
          error: 'Both approved (boolean) and notes (string) are required' 
        });
      }

      const success = await EmergencyAccessService.reviewAccess(
        grantId,
        userId,
        approved,
        notes
      );

      if (success) {
        res.json({ 
          success: true, 
          message: approved ? 'Access approved and documented' : 'Access flagged for investigation' 
        });
      } else {
        res.status(404).json({ error: 'Grant not found' });
      }
    } catch (error) {
      console.error('Emergency access review failed:', error);
      res.status(500).json({ error: 'Failed to review emergency access' });
    }
  }
);

/**
 * GET /api/emergency-access/logs/:grantId
 * Get logs for a specific emergency access grant
 */
router.get(
  '/logs/:grantId',
  authenticateToken,
  requireAnyRole(['admin', 'superadmin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { grantId } = req.params;
      const logs = EmergencyAccessService.getAccessLogs(grantId);
      res.json(logs);
    } catch (error) {
      console.error('Failed to get access logs:', error);
      res.status(500).json({ error: 'Failed to get access logs' });
    }
  }
);

/**
 * GET /api/emergency-access/patient-history/:patientId
 * Get emergency access history for a patient
 */
router.get(
  '/patient-history/:patientId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { patientId } = req.params;
      const history = EmergencyAccessService.getPatientEmergencyHistory(Number(patientId));
      
      // Filter sensitive data for non-admins
      const role = req.user?.role;
      const isAdmin = role === 'admin' || role === 'superadmin';
      
      const filteredHistory = history.map(grant => ({
        id: grant.id,
        userId: isAdmin ? grant.userId : undefined,
        reason: grant.reason,
        grantedAt: grant.grantedAt,
        expiresAt: grant.expiresAt,
        reviewed: grant.reviewed,
        justification: isAdmin ? grant.justification : undefined
      }));

      res.json(filteredHistory);
    } catch (error) {
      console.error('Failed to get patient emergency history:', error);
      res.status(500).json({ error: 'Failed to get emergency access history' });
    }
  }
);

/**
 * GET /api/emergency-access/stats
 * Get compliance statistics for emergency access
 */
router.get(
  '/stats',
  authenticateToken,
  requireAnyRole(['admin', 'superadmin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = EmergencyAccessService.getComplianceStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get emergency access stats:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
);

/**
 * GET /api/emergency-access/reasons
 * Get available emergency access reasons for UI
 */
router.get('/reasons', authenticateToken, (req: AuthRequest, res: Response) => {
  const reasons = EmergencyAccessService.getEmergencyReasons();
  res.json(reasons);
});

export default router;

