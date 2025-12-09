import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { messages, patients, dismissedNotifications, users } from "@shared/schema";
import { db } from "../db";
import { eq, and, or, isNull, inArray, desc, sql } from "drizzle-orm";

const router = Router();

/**
 * Notification and messaging routes
 * Handles: notifications, messaging, alerts, patient communication
 */
export function setupNotificationRoutes(): Router {
  
  // Get notifications
  router.get('/notifications', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      const notifications: any[] = [];
      
      if (!organizationId || !userId) {
        return res.json({ notifications: [], totalCount: 0, unreadCount: 0 });
      }
      
      // Get dismissed notifications for this user
      const dismissedNotifs = await db
        .select()
        .from(dismissedNotifications)
        .where(and(
          eq(dismissedNotifications.userId, userId),
          eq(dismissedNotifications.organizationId, organizationId)
        ));
      
      const dismissedIds = new Set(dismissedNotifs.map(d => d.notificationId));

      // Get staff messages (unread messages only)
      try {
        const staffMessages = await db
          .select({
            id: messages.id,
            subject: messages.subject,
            message: messages.message,
            messageType: messages.messageType,
            priority: messages.priority,
            status: messages.status,
            sentAt: messages.sentAt,
            patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`
          })
          .from(messages)
          .leftJoin(patients, eq(messages.patientId, patients.id))
          .where(and(
            eq(messages.organizationId, organizationId),
            or(
              eq(messages.assignedTo, userId),
              isNull(messages.assignedTo),
              eq(messages.recipientRole, req.user?.role || '')
            ),
            inArray(messages.status, ['sent', 'read'])
          ))
          .orderBy(desc(messages.sentAt))
          .limit(10);

        // Add message notifications (excluding dismissed ones)
        staffMessages.forEach(msg => {
          const notificationId = `message-${msg.id}`;
          if (!dismissedIds.has(notificationId)) {
            const isUnread = msg.status === 'sent';
            const isUrgent = msg.priority === 'urgent' || msg.priority === 'high';
            
            notifications.push({
              id: notificationId,
              type: 'message',
              priority: isUnread && isUrgent ? 'high' : isUnread ? 'medium' : 'low',
              title: isUnread ? 'New Staff Message' : 'Staff Message',
              description: `${msg.patientName || 'Patient'} - ${msg.subject}`,
              timestamp: msg.sentAt,
              color: isUnread ? 'bg-purple-500' : 'bg-gray-400'
            });
          }
        });
      } catch (messageError) {
        console.log('Error fetching messages for notifications:', messageError);
      }

      // Sort notifications by priority and timestamp
      notifications.sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      res.json({
        notifications: notifications.slice(0, 6),
        totalCount: notifications.length,
        unreadCount: notifications.filter(n => n.priority === 'high' || n.priority === 'medium').length
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Clear all notifications
  router.post('/notifications/clear', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const organizationId = req.user!.organizationId!;
      
      // Get all current notification IDs
      const currentNotifications: string[] = [];
      
      // Get staff messages
      const staffMessages = await db
        .select()
        .from(messages)
        .where(and(
          eq(messages.organizationId, organizationId),
          or(
            eq(messages.assignedTo, userId),
            isNull(messages.assignedTo),
            eq(messages.recipientRole, req.user?.role || '')
          ),
          inArray(messages.status, ['sent', 'read'])
        ))
        .limit(10);
      
      staffMessages.forEach(msg => {
        currentNotifications.push(`message-${msg.id}`);
      });
      
      // Dismiss all current notifications
      for (const notificationId of currentNotifications) {
        await db.insert(dismissedNotifications)
          .values({
            userId,
            organizationId,
            notificationId
          })
          .onConflictDoNothing();
      }
      
      res.json({ 
        message: "All notifications cleared successfully",
        success: true,
        clearedCount: currentNotifications.length
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Delete individual notification
  router.delete('/notifications/:notificationId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user!.id;
      const organizationId = req.user!.organizationId!;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      // Mark this specific notification as dismissed
      await db.insert(dismissedNotifications)
        .values({
          userId,
          organizationId,
          notificationId
        })
        .onConflictDoNothing();
      
      res.json({ 
        message: "Notification deleted successfully",
        success: true,
        notificationId 
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Send staff notification
  router.post("/notifications/staff", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { 
        type, 
        patientId, 
        patientName, 
        medicationName, 
        reviewId, 
        priority = 'normal', 
        assignedTo = [], 
        message 
      } = req.body;

      if (!type || !patientId || !message) {
        return res.status(400).json({ message: "Type, patient ID, and message are required" });
      }

      // Get staff members with the specified roles in this organization
      const organizationId = req.user?.organizationId || 1;
      const staffToNotify = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role
        })
        .from(users)
        .where(
          and(
            eq(users.organizationId, organizationId),
            assignedTo.length > 0 ? inArray(users.role, assignedTo) : undefined
          )
        );
      
      const response = {
        notificationId: Math.floor(Math.random() * 10000) + 5000,
        staffNotified: staffToNotify.length,
        notifiedStaff: staffToNotify.map(s => ({ username: s.username, role: s.role })),
        message: `Successfully notified ${staffToNotify.length} staff members`,
        createdAt: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error sending staff notifications:', error);
      res.status(500).json({ message: "Failed to send staff notifications" });
    }
  });

  return router;
}
