import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Middleware to ensure only super admins can access certain routes
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'superadmin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      error: 'Super admin access required',
      message: 'This action requires super administrator privileges'
    });
  }

  next();
};

// Middleware to log super admin actions for audit purposes
export const logSuperAdminAction = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log(`🔴 SUPER ADMIN ACTION: ${action} by user ${req.user?.id} (${req.user?.username})`);
    
    // Add audit logging here if needed
    const originalSend = res.send;
    res.send = function(data) {
      console.log(`🔴 SUPER ADMIN ACTION COMPLETED: ${action} - Status: ${res.statusCode}`);
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Enhanced permission levels for super admins
export const SuperAdminPermissions = {
  // Organization Management
  CREATE_ORGANIZATION: 'create_organization',
  SUSPEND_ORGANIZATION: 'suspend_organization',
  DELETE_ORGANIZATION: 'delete_organization',
  MODIFY_ORGANIZATION_SETTINGS: 'modify_organization_settings',
  
  // User Management
  IMPERSONATE_USER: 'impersonate_user',
  LOCK_USER_ACCOUNT: 'lock_user_account',
  UNLOCK_USER_ACCOUNT: 'unlock_user_account',
  FORCE_PASSWORD_RESET: 'force_password_reset',
  VIEW_ALL_USERS: 'view_all_users',
  
  // System Control
  ENABLE_MAINTENANCE_MODE: 'enable_maintenance_mode',
  RESTART_SYSTEM: 'restart_system',
  MANAGE_FEATURE_TOGGLES: 'manage_feature_toggles',
  SEND_SYSTEM_ANNOUNCEMENTS: 'send_system_announcements',
  
  // Security & Monitoring
  VIEW_USER_SESSIONS: 'view_user_sessions',
  TERMINATE_USER_SESSIONS: 'terminate_user_sessions',
  CONFIGURE_SECURITY_POLICIES: 'configure_security_policies',
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  
  // Data Management
  CREATE_SYSTEM_BACKUP: 'create_system_backup',
  MANAGE_DATA_MIGRATION: 'manage_data_migration',
  DATABASE_ADMIN_ACCESS: 'database_admin_access',
  DATA_CLEANUP: 'data_cleanup',
  
  // Advanced Analytics
  VIEW_GLOBAL_ANALYTICS: 'view_global_analytics',
  EXPORT_SYSTEM_DATA: 'export_system_data',
  GENERATE_COMPLIANCE_REPORTS: 'generate_compliance_reports'
};

// Check if super admin has specific permission
export const hasSuperAdminPermission = (req: AuthRequest, permission: string): boolean => {
  if (!req.user || req.user.role !== 'superadmin') {
    return false;
  }
  
  // Super admins have all permissions by default
  // In a more complex system, you might check against a permissions table
  return true;
};

// Middleware factory for checking specific super admin permissions
export const requireSuperAdminPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!hasSuperAdminPermission(req, permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Super admin permission '${permission}' required`,
        requiredPermission: permission
      });
    }
    next();
  };
};