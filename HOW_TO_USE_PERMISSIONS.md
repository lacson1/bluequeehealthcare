# How to Use Permission Checkboxes

## Where Are the Checkboxes?

The **checkboxes for permissions** appear **inside expanded permission categories**. Here's the step-by-step flow:

### Step-by-Step Guide

1. **Select a Role** (Left Panel)
   - Click on a role card (e.g., "Doctor", "Nurse", "Pharmacist")
   - The role will be highlighted

2. **Permission Categories Appear** (Right Panel)
   - You'll see categories like:
     - 👥 **Patients**
     - 📋 **Visits**
     - 🧪 **Lab**
     - 📝 **Consultations**
     - 💊 **Medications**
     - etc.

3. **Expand a Category** to See Checkboxes
   - Click on a category header (e.g., "Patients")
   - The category expands to show individual permissions
   - **Each permission has a checkbox on the left**

4. **Use the Checkboxes**
   - ✅ **Check** = Grant permission
   - ☐ **Uncheck** = Revoke permission
   - Changes are tracked (you'll see "Unsaved Changes" badge)

5. **Save Changes**
   - Click "Save Changes" button at the top right
   - Permissions are saved for the selected role

---

## Why You See "No Permissions Found"

If you see **"No Permissions Found"**, it means the **permissions table is empty**. You need to seed the database first.

### Solution: Seed Permissions

**Option 1: Using the Seed Script (Recommended)**

```bash
# Make sure your server is running (it has DATABASE_URL)
# Then run:
npm run seed:permissions
```

**Option 2: Using SQL Directly**

If you have direct database access:

```bash
psql $DATABASE_URL -f rbac_seed.sql
```

Or if using Docker:

```bash
docker exec -i clinicconnect-postgres psql -U clinicuser -d clinicconnect < rbac_seed.sql
```

**Option 3: Manual SQL Insert**

Run the SQL from `rbac_seed.sql` file directly in your database.

---

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│ Role Permissions Page                                       │
├──────────────────┬──────────────────────────────────────────┤
│ ROLES            │ PERMISSIONS FOR DOCTOR                   │
│                  │                                          │
│ 👨‍⚕️ Doctor      │ ┌─ 👥 Patients ────────────────┐         │
│   15 permissions │ │ ☑ viewPatients              │         │
│   5 users        │ │ ☑ editPatients              │         │
│                  │ │ ☐ deletePatients            │         │
│ 👩‍⚕️ Nurse       │ └───────────────────────────────┘         │
│   8 permissions  │                                          │
│   3 users        │ ┌─ 📋 Visits ───────────────────┐       │
│                  │ │ ☑ createVisit                │       │
│ 💊 Pharmacist    │ │ ☑ viewVisits                 │       │
│   5 permissions  │ │ ☑ editVisits                 │       │
│   2 users        │ └──────────────────────────────┘       │
└──────────────────┴──────────────────────────────────────────┘
```

**Key Points:**
- Checkboxes are **inside** expanded categories
- Categories are **collapsed by default**
- Click category header to **expand** and see checkboxes
- Use "Expand All" button to expand all categories at once

---

## Quick Actions

The toolbar has helpful buttons:

- **Expand All** - Opens all categories to show all checkboxes
- **Collapse All** - Closes all categories
- **Select All** - Checks all permission checkboxes
- **Deselect All** - Unchecks all permission checkboxes

---

## Troubleshooting

### Problem: "No Permissions Found"
**Solution:** Seed the database with permissions (see above)

### Problem: Categories don't expand
**Solution:** 
1. Make sure a role is selected
2. Check browser console for errors
3. Refresh the page

### Problem: Checkboxes don't appear
**Solution:**
1. Expand the category first (click the category header)
2. Check if permissions are loaded (look at "X / Y permissions" counter)
3. Try "Expand All" button

### Problem: Changes don't save
**Solution:**
1. Make sure you clicked "Save Changes" button
2. Check browser console for errors
3. Verify you have permission to modify roles

---

## After Seeding

Once permissions are seeded:

1. **Refresh** the browser page
2. **Select** a role (e.g., "Doctor")
3. You should see:
   - Permission categories listed
   - "X / 30 permissions" counter
   - Categories can be expanded
4. **Expand** a category (click it)
5. **See checkboxes** for each permission
6. **Check/uncheck** to grant/revoke permissions
7. **Save Changes** when done

---

**Need Help?** Check the browser console (F12) for any error messages.

