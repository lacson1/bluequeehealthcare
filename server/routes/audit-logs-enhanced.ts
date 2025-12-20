import { Router } from "express";
import { db } from "../db";
import { auditLogs, users } from "@shared/schema";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { eq, desc, gte, lte, and, sql, or, ilike } from "drizzle-orm";
import { decompressAuditData, decompressAction, decompressEntityType, compressAction, compressEntityType } from "../utils/audit-compress";

const router = Router();

// Get enhanced audit logs with filters
router.get('/enhanced', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const {
      limit = '100',
      user,
      action,
      entityType,
      dateFrom,
      dateTo
    } = req.query;

    const limitNum = parseInt(limit as string);

    // Build where conditions
    const conditions = [];

    if (user && user !== 'all') {
      conditions.push(eq(auditLogs.userId, parseInt(user as string)));
    }

    if (action && action !== 'all') {
      // Compress the action filter to match stored format
      const compressedAction = compressAction(action as string);
      conditions.push(eq(auditLogs.action, compressedAction));
    }

    if (entityType && entityType !== 'all') {
      // Compress the entity type filter to match stored format
      const compressedEntityType = compressEntityType(entityType as string);
      conditions.push(eq(auditLogs.entityType, compressedEntityType));
    }

    if (dateFrom) {
      conditions.push(gte(auditLogs.timestamp, new Date(dateFrom as string)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.timestamp, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`true`;

    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        username: users.username,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        timestamp: auditLogs.timestamp
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limitNum);

    // Decompress and add severity based on action
    const logsWithSeverity = logs.map(log => {
      // Decompress the stored data
      const decompressed = decompressAuditData({
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      });

      let severity: 'info' | 'warning' | 'error' | 'success' = 'info';
      
      const actionLower = decompressed.action?.toLowerCase() || '';
      
      if (actionLower.includes('delete') || actionLower.includes('suspend') || actionLower.includes('lock')) {
        severity = 'warning';
      } else if (actionLower.includes('error') || actionLower.includes('fail')) {
        severity = 'error';
      } else if (actionLower.includes('create') || actionLower.includes('success') || actionLower.includes('complete')) {
        severity = 'success';
      }

      return {
        id: log.id,
        userId: decompressed.userId,
        username: log.username || 'System',
        action: decompressed.action,
        entityType: decompressed.entityType,
        entityId: decompressed.entityId,
        details: decompressed.details ? JSON.stringify(decompressed.details, null, 2) : null,
        ipAddress: decompressed.ipAddress,
        userAgent: decompressed.userAgent,
        timestamp: log.timestamp,
        severity
      };
    });

    res.json(logsWithSeverity);
  } catch (error) {
    console.error("Error fetching enhanced audit logs:", error);
    res.status(500).json({ 
      message: "Failed to fetch audit logs",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get filter options
router.get('/filter-options', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    // Get unique users who have audit logs
    const uniqueUsers = await db
      .selectDistinct({
        id: users.id,
        username: users.username
      })
      .from(users)
      .innerJoin(auditLogs, eq(auditLogs.userId, users.id))
      .orderBy(users.username);

    // Get unique actions (decompress them)
    const uniqueActions = await db
      .selectDistinct({ action: auditLogs.action })
      .from(auditLogs)
      .where(sql`${auditLogs.action} IS NOT NULL`)
      .orderBy(auditLogs.action);

    // Get unique entity types (decompress them)
    const uniqueEntityTypes = await db
      .selectDistinct({ entityType: auditLogs.entityType })
      .from(auditLogs)
      .where(sql`${auditLogs.entityType} IS NOT NULL`)
      .orderBy(auditLogs.entityType);

    res.json({
      users: uniqueUsers,
      actions: uniqueActions.map(a => decompressAction(a.action)).filter(Boolean),
      entityTypes: uniqueEntityTypes.map(e => decompressEntityType(e.entityType)).filter(Boolean)
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ 
      message: "Failed to fetch filter options",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get audit log statistics
router.get('/statistics', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const { period = '7days' } = req.query;
    
    // Calculate date range
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total logs in period
    const [totalLogs] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, startDate));

    // Logs by action
    const logsByAction = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`COUNT(*)::int`
      })
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, startDate))
      .groupBy(auditLogs.action)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Logs by user
    const logsByUser = await db
      .select({
        userId: auditLogs.userId,
        username: users.username,
        count: sql<number>`COUNT(*)::int`
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(gte(auditLogs.timestamp, startDate))
      .groupBy(auditLogs.userId, users.username)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Daily activity
    const dailyActivity = await db
      .select({
        date: sql<string>`DATE(${auditLogs.timestamp})`,
        count: sql<number>`COUNT(*)::int`
      })
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, startDate))
      .groupBy(sql`DATE(${auditLogs.timestamp})`)
      .orderBy(sql`DATE(${auditLogs.timestamp})`);

    res.json({
      totalLogs: totalLogs.count,
      logsByAction,
      logsByUser: logsByUser.map(l => ({ ...l, username: l.username || 'System' })),
      dailyActivity
    });
  } catch (error) {
    console.error("Error fetching audit log statistics:", error);
    res.status(500).json({ 
      message: "Failed to fetch statistics",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export audit logs in simple CSV/JSON format
router.get('/export', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const {
      format = 'json', // 'json' or 'csv'
      user,
      action,
      entityType,
      dateFrom,
      dateTo,
      limit = '10000'
    } = req.query;

    const limitNum = parseInt(limit as string);

    // Build where conditions (same as enhanced endpoint)
    const conditions = [];

    if (user && user !== 'all') {
      conditions.push(eq(auditLogs.userId, parseInt(user as string)));
    }

    if (action && action !== 'all') {
      const compressedAction = compressAction(action as string);
      conditions.push(eq(auditLogs.action, compressedAction));
    }

    if (entityType && entityType !== 'all') {
      const compressedEntityType = compressEntityType(entityType as string);
      conditions.push(eq(auditLogs.entityType, compressedEntityType));
    }

    if (dateFrom) {
      conditions.push(gte(auditLogs.timestamp, new Date(dateFrom as string)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.timestamp, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`true`;

    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        username: users.username,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        timestamp: auditLogs.timestamp
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limitNum);

    // Decompress all logs
    const decompressedLogs = logs.map(log => {
      const decompressed = decompressAuditData({
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      });

      return {
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        user: log.username || `User #${log.userId}`,
        action: decompressed.action,
        entity: decompressed.entityType,
        entityId: decompressed.entityId || '',
        ip: decompressed.ipAddress || '',
        browser: decompressed.userAgent || '',
        details: decompressed.details ? JSON.stringify(decompressed.details) : ''
      };
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP', 'Browser', 'Details'];
      const rows = decompressedLogs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.entity,
        log.entityId,
        log.ip,
        log.browser,
        log.details.replace(/"/g, '""') // Escape quotes for CSV
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(decompressedLogs);
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({ 
      message: "Failed to export audit logs",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

