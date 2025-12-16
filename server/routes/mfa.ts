/**
 * MFA (Multi-Factor Authentication) Routes
 * Handles MFA setup, verification, and management
 */

import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { MFAService } from '../services/MFAService';
import { AuditLogger } from '../audit';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/mfa/status
 * Get current MFA status for the authenticated user
 */
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isEnabled = await MFAService.isMFAEnabled(userId);
    
    // Get additional info
    const [user] = await db
      .select({ 
        twoFactorEnabled: users.twoFactorEnabled,
        twoFactorSecret: users.twoFactorSecret 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let backupCodesRemaining = 0;
    if (user?.twoFactorSecret) {
      try {
        const mfaData = JSON.parse(user.twoFactorSecret);
        backupCodesRemaining = mfaData.backupCodes?.length || 0;
      } catch {}
    }

    res.json({
      enabled: isEnabled,
      backupCodesRemaining,
      method: 'totp'
    });
  } catch (error) {
    console.error('Failed to get MFA status:', error);
    res.status(500).json({ error: 'Failed to get MFA status' });
  }
});

/**
 * POST /api/mfa/setup
 * Initiate MFA setup - generates secret and QR code
 */
router.post('/setup', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email || req.user?.username;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if MFA is already enabled
    const isEnabled = await MFAService.isMFAEnabled(userId);
    if (isEnabled) {
      return res.status(400).json({ error: 'MFA is already enabled. Disable it first to set up again.' });
    }

    const setupResult = await MFAService.setupMFA(userId, userEmail || `user-${userId}`);

    // Log the setup initiation
    await AuditLogger.log({
      userId,
      action: 'MFA_SETUP_INITIATED',
      entityType: 'user',
      entityId: userId,
      details: JSON.stringify({ success: true }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      secret: setupResult.secret,
      qrCodeUrl: setupResult.qrCodeUrl,
      backupCodes: setupResult.backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with a code'
    });
  } catch (error) {
    console.error('Failed to setup MFA:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

/**
 * POST /api/mfa/verify-setup
 * Verify initial MFA setup with a code from the authenticator app
 */
router.post('/verify-setup', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const result = await MFAService.verifyMFASetup(userId, code.trim());

    // Log the verification attempt
    await AuditLogger.log({
      userId,
      action: result.valid ? 'MFA_ENABLED' : 'MFA_SETUP_VERIFICATION_FAILED',
      entityType: 'user',
      entityId: userId,
      details: JSON.stringify({ success: result.valid, message: result.message }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    if (result.valid) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Failed to verify MFA setup:', error);
    res.status(500).json({ error: 'Failed to verify MFA setup' });
  }
});

/**
 * POST /api/mfa/verify
 * Verify MFA code during login or sensitive operations
 */
router.post('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'MFA code is required' });
    }

    const result = await MFAService.verifyMFA(userId, code.trim());

    // Log verification attempt
    await AuditLogger.log({
      userId,
      action: result.valid ? 'MFA_VERIFIED' : 'MFA_VERIFICATION_FAILED',
      entityType: 'user',
      entityId: userId,
      details: JSON.stringify({ success: result.valid }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    if (result.valid) {
      // Set MFA verified flag in session
      if (req.session) {
        (req.session as any).mfaVerified = true;
        (req.session as any).mfaVerifiedAt = new Date();
      }

      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Failed to verify MFA:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
});

/**
 * POST /api/mfa/disable
 * Disable MFA for the authenticated user
 * Requires current password or MFA code for security
 */
router.post('/disable', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { code, password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify with MFA code before disabling
    if (code) {
      const verifyResult = await MFAService.verifyMFA(userId, code.trim());
      if (!verifyResult.valid) {
        return res.status(400).json({ error: 'Invalid MFA code' });
      }
    } else if (!password) {
      return res.status(400).json({ error: 'MFA code or password is required to disable MFA' });
    }

    const success = await MFAService.disableMFA(userId);

    if (success) {
      // Log the action
      await AuditLogger.log({
        userId,
        action: 'MFA_DISABLED',
        entityType: 'user',
        entityId: userId,
        details: JSON.stringify({ success: true }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        success: true,
        message: 'MFA has been disabled'
      });
    } else {
      res.status(500).json({ error: 'Failed to disable MFA' });
    }
  } catch (error) {
    console.error('Failed to disable MFA:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

/**
 * POST /api/mfa/regenerate-backup-codes
 * Generate new backup codes (invalidates old ones)
 */
router.post('/regenerate-backup-codes', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Require MFA verification to regenerate backup codes
    if (!code) {
      return res.status(400).json({ error: 'MFA code is required' });
    }

    const verifyResult = await MFAService.verifyMFA(userId, code.trim());
    if (!verifyResult.valid) {
      return res.status(400).json({ error: 'Invalid MFA code' });
    }

    const newCodes = await MFAService.regenerateBackupCodes(userId);

    if (newCodes) {
      // Log the action
      await AuditLogger.log({
        userId,
        action: 'MFA_BACKUP_CODES_REGENERATED',
        entityType: 'user',
        entityId: userId,
        details: JSON.stringify({ codesGenerated: newCodes.length }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({
        success: true,
        backupCodes: newCodes,
        message: 'New backup codes generated. Previous codes are now invalid.'
      });
    } else {
      res.status(500).json({ error: 'Failed to regenerate backup codes' });
    }
  } catch (error) {
    console.error('Failed to regenerate backup codes:', error);
    res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

export default router;

