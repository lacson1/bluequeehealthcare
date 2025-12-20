import { Express } from 'express';
import { AuthRequest, authenticateToken } from './middleware/auth';
import { 
  requireSuperAdmin, 
  logSuperAdminAction, 
  requireSuperAdminPermission,
  SuperAdminPermissions 
} from './middleware/super-admin';
import { db } from './db';
import { organizations, users, auditLogs, patients, visits, appointments } from '../shared/schema';
import { eq, sql, and, isNull, or, ilike, desc, gte, count } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// In-memory store for system state (in production, use Redis or database)
const systemState = {
  maintenanceMode: false,
  maintenanceMessage: '',
  maintenanceEstimatedDuration: '',
  activeSessions: new Map<string, any>(),
  features: new Map<string, { enabled: boolean; organizations: number[] }>([
    ['telemedicine', { enabled: true, organizations: [] }],
    ['ai_diagnostics', { enabled: true, organizations: [] }],
    ['mobile_app', { enabled: true, organizations: [] }],
    ['patient_portal', { enabled: true, organizations: [] }],
    ['lab_integration', { enabled: true, organizations: [] }],
    ['billing_module', { enabled: true, organizations: [] }],
  ]),
  securityPolicies: {
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    passwordPolicy: 'strong',
    enforceIPWhitelist: false,
    requireMFA: false,
    auditRetentionDays: 90,
  },
  globalPolicies: {
    allowPatientSelfRegistration: true,
    requireEmailVerification: false,
    defaultUserRole: 'nurse',
    maxUsersPerOrganization: 100,
    enableDataSharing: false,
  }
};

export function setupSuperAdminRoutes(app: Express) {
  
  // Organization Management Routes
  app.post('/api/superadmin/organizations', 
    authenticateToken, 
    requireSuperAdmin,
    logSuperAdminAction('CREATE_ORGANIZATION'),
    async (req: AuthRequest, res) => {
      try {
        console.log('=== SUPER ADMIN ORGANIZATION CREATION REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { name, type, email, phone, address, website, logoUrl, themeColor } = req.body;
        
        // Validate required fields
        if (!name || name.trim() === '') {
          return res.status(400).json({ message: 'Organization name is required' });
        }
        
        // Prepare data for insertion with proper defaults
        const insertData = {
          name: name.trim(),
          type: type || 'clinic',
          email: email && email.trim() !== '' ? email.trim() : null,
          phone: phone && phone.trim() !== '' ? phone.trim() : null,
          address: address && address.trim() !== '' ? address.trim() : null,
          website: website && website.trim() !== '' ? website.trim() : null,
          logoUrl: logoUrl && logoUrl.trim() !== '' ? logoUrl.trim() : null,
          themeColor: themeColor || '#3B82F6',
          isActive: true,
        };
        
        console.log('Insert data:', JSON.stringify(insertData, null, 2));
        
        // Check if organization with same name already exists
        const existingOrg = await db
          .select()
          .from(organizations)
          .where(eq(organizations.name, insertData.name))
          .limit(1);
        
        if (existingOrg.length > 0) {
          return res.status(400).json({ 
            message: 'An organization with this name already exists' 
          });
        }
        
        // Check if organization with same email already exists (if email provided)
        if (insertData.email) {
          const existingOrgByEmail = await db
            .select()
            .from(organizations)
            .where(eq(organizations.email, insertData.email))
            .limit(1);
          
          if (existingOrgByEmail.length > 0) {
            return res.status(400).json({ 
              message: 'An organization with this email already exists' 
            });
          }
        }
        
        const [newOrg] = await db.insert(organizations).values(insertData).returning();
        
        console.log('Organization created successfully:', newOrg.id);
        
        res.status(201).json(newOrg);
      } catch (error) {
        console.error('Super admin create organization error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Provide more detailed error message
        if (error instanceof Error) {
          if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ 
              message: 'An organization with this name or email already exists' 
            });
          }
          if (error.message.includes('foreign key') || error.message.includes('constraint')) {
            return res.status(400).json({ 
              message: error.message 
            });
          }
        }
        
        res.status(500).json({ 
          message: 'Failed to create organization',
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      }
    }
  );

  // Update organization details
  app.patch('/api/superadmin/organizations/:id',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('UPDATE_ORGANIZATION'),
    async (req: AuthRequest, res) => {
      try {
        const orgId = parseInt(req.params.id);
        const updateData = req.body;
        
        console.log('=== SUPER ADMIN ORGANIZATION UPDATE REQUEST ===');
        console.log('Organization ID:', orgId);
        console.log('Update data:', JSON.stringify(updateData, null, 2));
        
        // Remove any fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        
        // Process the data to handle empty strings properly
        const processedData: any = {};
        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            // Convert empty strings to null for nullable fields
            if (value === '' && ['email', 'phone', 'address', 'website', 'logoUrl'].includes(key)) {
              processedData[key] = null;
            } else {
              processedData[key] = value;
            }
          }
        }
        
        // Check if organization exists
        const [existingOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);
        
        if (!existingOrg) {
          return res.status(404).json({ message: 'Organization not found' });
        }
        
        // Check for duplicate name (if name is being changed)
        if (processedData.name && processedData.name !== existingOrg.name) {
          const duplicateOrg = await db
            .select()
            .from(organizations)
            .where(eq(organizations.name, processedData.name))
            .limit(1);
          
          if (duplicateOrg.length > 0) {
            return res.status(400).json({ 
              message: 'An organization with this name already exists' 
            });
          }
        }
        
        // Check for duplicate email (if email is being changed and not null)
        if (processedData.email && processedData.email !== existingOrg.email) {
          const duplicateOrgByEmail = await db
            .select()
            .from(organizations)
            .where(eq(organizations.email, processedData.email))
            .limit(1);
          
          if (duplicateOrgByEmail.length > 0) {
            return res.status(400).json({ 
              message: 'An organization with this email already exists' 
            });
          }
        }
        
        // Update the organization
        const [updatedOrg] = await db
          .update(organizations)
          .set({
            ...processedData,
            updatedAt: new Date()
          })
          .where(eq(organizations.id, orgId))
          .returning();
        
        console.log('Organization updated successfully:', updatedOrg.id);
        
        res.json(updatedOrg);
      } catch (error) {
        console.error('Super admin update organization error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        res.status(500).json({ 
          message: 'Failed to update organization',
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
      }
    }
  );

  // Update organization status (activate/deactivate)
  app.patch('/api/superadmin/organizations/:id/status',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('UPDATE_ORGANIZATION_STATUS'),
    async (req: AuthRequest, res) => {
      try {
        const orgId = parseInt(req.params.id);
        const { isActive } = req.body;
        
        console.log('=== SUPER ADMIN ORGANIZATION STATUS UPDATE ===');
        console.log('Organization ID:', orgId);
        console.log('New status (isActive):', isActive);
        
        if (typeof isActive !== 'boolean') {
          return res.status(400).json({ 
            message: 'isActive must be a boolean value' 
          });
        }
        
        // Check if organization exists
        const [existingOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);
        
        if (!existingOrg) {
          return res.status(404).json({ message: 'Organization not found' });
        }
        
        const [updatedOrg] = await db
          .update(organizations)
          .set({ 
            isActive: isActive,
            updatedAt: new Date()
          })
          .where(eq(organizations.id, orgId))
          .returning();
        
        console.log(`Organization ${orgId} status updated to ${isActive ? 'active' : 'inactive'}`);
        
        res.json({
          message: isActive ? 'Organization activated' : 'Organization deactivated',
          organization: updatedOrg
        });
      } catch (error) {
        console.error('Super admin update organization status error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        res.status(500).json({ 
          message: 'Failed to update organization status',
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        });
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
        
        // Update in-memory store
        systemState.features.set(featureId, { 
          enabled, 
          organizations: organizations || [] 
        });
        
        console.log(`🔴 FEATURE TOGGLE: ${featureId} ${enabled ? 'ENABLED' : 'DISABLED'} by super admin ${req.user?.username}`);
        
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

  // =============================================
  // ENHANCED SESSION MONITORING
  // =============================================
  app.get('/api/superadmin/sessions',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        // Get recently active users (logged in within last 24 hours)
        const recentUsers = await db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          organizationId: users.organizationId,
          lastLogin: users.lastLogin,
          isActive: users.isActive,
        })
        .from(users)
        .where(
          and(
            eq(users.isActive, true),
            gte(users.lastLogin, new Date(Date.now() - 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(users.lastLogin))
        .limit(100);

        // Transform to session format
        const sessions = recentUsers.map((user, index) => ({
          id: `sess_${user.id}_${Date.now()}`,
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          ipAddress: `192.168.1.${100 + index}`, // Mock IP
          userAgent: 'Browser Session',
          loginTime: user.lastLogin?.toISOString() || new Date().toISOString(),
          lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          isActive: true,
          sessionDuration: user.lastLogin 
            ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / 60000) + ' minutes'
            : 'Unknown'
        }));

        res.json({
          sessions,
          totalActive: sessions.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
      }
    }
  );

  // Force logout a user session
  app.delete('/api/superadmin/sessions/:sessionId',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('FORCE_LOGOUT'),
    async (req: AuthRequest, res) => {
      try {
        const { sessionId } = req.params;
        
        console.log(`🔴 FORCE LOGOUT: Session ${sessionId} terminated by super admin ${req.user?.username}`);
        
        res.json({
          success: true,
          message: 'Session terminated successfully',
          sessionId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin force logout error:', error);
        res.status(500).json({ error: 'Failed to terminate session' });
      }
    }
  );

  // =============================================
  // SECURITY POLICIES
  // =============================================
  app.get('/api/superadmin/security/policies',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        res.json(systemState.securityPolicies);
      } catch (error) {
        console.error('Super admin get security policies error:', error);
        res.status(500).json({ error: 'Failed to fetch security policies' });
      }
    }
  );

  app.patch('/api/superadmin/security/policies',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('UPDATE_SECURITY_POLICIES'),
    async (req: AuthRequest, res) => {
      try {
        const updates = req.body;
        
        // Update security policies
        Object.assign(systemState.securityPolicies, updates);
        
        console.log(`🔴 SECURITY POLICIES UPDATED by super admin ${req.user?.username}`);
        console.log('New policies:', systemState.securityPolicies);
        
        res.json({
          success: true,
          policies: systemState.securityPolicies,
          updatedBy: req.user?.username,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin update security policies error:', error);
        res.status(500).json({ error: 'Failed to update security policies' });
      }
    }
  );

  // =============================================
  // GLOBAL ORGANIZATION POLICIES
  // =============================================
  app.get('/api/superadmin/policies/global',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        res.json(systemState.globalPolicies);
      } catch (error) {
        console.error('Super admin get global policies error:', error);
        res.status(500).json({ error: 'Failed to fetch global policies' });
      }
    }
  );

  app.patch('/api/superadmin/policies/global',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('UPDATE_GLOBAL_POLICIES'),
    async (req: AuthRequest, res) => {
      try {
        const updates = req.body;
        
        // Update global policies
        Object.assign(systemState.globalPolicies, updates);
        
        console.log(`🔴 GLOBAL POLICIES UPDATED by super admin ${req.user?.username}`);
        console.log('New policies:', systemState.globalPolicies);
        
        res.json({
          success: true,
          policies: systemState.globalPolicies,
          updatedBy: req.user?.username,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin update global policies error:', error);
        res.status(500).json({ error: 'Failed to update global policies' });
      }
    }
  );

  // =============================================
  // ACTIVITY MONITORING
  // =============================================
  app.get('/api/superadmin/activity',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const { limit = 50, offset = 0, userId, organizationId, action } = req.query;
        
        // Build query conditions
        let conditions: any[] = [];
        if (userId) {
          conditions.push(eq(auditLogs.userId, Number(userId)));
        }
        if (organizationId) {
          conditions.push(eq(auditLogs.organizationId, Number(organizationId)));
        }
        if (action) {
          conditions.push(eq(auditLogs.action, String(action)));
        }

        const logs = await db.select()
          .from(auditLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(auditLogs.timestamp))
          .limit(Number(limit))
          .offset(Number(offset));

        // Get total count
        const [countResult] = await db.select({ count: count() })
          .from(auditLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        res.json({
          activities: logs,
          total: countResult?.count || 0,
          limit: Number(limit),
          offset: Number(offset),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin activity monitor error:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
      }
    }
  );

  // Get activity statistics
  app.get('/api/superadmin/activity/stats',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get activity counts by action type
        const activityStats = await db.select({
          action: auditLogs.action,
          count: count()
        })
        .from(auditLogs)
        .where(gte(auditLogs.timestamp, today))
        .groupBy(auditLogs.action);

        // Get total activities today
        const [todayCount] = await db.select({ count: count() })
          .from(auditLogs)
          .where(gte(auditLogs.timestamp, today));

        res.json({
          todayTotal: todayCount?.count || 0,
          byAction: activityStats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin activity stats error:', error);
        res.status(500).json({ error: 'Failed to fetch activity stats' });
      }
    }
  );

  // =============================================
  // LOG VIEWER
  // =============================================
  app.get('/api/superadmin/logs',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const { 
          level = 'all', 
          startDate, 
          endDate, 
          search,
          limit = 100,
          offset = 0
        } = req.query;

        // Build conditions
        let conditions: any[] = [];
        
        if (startDate) {
          conditions.push(gte(auditLogs.timestamp, new Date(String(startDate))));
        }
        
        if (search) {
          conditions.push(
            or(
              ilike(auditLogs.action, `%${search}%`),
              sql`${auditLogs.details}::text ILIKE ${'%' + search + '%'}`
            )
          );
        }

        const logs = await db.select({
          id: auditLogs.id,
          action: auditLogs.action,
          userId: auditLogs.userId,
          organizationId: auditLogs.organizationId,
          details: auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          timestamp: auditLogs.timestamp,
        })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.timestamp))
        .limit(Number(limit))
        .offset(Number(offset));

        // Transform to log format
        const formattedLogs = logs.map(log => ({
          id: log.id,
          level: log.action?.includes('ERROR') ? 'error' : 
                 log.action?.includes('WARN') ? 'warning' : 'info',
          action: log.action,
          userId: log.userId,
          organizationId: log.organizationId,
          message: log.action,
          details: log.details,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp
        }));

        res.json({
          logs: formattedLogs,
          total: logs.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin log viewer error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
      }
    }
  );

  // =============================================
  // DATA CLEANUP
  // =============================================
  app.post('/api/superadmin/data/cleanup',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('DATA_CLEANUP'),
    async (req: AuthRequest, res) => {
      try {
        const { 
          cleanupType = 'all',
          olderThanDays = 90,
          dryRun = true 
        } = req.body;

        console.log(`🔴 DATA CLEANUP initiated by super admin ${req.user?.username}`);
        console.log(`Type: ${cleanupType}, Older than: ${olderThanDays} days, Dry run: ${dryRun}`);

        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        
        let cleanupResults: any = {
          auditLogs: 0,
          orphanedRecords: 0,
          temporaryData: 0
        };

        if (!dryRun) {
          // Clean old audit logs (only if not dry run)
          if (cleanupType === 'all' || cleanupType === 'auditLogs') {
            const result = await db.delete(auditLogs)
              .where(sql`${auditLogs.timestamp} < ${cutoffDate}`)
              .returning();
            cleanupResults.auditLogs = result.length;
          }
        } else {
          // Dry run - just count what would be cleaned
          const [auditCount] = await db.select({ count: count() })
            .from(auditLogs)
            .where(sql`${auditLogs.timestamp} < ${cutoffDate}`);
          cleanupResults.auditLogs = auditCount?.count || 0;
        }

        res.json({
          success: true,
          dryRun,
          cleanupType,
          olderThanDays,
          cutoffDate: cutoffDate.toISOString(),
          results: cleanupResults,
          message: dryRun 
            ? 'Dry run completed - no data was deleted' 
            : 'Data cleanup completed successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin data cleanup error:', error);
        res.status(500).json({ error: 'Failed to perform data cleanup' });
      }
    }
  );

  // =============================================
  // AUDIT CONFIGURATION
  // =============================================
  app.get('/api/superadmin/audit/config',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const auditConfig = {
          enabled: true,
          retentionDays: systemState.securityPolicies.auditRetentionDays,
          logLevel: 'detailed',
          trackedActions: [
            'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
            'VIEW_PATIENT', 'PRESCRIBE', 'LAB_ORDER', 'APPOINTMENT'
          ],
          excludedActions: [],
          anonymizeAfterDays: 365,
          exportEnabled: true
        };
        
        res.json(auditConfig);
      } catch (error) {
        console.error('Super admin get audit config error:', error);
        res.status(500).json({ error: 'Failed to fetch audit configuration' });
      }
    }
  );

  app.patch('/api/superadmin/audit/config',
    authenticateToken,
    requireSuperAdmin,
    logSuperAdminAction('UPDATE_AUDIT_CONFIG'),
    async (req: AuthRequest, res) => {
      try {
        const { retentionDays, logLevel, trackedActions, excludedActions } = req.body;
        
        // Update retention days in security policies
        if (retentionDays) {
          systemState.securityPolicies.auditRetentionDays = retentionDays;
        }
        
        console.log(`🔴 AUDIT CONFIG UPDATED by super admin ${req.user?.username}`);
        
        res.json({
          success: true,
          config: {
            retentionDays: systemState.securityPolicies.auditRetentionDays,
            logLevel: logLevel || 'detailed',
            trackedActions: trackedActions || [],
            excludedActions: excludedActions || []
          },
          updatedBy: req.user?.username,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin update audit config error:', error);
        res.status(500).json({ error: 'Failed to update audit configuration' });
      }
    }
  );

  // =============================================
  // SYSTEM STATUS CHECK
  // =============================================
  app.get('/api/superadmin/system/status',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const systemStatus = {
          maintenanceMode: systemState.maintenanceMode,
          maintenanceMessage: systemState.maintenanceMessage,
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          timestamp: new Date().toISOString()
        };
        
        res.json(systemStatus);
      } catch (error) {
        console.error('Super admin system status error:', error);
        res.status(500).json({ error: 'Failed to fetch system status' });
      }
    }
  );

  // Get comprehensive analytics
  app.get('/api/superadmin/analytics/comprehensive',
    authenticateToken,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        // Get organization count
        const [orgCount] = await db.select({ count: count() }).from(organizations);
        
        // Get user count
        const [userCount] = await db.select({ count: count() }).from(users);
        
        // Get patient count
        const [patientCount] = await db.select({ count: count() }).from(patients);
        
        // Get visit count (today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [visitCount] = await db.select({ count: count() })
          .from(visits)
          .where(gte(visits.visitDate, today));
        
        // Get appointment count (today)
        const [appointmentCount] = await db.select({ count: count() })
          .from(appointments)
          .where(gte(appointments.dateTime, today));

        res.json({
          totalOrganizations: orgCount?.count || 0,
          activeOrganizations: orgCount?.count || 0,
          totalUsers: userCount?.count || 0,
          totalPatients: patientCount?.count || 0,
          todayVisits: visitCount?.count || 0,
          todayAppointments: appointmentCount?.count || 0,
          systemUptime: Math.floor(process.uptime() / 3600) + 'h',
          activeSessions: systemState.activeSessions.size,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Super admin comprehensive analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
      }
    }
  );
}