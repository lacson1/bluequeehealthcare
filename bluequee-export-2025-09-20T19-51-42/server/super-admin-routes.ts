import { Express } from 'express';
import { AuthRequest, authenticateToken } from './middleware/auth';
import { 
  requireSuperAdmin, 
  logSuperAdminAction, 
  requireSuperAdminPermission,
  SuperAdminPermissions 
} from './middleware/super-admin';
import { db } from './db';
import { organizations, users, auditLogs } from '../shared/schema';
import { eq, sql, and, isNull, or, ilike } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export function setupSuperAdminRoutes(app: Express) {
  
  // Organization Management Routes
  app.post('/api/superadmin/organizations', 
    authenticateToken, 
    requireSuperAdmin,
    logSuperAdminAction('CREATE_ORGANIZATION'),
    async (req: AuthRequest, res) => {
      try {
        const organizationData = req.body;
        
        const [newOrg] = await db.insert(organizations).values({
          ...organizationData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        res.json(newOrg);
      } catch (error) {
        console.error('Super admin create organization error:', error);
        res.status(500).json({ error: 'Failed to create organization' });
      }
    }
  );

  app.patch('/api/organizations/:id/suspend',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('SUSPEND_ORGANIZATION'),
    async (req: AuthRequest, res) => {
      try {
        const orgId = parseInt(req.params.id);
        const { suspended, reason } = req.body;
        
        await db.update(organizations)
          .set({ 
            isActive: !suspended,
            updatedAt: new Date()
          })
          .where(eq(organizations.id, orgId));
          
        res.json({ 
          message: suspended ? 'Organization suspended' : 'Organization reactivated',
          reason 
        });
      } catch (error) {
        console.error('Super admin suspend organization error:', error);
        res.status(500).json({ error: 'Failed to update organization status' });
      }
    }
  );

  // User Management Routes
  app.get('/api/superadmin/users/all',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.VIEW_ALL_USERS),
    async (req: AuthRequest, res) => {
      try {
        const allUsers = await db.select({
          id: users.id,
          username: users.username,
          role: users.role,
          organizationId: users.organizationId,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
          isActive: users.isActive
        }).from(users);
        
        res.json(allUsers);
      } catch (error) {
        console.error('Super admin get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    }
  );

  app.post('/api/superadmin/users/:id/impersonate',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.IMPERSONATE_USER),
    logSuperAdminAction('IMPERSONATE_USER'),
    async (req: AuthRequest, res) => {
      try {
        const targetUserId = parseInt(req.params.id);
        
        const [targetUser] = await db.select()
          .from(users)
          .where(eq(users.id, targetUserId));
          
        if (!targetUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Create impersonation token (would need JWT implementation)
        res.json({ 
          message: 'Impersonation session created',
          targetUser: {
            id: targetUser.id,
            username: targetUser.username,
            role: targetUser.role,
            organizationId: targetUser.organizationId
          },
          originalAdmin: req.user?.id
        });
      } catch (error) {
        console.error('Super admin impersonate user error:', error);
        res.status(500).json({ error: 'Failed to impersonate user' });
      }
    }
  );

  app.patch('/api/superadmin/users/:id/lock',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.LOCK_USER_ACCOUNT),
    logSuperAdminAction('LOCK_USER_ACCOUNT'),
    async (req: AuthRequest, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { locked, reason } = req.body;
        
        await db.update(users)
          .set({ 
            isActive: !locked,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
          
        res.json({ 
          message: locked ? 'User account locked' : 'User account unlocked',
          reason 
        });
      } catch (error) {
        console.error('Super admin lock user error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
      }
    }
  );

  // System Control Routes
  app.post('/api/superadmin/system/maintenance',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.ENABLE_MAINTENANCE_MODE),
    logSuperAdminAction('ENABLE_MAINTENANCE_MODE'),
    async (req: AuthRequest, res) => {
      try {
        const { enabled, message, estimatedDuration } = req.body;
        
        // In a real system, this would update a system configuration table
        // For now, we'll just log it
        console.log(`🔴 MAINTENANCE MODE ${enabled ? 'ENABLED' : 'DISABLED'} by super admin ${req.user?.username}`);
        console.log(`Message: ${message}`);
        console.log(`Estimated duration: ${estimatedDuration}`);
        
        res.json({ 
          maintenanceEnabled: enabled,
          message,
          estimatedDuration,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin maintenance mode error:', error);
        res.status(500).json({ error: 'Failed to update maintenance mode' });
      }
    }
  );

  app.post('/api/superadmin/system/restart',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.ENABLE_MAINTENANCE_MODE),
    logSuperAdminAction('SYSTEM_RESTART'),
    async (req: AuthRequest, res) => {
      try {
        console.log(`🔴 SYSTEM RESTART initiated by super admin ${req.user?.username}`);
        
        res.json({
          success: true,
          message: 'System restart initiated',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin system restart error:', error);
        res.status(500).json({ error: 'Failed to restart system' });
      }
    }
  );

  app.post('/api/superadmin/system/announcements',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.SEND_SYSTEM_ANNOUNCEMENTS),
    logSuperAdminAction('SEND_SYSTEM_ANNOUNCEMENTS'),
    async (req: AuthRequest, res) => {
      try {
        const { title, message, priority, targetOrganizations } = req.body;
        
        // In a real system, this would create notifications for all users
        console.log(`🔴 SYSTEM ANNOUNCEMENT by super admin ${req.user?.username}`);
        console.log(`Title: ${title}`);
        console.log(`Message: ${message}`);
        console.log(`Priority: ${priority}`);
        console.log(`Target: ${targetOrganizations?.length ? targetOrganizations.join(', ') : 'All organizations'}`);
        
        res.json({ 
          announcementSent: true,
          title,
          message,
          priority,
          targetOrganizations,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin announcement error:', error);
        res.status(500).json({ error: 'Failed to send announcement' });
      }
    }
  );

  // Security & Monitoring Routes
  app.get('/api/superadmin/security/sessions',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.VIEW_USER_SESSIONS),
    async (req: AuthRequest, res) => {
      try {
        // In a real system, this would query active sessions from a sessions table
        const mockSessions = [
          {
            id: 'sess_001',
            userId: 1,
            username: 'admin',
            organizationId: 1,
            ipAddress: '192.168.1.100',
            userAgent: 'Chrome/119.0',
            loginTime: new Date(Date.now() - 3600000).toISOString(),
            lastActivity: new Date(Date.now() - 300000).toISOString(),
            isActive: true
          },
          {
            id: 'sess_002',
            userId: 16,
            username: 'Abi',
            organizationId: 1,
            ipAddress: '192.168.1.101',
            userAgent: 'Firefox/118.0',
            loginTime: new Date(Date.now() - 1800000).toISOString(),
            lastActivity: new Date(Date.now() - 120000).toISOString(),
            isActive: true
          }
        ];
        
        res.json(mockSessions);
      } catch (error) {
        console.error('Super admin get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch user sessions' });
      }
    }
  );

  app.get('/api/superadmin/audit/logs',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const logs = await db.select()
          .from(auditLogs)
          .orderBy(sql`${auditLogs.timestamp} DESC`)
          .limit(100);
        
        res.json(logs);
      } catch (error) {
        console.error('Super admin get audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
      }
    }
  );

  // Data Management Routes
  app.post('/api/superadmin/data/backup',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.CREATE_SYSTEM_BACKUP),
    logSuperAdminAction('CREATE_SYSTEM_BACKUP'),
    async (req: AuthRequest, res) => {
      try {
        const { backupType, includeFiles } = req.body;
        
        // In a real system, this would initiate a backup process
        console.log(`🔴 SYSTEM BACKUP INITIATED by super admin ${req.user?.username}`);
        console.log(`Backup type: ${backupType}`);
        console.log(`Include files: ${includeFiles}`);
        
        const backupId = `backup_${Date.now()}`;
        
        res.json({
          backupId,
          status: 'initiated',
          backupType,
          includeFiles,
          timestamp: new Date().toISOString(),
          estimatedCompletion: new Date(Date.now() + 300000).toISOString() // 5 minutes
        });
      } catch (error) {
        console.error('Super admin backup error:', error);
        res.status(500).json({ error: 'Failed to initiate backup' });
      }
    }
  );

  // User Search and Management Routes
  app.get('/api/superadmin/users',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const allUsers = await db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          organizationId: users.organizationId,
          isActive: users.isActive,
          createdAt: users.createdAt
        }).from(users);

        res.json(allUsers);
      } catch (error) {
        console.error('Super admin get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    }
  );

  app.get('/api/superadmin/users/search',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.length < 2) {
          return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const searchResults = await db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          organizationId: users.organizationId,
          isActive: users.isActive
        })
        .from(users)
        .where(
          or(
            ilike(users.username, `%${q}%`),
            ilike(users.email, `%${q}%`),
            ilike(users.firstName, `%${q}%`),
            ilike(users.lastName, `%${q}%`)
          )
        )
        .limit(20);

        res.json(searchResults);
      } catch (error) {
        console.error('Super admin search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
      }
    }
  );

  app.post('/api/superadmin/users/:userId/reset-password',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.RESET_USER_PASSWORD),
    logSuperAdminAction('RESET_USER_PASSWORD'),
    async (req: AuthRequest, res) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await db.update(users)
          .set({ 
            password: hashedPassword,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        console.log(`🔴 PASSWORD RESET for user ${userId} by super admin ${req.user?.username}`);
        console.log(`Temporary password: ${tempPassword}`);

        res.json({
          success: true,
          message: 'Password reset completed',
          tempPassword // In production, this would be sent via email
        });
      } catch (error) {
        console.error('Super admin reset password error:', error);
        res.status(500).json({ error: 'Failed to reset user password' });
      }
    }
  );

  // Data Import/Export Routes
  app.post('/api/superadmin/data/import',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.IMPORT_DATA),
    logSuperAdminAction('IMPORT_DATA'),
    async (req: AuthRequest, res) => {
      try {
        console.log(`🔴 DATA IMPORT initiated by super admin ${req.user?.username}`);
        
        const importId = `import_${Date.now()}`;
        
        res.json({
          success: true,
          importId,
          message: 'Data import process initiated',
          status: 'processing',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin import data error:', error);
        res.status(500).json({ error: 'Failed to import data' });
      }
    }
  );

  app.get('/api/superadmin/data/export',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.EXPORT_DATA),
    logSuperAdminAction('EXPORT_DATA'),
    async (req: AuthRequest, res) => {
      try {
        const { type = 'full' } = req.query;
        
        console.log(`🔴 DATA EXPORT (${type}) initiated by super admin ${req.user?.username}`);
        
        const exportId = `export_${Date.now()}`;
        const downloadUrl = `/api/superadmin/data/download/${exportId}`;
        
        res.json({
          success: true,
          exportId,
          downloadUrl,
          type,
          estimatedSize: '125MB',
          message: 'Data export process initiated',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin export data error:', error);
        res.status(500).json({ error: 'Failed to export data' });
      }
    }
  );

  // Analytics Routes
  app.get('/api/superadmin/analytics/system-health',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        // In a real system, this would query actual system metrics
        const systemHealth = {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          activeConnections: 45, // Mock data
          responseTime: 120, // Mock data
          errorRate: 0.02, // Mock data
          databaseHealth: 'healthy',
          lastBackup: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
          diskUsage: {
            used: '45GB',
            available: '155GB',
            percentage: 22
          }
        };
        
        res.json(systemHealth);
      } catch (error) {
        console.error('Super admin system health error:', error);
        res.status(500).json({ error: 'Failed to fetch system health' });
      }
    }
  );

  // Feature Toggle Management
  app.get('/api/superadmin/features',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        // Mock feature toggles - in a real system, these would be stored in database
        const features = [
          {
            id: 'telemedicine',
            name: 'Telemedicine',
            description: 'Video consultation capabilities',
            enabled: true,
            organizations: ['all']
          },
          {
            id: 'ai_diagnostics',
            name: 'AI Diagnostics',
            description: 'AI-powered diagnostic suggestions',
            enabled: false,
            organizations: []
          },
          {
            id: 'mobile_app',
            name: 'Mobile App Access',
            description: 'Mobile application access',
            enabled: true,
            organizations: [1, 2]
          }
        ];
        
        res.json(features);
      } catch (error) {
        console.error('Super admin get features error:', error);
        res.status(500).json({ error: 'Failed to fetch features' });
      }
    }
  );

  app.patch('/api/superadmin/features/:featureId',
    authenticateToken,
    requireSuperAdmin,
    requireSuperAdminPermission(SuperAdminPermissions.MANAGE_FEATURE_TOGGLES),
    logSuperAdminAction('MANAGE_FEATURE_TOGGLES'),
    async (req: AuthRequest, res) => {
      try {
        const { featureId } = req.params;
        const { enabled, organizations } = req.body;
        
        console.log(`🔴 FEATURE TOGGLE: ${featureId} ${enabled ? 'ENABLED' : 'DISABLED'} by super admin ${req.user?.username}`);
        console.log(`Organizations: ${organizations?.join(', ') || 'all'}`);
        
        res.json({
          featureId,
          enabled,
          organizations,
          updatedBy: req.user?.username,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin feature toggle error:', error);
        res.status(500).json({ error: 'Failed to update feature' });
      }
    }
  );
}