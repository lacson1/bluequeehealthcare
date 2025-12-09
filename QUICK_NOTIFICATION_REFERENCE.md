# Notification System - Quick Reference

## 🎯 What Changed?

**Notifications now only show staff messages (patient messages to healthcare providers).**

Previously showed: Visits, Prescriptions, Appointments  
Now shows: **Staff Messages ONLY**

## 🔔 How It Works

### For Staff
1. **Patient sends message** → Staff gets notification
2. **Click bell icon** → See message notifications
3. **Click notification** → Opens Staff Messages page
4. **Read/Reply** → Notification dismissed

### Notification Colors
- 🟣 **Purple** = Unread message
- ⚫ **Gray** = Read message

### Notification Priority
- 🔴 **High** = Unread urgent/high priority message
- 🟡 **Medium** = Unread normal message
- ⚪ **Low** = Read message

## 📍 Where to Find Messages

**Main Location:** `/staff-messages` page

**Quick Access:**
1. Click notification bell (top right)
2. Click any notification
3. Automatically navigates to Staff Messages page

## 🛠️ Actions Available

### In Notification Dropdown
- ✅ **View** - Click notification to open messages
- ✅ **Delete** - X button on each notification
- ✅ **Clear All** - Trash icon in header

### On Staff Messages Page
- ✅ **Read messages**
- ✅ **Reply to patients**
- ✅ **Mark as read**
- ✅ **Archive**

## 🔄 Notification Lifecycle

```
1. Patient sends message
   ↓
2. Message stored in database
   ↓
3. Notification appears for assigned staff
   ↓
4. Staff clicks notification
   ↓
5. Navigates to Staff Messages page
   ↓
6. Staff can delete/dismiss notification
   ↓
7. Dismissed notification persists (won't reappear)
```

## 💡 Pro Tips

### For Better Workflow
- Check notifications regularly (bell icon shows count)
- Use "Clear All" to quickly dismiss multiple notifications
- Unread messages automatically prioritized at top
- Dismissed notifications stay dismissed across sessions

### Troubleshooting
- **No notifications?** → Check if patient messages exist
- **Notification won't clear?** → Try individual delete (X button)
- **Old notifications reappearing?** → Clear browser cache

## 📊 Technical Details

### API Endpoints Used
- `GET /api/notifications` - Fetch message notifications
- `POST /api/notifications/clear` - Clear all notifications
- `DELETE /api/notifications/:id` - Delete specific notification

### Data Source
- **Table:** `messages`
- **Filter:** Status = 'sent' or 'read'
- **Limit:** 10 most recent
- **Order:** Newest first

### Notification ID Format
- Pattern: `message-{messageId}`
- Example: `message-123`

## 🎨 UI Components

### Top Bar (Notification Bell)
- **Location:** `/client/src/components/top-bar.tsx`
- **Shows:** Unread count badge
- **Click:** Opens notification dropdown

### Notification Dropdown
- **Shows:** Up to 6 most recent notifications
- **Features:** Delete, Clear All, Click to navigate
- **Auto-refresh:** Every 2 minutes

### Staff Messages Page
- **URL:** `/staff-messages`
- **Shows:** All messages (unread, read, replied)
- **Actions:** Read, Reply, Archive

## 📖 Related Documentation

- `NOTIFICATION_STAFF_MESSAGES_ONLY.md` - Detailed technical documentation
- `NOTIFICATION_CHANGES_SUMMARY.md` - Complete change summary
- `TAB_MANAGEMENT_GUIDE.md` - General system guide

---

**Last Updated:** November 29, 2025  
**Status:** ✅ Active and Working

