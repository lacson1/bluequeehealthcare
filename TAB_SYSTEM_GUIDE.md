# Patient Tab System - Complete Guide

## What Was Fixed

### The Problem
The tab system was not working because the **tab configurations were not seeded** in the database. When you tried to add custom tabs, the system couldn't function properly because there were no base system tabs.

### The Solution
Added automatic seeding of tab configurations on server startup. Now when the server starts, it will:
1. ✅ Seed 16 system tabs (Overview, Visits, Lab Results, Medications, etc.)
2. ✅ Seed tab presets (Doctor's View, Nurse's View, etc.)
3. ✅ Enable you to add custom tabs

## How the Tab System Works

### Tab Types

1. **System Tabs** (Built-in, Cannot be Deleted)
   - Overview
   - Visits
   - Lab Results
   - Medications
   - Vitals
   - Documents
   - Billing
   - Insurance
   - Appointments
   - History
   - Reviews
   - Chat
   - Vaccines
   - Timeline
   - Safety
   - Specialty (Consultation Forms)

2. **Custom Tabs** (User-created)
   - Markdown content tabs
   - Query widget tabs (coming soon)
   - iframe embed tabs
   - Custom forms

### Tab Scopes

Tabs can be configured at different levels:
- **System**: Available to everyone (default system tabs)
- **Organization**: Available to all users in an organization
- **Role**: Available to users with a specific role
- **User**: Personal tabs for individual users

## How to Add Custom Tabs

### Method 1: Through the UI (Tab Manager)

1. **Open Patient Profile**: Navigate to any patient's profile
2. **Click Settings Icon** (⚙️): Located in the top-right of the tab bar
3. **Click "Add Custom Tab"**
4. **Fill in Details**:
   - **Tab Label**: Name of your tab (e.g., "My Notes", "Special Forms")
   - **Icon**: Choose from available icons
   - **Content Type**: Currently supports Markdown
5. **Click "Create Tab"**

### Method 2: Through the API

```javascript
POST /api/tab-configs
Content-Type: application/json

{
  "scope": "user",
  "key": "my-custom-tab",
  "label": "My Custom Tab",
  "icon": "Settings2",
  "contentType": "markdown",
  "settings": {
    "markdown": "# My Custom Content\n\nAdd your content here."
  },
  "isVisible": true,
  "displayOrder": 1000
}
```

## Adding Consultation Forms as Tabs

### Current Setup
Consultation forms are available under the **"Specialty" tab** (system tab key: `consultation`). This tab includes:
- Hypertensive Review Assessment
- Diabetic Review Assessment
- Asthma/COPD Assessment
- Mental Health Review
- And more...

### To Add Individual Form Tabs

If you want individual consultation forms as separate tabs:

1. **Create a Custom Tab for Each Form**:
```javascript
POST /api/tab-configs
{
  "scope": "user",
  "key": "hypertension-form",
  "label": "Hypertension",
  "icon": "Heart",
  "contentType": "builtin_component",
  "settings": {
    "componentName": "ConsultationForm",
    "formId": 1  // Specific form ID
  },
  "isVisible": true,
  "displayOrder": 165
}
```

2. **Or Use Presets**: Apply a preset layout that includes form tabs
   - Click "Apply Preset" in Tab Manager
   - Select a preset like "Doctor's View"
   - Click "Apply Preset"

## Tab Management Features

### Visibility Control
- **Show/Hide Tabs**: Click the eye icon (👁️) next to any tab
- System tabs can be hidden but not deleted
- Mandatory tabs cannot be hidden

### Reordering
- **Drag & Drop**: Drag tabs to reorder them (custom tabs only)
- System tabs maintain their default order
- Your custom order is saved per user

### Editing
- **Edit Tab**: Click the pencil icon (✏️)
- Change label and icon
- Update content

### Deleting
- **Delete Tab**: Click the trash icon (🗑️)
- Only custom tabs can be deleted
- Confirmation required

## Troubleshooting

### Tabs Not Showing?
1. **Refresh the page**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. **Check server logs**: Look for "Successfully seeded X system tabs"
3. **Verify database**: System tabs should exist in `tab_configs` table

### Cannot Add Tabs?
1. **Check authentication**: You must be logged in
2. **Check organization context**: Tab creation requires organization context
3. **Check console errors**: Open browser DevTools → Console

### Tabs Showing Empty?
1. **Check tab content type**: Ensure proper content type is set
2. **For custom tabs**: Verify markdown or settings are configured
3. **For system tabs**: Ensure component name matches registry

## Error Messages Explained

| Error | Meaning | Solution |
|-------|---------|----------|
| "Organization context required" | Not logged in or no organization selected | Log in and ensure organization is set |
| "Validation error" | Missing required fields | Check all required fields are provided |
| "Cannot delete system default tabs" | Trying to delete built-in tab | You can only hide system tabs, not delete them |
| "Cannot hide mandatory tab" | Trying to hide required tab | Some tabs are mandatory and always visible |
| "Cannot hide last visible tab" | Trying to hide the only visible tab | At least one tab must remain visible |

## Advanced Configuration

### Custom Form Integration

To integrate your own forms into tabs:

1. **Create Form Component**: Add to `client/src/components/`
2. **Register in Tab Registry**: Add to `SYSTEM_TAB_REGISTRY` in `dynamic-tab-registry.tsx`
3. **Seed Tab Config**: Add to `seedTabConfigs.ts`

### Custom Widgets

For query widgets and data visualizations:

1. **Set Content Type**: Use `query_widget`
2. **Define Query**: Set `settings.query` with your data query
3. **Implement Renderer**: Add widget renderer to DynamicTabRenderer

## File Locations

- **Tab Configurations Seed**: `server/seedTabConfigs.ts`
- **Tab Registry**: `client/src/components/patient-tabs/dynamic-tab-registry.tsx`
- **Tab Manager Component**: `client/src/components/tab-manager.tsx`
- **Dynamic Tab Renderer**: `client/src/components/patient-tabs/DynamicTabRenderer.tsx`
- **API Routes**: `server/routes/tab-configs.ts`
- **Database Schema**: `shared/schema.ts` (search for `tabConfigs`)

## What Changed in This Fix

### Server (`server/index.ts`)
```typescript
// Added import
import { seedTabConfigs } from "./seedTabConfigs";

// Added seeding call before tab presets
try {
  console.log('🌱 Seeding tab configurations...');
  await seedTabConfigs();
} catch (error) {
  console.error('Failed to seed tab configurations:', error);
}
```

### API Error Handling (`server/routes/tab-configs.ts`)
- Enhanced error messages for debugging
- Added Zod validation error details
- Added detailed logging for tab creation

### Client Error Handling (`client/src/components/tab-manager.tsx`)
- Better error parsing and display
- Console logging for debugging
- User-friendly error messages

### Query Client (`client/src/lib/queryClient.ts`)
- Improved error message extraction from API responses
- Better JSON error parsing

## Next Steps

1. **Test the System**: Try adding a custom tab through the UI
2. **Customize Your View**: Hide tabs you don't use
3. **Create Form Tabs**: Add specific consultation forms as dedicated tabs
4. **Share Presets**: Create organization-wide tab layouts for your team

---

**Note**: All changes are automatically saved and synchronized across sessions. Your tab configuration is stored per user and persists across logins.

