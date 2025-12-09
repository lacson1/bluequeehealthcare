# Tab Management Guide - ClinicConnect

## Overview

The ClinicConnect tab system allows you to customize the patient overview interface with dynamic, configurable tabs. This guide explains all tab management functions available to you.

---

## Accessing Tab Manager

### Location
The Tab Manager can be accessed from the patient profile page:

1. Navigate to any patient profile
2. Look for the **Settings icon (⚙️)** in the top-right corner of the tab bar
3. Click the icon to open the Tab Manager dialog

---

## Tab Management Functions

### 1. **View All Tabs**
- Opens automatically when you access the Tab Manager
- Shows all configured tabs in order
- Displays tab properties: name, icon, visibility status, and scope

### 2. **Reorder Tabs (Drag & Drop)**
- **How to use:**
  - Click and hold the grip icon (≡) on the left of any tab
  - Drag the tab up or down to reorder
  - Release to set the new position
  
- **Notes:**
  - System tabs maintain their default order
  - Only custom tabs can be freely reordered
  - Changes save automatically

### 3. **Toggle Tab Visibility**
- **How to use:**
  - Click the eye icon (👁️ or 👁️‍🗨️) on each tab item
  - Eye open = Tab visible
  - Eye closed = Tab hidden
  
- **Notes:**
  - Mandatory tabs cannot be hidden
  - Hidden tabs won't appear in the patient overview
  - You can show them again anytime

### 4. **Edit Tab**
- **How to use:**
  - Click the pencil icon (✏️) on any tab
  - Edit the following properties:
    - **Tab Label**: Change the display name
    - **Icon**: Select from available icons
  - Click "Save Changes"
  
- **Available Icons:**
  - Settings2, LayoutGrid, Calendar, TestTube, Pill
  - Activity, FileText, CreditCard, Shield, CalendarDays
  - History, FileCheck, MessageSquare
  
- **Notes:**
  - Changes apply immediately after saving
  - System tabs can be edited (label and icon)
  - Custom tabs can be fully edited

### 5. **Delete Tab**
- **How to use:**
  - Click the trash icon (🗑️) on any custom tab
  - Confirm deletion in the popup dialog
  
- **Notes:**
  - Only custom tabs can be deleted
  - System tabs cannot be deleted (trash icon disabled)
  - Deletion is permanent but you can recreate tabs

### 6. **Add Custom Tab**
- **How to use:**
  - Click "Add Custom Tab" button at the bottom
  - Fill in:
    - **Tab Label**: Name for your tab (e.g., "Notes", "Special Forms")
    - **Icon**: Choose from dropdown
  - Click "Create Tab"
  
- **Default Content:**
  - New tabs start with markdown content
  - Default text: "# Custom Tab\n\nAdd your content here."
  - You can edit content later (feature coming soon)
  
- **Notes:**
  - Custom tabs are user-specific by default
  - Can be shared at organization/role level (future feature)

### 7. **Apply Preset Layout**
- **How to use:**
  - Click "Apply Preset" button at the bottom
  - Select from available presets:
    - **Doctor's View**: Clinical-focused tabs
    - **Nurse's View**: Care management tabs
    - **Admin View**: Administrative tabs
    - **Default System View**: Standard configuration
  - Click "Apply Preset"
  
- **Notes:**
  - Presets replace your current tab configuration
  - You can customize after applying a preset
  - Marked presets show "Default" badge

---

## Tab Types

### System Tabs (Built-in)
These tabs come pre-configured and cannot be deleted:

1. **Overview** - Patient summary and quick stats
2. **Timeline** - Chronological activity history
3. **Vitals** - Vital signs tracking and charts
4. **Medications** - Active and past prescriptions
5. **Labs** - Laboratory results and orders
6. **Documents** - Medical records and files
7. **Visits** - Visit history and consultations
8. **Appointments** - Scheduled appointments
9. **Billing** - Billing and invoices
10. **Insurance** - Insurance information
11. **History** - Complete medical history
12. **Reviews** - Medication reviews and audits
13. **Chat** - Patient communication hub
14. **Vaccines** - Immunization records
15. **Safety** - Safety alerts and warnings
16. **Specialty** - Specialist consultation forms

### Custom Tabs (User-created)
- Created by users for specific needs
- Can be markdown content, forms, or widgets
- Fully customizable (name, icon, content)
- Can be deleted anytime

---

## Tab Scopes

Tabs can exist at different levels:

### 1. **System Scope**
- Available to everyone
- Default built-in tabs
- Cannot be deleted
- Can be hidden or reordered

### 2. **Organization Scope** (Admin feature)
- Shared across your organization
- Configured by administrators
- Available to all staff

### 3. **Role Scope** (Admin feature)
- Specific to user roles (Doctor, Nurse, Admin, etc.)
- Different tabs for different roles
- Managed by administrators

### 4. **User Scope**
- Personal tabs for individual users
- Created through "Add Custom Tab"
- Private to you

---

## Quick Actions Summary

| Action | Icon | Function |
|--------|------|----------|
| **Drag** | ≡ | Reorder tabs (custom tabs only) |
| **View** | 👁️ | Show tab |
| **Hide** | 👁️‍🗨️ | Hide tab from patient overview |
| **Edit** | ✏️ | Change label and icon |
| **Delete** | 🗑️ | Remove custom tab (permanent) |

---

## Best Practices

### For Doctors
1. Use "Doctor's View" preset as starting point
2. Add custom tabs for:
   - Clinical protocols
   - Referral tracking
   - Research notes
3. Hide administrative tabs you don't need

### For Nurses
1. Use "Nurse's View" preset
2. Focus on:
   - Vitals tracking
   - Medication administration
   - Patient communication
3. Keep safety alerts visible

### For Administrators
1. Use "Admin View" preset
2. Focus on:
   - Billing and insurance
   - Appointments
   - Patient records management
3. Hide clinical tabs if not relevant

### General Tips
- Keep your most-used tabs at the top
- Hide tabs you rarely use instead of deleting them
- Use descriptive names for custom tabs
- Review and update your layout monthly

---

## Keyboard Shortcuts (Coming Soon)

| Shortcut | Action |
|----------|--------|
| `Ctrl + ,` | Open Tab Manager |
| `↑ ↓` | Navigate tabs in manager |
| `Space` | Toggle visibility |
| `Enter` | Edit selected tab |
| `Del` | Delete custom tab |

---

## Troubleshooting

### Tabs Not Loading
**Problem:** Tab Manager shows "Loading tabs..." indefinitely

**Solution:**
1. Refresh the browser page
2. Check your internet connection
3. Clear browser cache
4. Contact system administrator

### Cannot Reorder Tabs
**Problem:** Drag and drop not working

**Solution:**
1. Only custom tabs can be reordered
2. System tabs maintain default order
3. Try clicking and holding the grip icon longer
4. Refresh the page

### Cannot Delete Tab
**Problem:** Delete button is disabled

**Solution:**
1. Only custom tabs can be deleted
2. System tabs cannot be deleted
3. Try hiding the tab instead

### Tab Not Appearing After Creation
**Problem:** Created custom tab doesn't show

**Solution:**
1. Check if tab is marked as visible
2. Refresh the patient profile page
3. Check Tab Manager to verify creation
4. Try creating again with different name

### Changes Not Saving
**Problem:** Edits revert after closing Tab Manager

**Solution:**
1. Wait for "Success" confirmation toast
2. Check internet connection
3. Try again
4. Contact administrator if persists

---

## API Reference (For Developers)

### Get All Tabs
```http
GET /api/tab-configs
```

### Create Custom Tab
```http
POST /api/tab-configs
Content-Type: application/json

{
  "scope": "user",
  "key": "custom-notes",
  "label": "My Notes",
  "icon": "FileText",
  "contentType": "markdown",
  "settings": {
    "markdown": "# Notes\n\nContent here"
  },
  "isVisible": true,
  "displayOrder": 100
}
```

### Update Tab
```http
PATCH /api/tab-configs/:id
Content-Type: application/json

{
  "label": "Updated Label",
  "icon": "Calendar",
  "isVisible": true
}
```

### Delete Tab
```http
DELETE /api/tab-configs/:id
```

### Reorder Tabs
```http
PATCH /api/tab-configs/reorder
Content-Type: application/json

{
  "tabs": [
    { "id": 1, "displayOrder": 10 },
    { "id": 2, "displayOrder": 20 }
  ]
}
```

### Toggle Visibility
```http
PATCH /api/tab-configs/:id/visibility
Content-Type: application/json

{
  "isVisible": true
}
```

### Apply Preset
```http
POST /api/tab-presets/:id/apply
Content-Type: application/json

{
  "targetScope": "user"
}
```

---

## Future Enhancements

### Planned Features
- [ ] Rich text editor for custom tab content
- [ ] Query widgets for database-driven tabs
- [ ] iframe embeds for third-party integrations
- [ ] Tab templates marketplace
- [ ] Export/import tab configurations
- [ ] Tab permissions and sharing
- [ ] Tab analytics (usage tracking)
- [ ] Conditional tab visibility (show based on patient data)

---

## Support

### Need Help?
- **Documentation:** See TAB_SYSTEM_GUIDE.md for technical details
- **Admin Support:** Contact your system administrator
- **Bug Reports:** Report issues to development team
- **Feature Requests:** Submit via feedback form

---

## Version History

### Version 1.0 (Current)
- ✅ Dynamic tab loading from database
- ✅ Drag and drop reordering
- ✅ Show/hide tabs
- ✅ Edit tab properties
- ✅ Delete custom tabs
- ✅ Add custom tabs (markdown)
- ✅ Apply preset layouts
- ✅ Tab scoping (system, organization, role, user)
- ✅ Responsive tab scrolling
- ✅ Icon customization

---

Last Updated: November 29, 2025

