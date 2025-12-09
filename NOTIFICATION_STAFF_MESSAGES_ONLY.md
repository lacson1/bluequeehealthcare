# Notification System - Staff Messages Only

## Overview
Modified the notification system to only display staff messages instead of visits, prescriptions, and appointments.

## Changes Made

### Backend Changes (`server/routes.ts`)

#### 1. Updated `/api/notifications` endpoint (Line ~10895)
**Before:** The endpoint showed notifications for:
- Recent active prescriptions
- Recent visits
- Upcoming appointments

**After:** The endpoint now shows only:
- Staff messages (from patients to healthcare providers)
- Messages are filtered by:
  - Organization ID
  - User assignment (assigned to the user, unassigned, or matching user's role)
  - Status (only 'sent' and 'read' messages, excludes 'replied' and 'archived')

**Key Features:**
- Shows up to 10 most recent staff messages
- Unread messages (status='sent') are prioritized with higher priority
- Urgent/high priority messages get 'high' priority notification
- Unread regular messages get 'medium' priority
- Read messages get 'low' priority
- Uses purple color for unread messages, gray for read messages
- Respects dismissed notifications (won't show dismissed messages)

#### 2. Updated `/api/notifications/clear` endpoint (Line ~10987)
**Before:** Cleared notifications for prescriptions, visits, and appointments

**After:** Now clears only staff message notifications
- Fetches current staff messages based on organization and user
- Marks all as dismissed in the database
- Returns count of cleared notifications

#### 3. Delete Individual Notification (Line ~11058)
- No changes needed - endpoint already works generically with notification IDs
- Works seamlessly with new `message-{id}` format

### Frontend Changes (`client/src/components/top-bar.tsx`)

**Enhancement:** Made notifications clickable to navigate to Staff Messages page
- Wrapped notification items with `<Link href="/staff-messages">`
- Clicking on a notification now takes staff to the Staff Messages page
- Delete button still works independently (stops event propagation)

The existing notification UI already supported:
- Dynamic notification types
- Color coding (using Tailwind CSS classes)
- Individual notification deletion
- Clear all notifications
- Real-time updates via React Query

### Notification Format
```javascript
{
  id: "message-{messageId}",
  type: "message",
  priority: "high" | "medium" | "low",
  title: "New Staff Message" | "Staff Message",
  description: "{PatientName} - {MessageSubject}",
  timestamp: "{sentAt}",
  color: "bg-purple-500" | "bg-gray-400"
}
```

### Priority Logic
1. **High Priority:** Unread + (urgent OR high priority message)
2. **Medium Priority:** Unread + normal priority message
3. **Low Priority:** Read messages

### Database Schema
Uses existing tables:
- `messages` - Stores patient-to-staff messages
- `dismissed_notifications` - Tracks which notifications users have dismissed

## How It Works

1. **Patient sends a message** via Patient Portal
2. **Message is routed** to appropriate staff based on role/assignment
3. **Notification appears** in staff member's notification bell
4. **Staff can:**
   - Click to view the notification
   - Delete individual notifications
   - Clear all notifications at once
5. **Dismissed notifications persist** across page refreshes
6. **Only unread and recently read messages** appear as notifications

## Benefits

✅ **Focus on important communications** - Staff only see messages that require action
✅ **Less noise** - No more notifications about every visit/prescription/appointment
✅ **Better patient communication** - Staff are notified when patients reach out
✅ **Persistent dismissals** - Dismissed notifications stay dismissed
✅ **Role-based routing** - Messages go to appropriate staff members

## Testing

To test the notification system:

1. **Login as a patient** via Patient Portal
2. **Send a message** to healthcare provider
3. **Login as staff member** (doctor, nurse, etc.)
4. **Check notification bell** - should see the new message
5. **Click on notification** - should navigate to staff messages
6. **Delete or clear** - should persist across refreshes

## Migration Notes

- No database migration required
- Existing notification data is not affected
- Change is backward compatible
- All existing dismissed notifications continue to work

