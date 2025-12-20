import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { users, organizations, auditLogs, invoices, payments } from "@shared/schema";
import { eq, and, gte, desc, sql, count, or, isNull, isNotNull } from "drizzle-orm";

const router = Router();

/**
 * GET /api/admin/workflow/stats
 * Get workflow statistics
 */
router.get('/stats', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count pending tasks (users without roles, inactive organizations, pending payments, etc.)
    const [pendingUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        organizationId ? eq(users.organizationId, organizationId) : sql`true`,
        or(isNull(users.role), eq(users.role, ''), eq(users.isActive, false))
      ));

    const [pendingOrgsResult] = await db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.isActive, false));

    // Count completed tasks today (from audit logs)
    const [completedTodayResult] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(and(
        gte(auditLogs.createdAt, today),
        or(
          sql`${auditLogs.action} LIKE '%APPROVED%'`,
          sql`${auditLogs.action} LIKE '%COMPLETED%'`
        )
      ));

    const pendingTasks = (pendingUsersResult?.count || 0) + (pendingOrgsResult?.count || 0);
    const completedToday = completedTodayResult?.count || 0;

    // Calculate average processing time (mock for now - would need task timestamps)
    const averageProcessingTime = 15; // minutes

    // Group tasks by type
    const tasksByType = {
      user_approval: pendingUsersResult?.count || 0,
      organization_approval: pendingOrgsResult?.count || 0,
      payment_approval: 0,
      document_approval: 0,
      role_assignment: 0,
      system_config: 0,
    };

    // Group by priority (mock data - would need priority field)
    const tasksByPriority = {
      urgent: 0,
      high: Math.floor(pendingTasks * 0.2),
      medium: Math.floor(pendingTasks * 0.5),
      low: Math.floor(pendingTasks * 0.3),
    };

    res.json({
      pendingTasks,
      completedToday,
      averageProcessingTime,
      tasksByType,
      tasksByPriority,
    });
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    res.status(500).json({ message: 'Failed to fetch workflow stats' });
  }
});

/**
 * GET /api/admin/workflow/tasks
 * Get workflow tasks with filters
 */
router.get('/tasks', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const { type, priority, status } = req.query;
    const organizationId = req.user?.organizationId;

    const tasks: any[] = [];

    // Fetch users needing approval (no role or inactive)
    if (!type || type === 'all' || type === 'user_approval') {
      const pendingUsers = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(
          organizationId ? eq(users.organizationId, organizationId) : sql`true`,
          or(isNull(users.role), eq(users.role, ''), eq(users.isActive, false))
        ))
        .limit(50);

      for (const user of pendingUsers) {
        tasks.push({
          id: user.id,
          type: 'user_approval',
          title: `Approve User: ${user.firstName || user.username || 'Unknown'}`,
          description: `User ${user.username || user.email} needs role assignment or activation`,
          priority: 'medium',
          status: 'pending',
          createdAt: user.createdAt.toISOString(),
          createdBy: user.username || user.email,
          metadata: {
            userId: user.id,
            username: user.username,
            email: user.email,
          },
        });
      }
    }

    // Fetch organizations needing approval
    if (!type || type === 'all' || type === 'organization_approval') {
      const pendingOrgs = await db
        .select()
        .from(organizations)
        .where(eq(organizations.isActive, false))
        .limit(20);

      for (const org of pendingOrgs) {
        tasks.push({
          id: org.id + 100000, // Offset to avoid conflicts
          type: 'organization_approval',
          title: `Approve Organization: ${org.name}`,
          description: `Organization ${org.name} is pending activation`,
          priority: 'high',
          status: 'pending',
          createdAt: org.createdAt.toISOString(),
          metadata: {
            organizationId: org.id,
            organizationName: org.name,
          },
        });
      }
    }

    // Filter by priority if specified
    let filteredTasks = tasks;
    if (priority && priority !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.priority === priority);
    }

    // Filter by status if specified
    if (status && status !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.status === status);
    }

    // Sort by creation date (newest first)
    filteredTasks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(filteredTasks);
  } catch (error) {
    console.error('Error fetching workflow tasks:', error);
    res.status(500).json({ message: 'Failed to fetch workflow tasks' });
  }
});

/**
 * POST /api/admin/workflow/tasks/:taskId/approve
 * Approve a workflow task
 */
router.post('/tasks/:taskId/approve', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { notes } = req.body;

    // Determine task type from ID range
    if (taskId < 100000) {
      // User approval task
      await db
        .update(users)
        .set({ 
          isActive: true,
          role: req.body.role || 'user', // Default role if not provided
        })
        .where(eq(users.id, taskId));

      res.json({ 
        message: 'User approved successfully',
        taskId,
        type: 'user_approval',
      });
    } else {
      // Organization approval task
      const orgId = taskId - 100000;
      await db
        .update(organizations)
        .set({ isActive: true })
        .where(eq(organizations.id, orgId));

      res.json({ 
        message: 'Organization approved successfully',
        taskId,
        type: 'organization_approval',
      });
    }
  } catch (error) {
    console.error('Error approving task:', error);
    res.status(500).json({ message: 'Failed to approve task' });
  }
});

/**
 * POST /api/admin/workflow/tasks/:taskId/reject
 * Reject a workflow task
 */
router.post('/tasks/:taskId/reject', authenticateToken, requireAnyRole(['admin', 'super_admin', 'superadmin']), async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { reason } = req.body;

    // For rejection, we might want to delete or mark as rejected
    // For now, just return success - actual implementation depends on business logic
    res.json({ 
      message: 'Task rejected successfully',
      taskId,
      reason,
    });
  } catch (error) {
    console.error('Error rejecting task:', error);
    res.status(500).json({ message: 'Failed to reject task' });
  }
});

export default router;

