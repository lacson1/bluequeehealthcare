# Prescription Actions Test Guide

This document outlines all the actions available in the prescription dropdown menu and how to test them.

## Location
The prescription dropdown menu appears in the **Medications & Prescriptions** tab of the patient overview. Click the three-dot menu (⋮) next to any active medication to see the actions.

## Available Actions

### 1. **Edit Details**
- **Action**: Opens edit form for prescription
- **Expected Behavior**: 
  - Shows a prompt to edit dosage (quick edit)
  - If cancelled, shows toast suggesting full edit via prescription management
  - Updates prescription via API if dosage is changed
  - Refreshes medication list after update
- **Test Steps**:
  1. Click "Edit Details" on any active prescription
  2. Try editing the dosage
  3. Verify the prescription updates
  4. Check that the medication list refreshes

### 2. **Print**
- **Action**: Opens print preview for single prescription
- **Expected Behavior**:
  - Opens prescription print modal with organization branding
  - Shows toast: "Opening Print Preview - Prescription print preview is being prepared with organization branding"
  - Displays formatted prescription with letterhead
- **Test Steps**:
  1. Click "Print" on any prescription
  2. Verify print preview opens
  3. Check organization branding appears
  4. Test actual printing

### 3. **Generate QR Code**
- **Action**: Generates QR code for medication
- **Expected Behavior**:
  - Fetches organization data
  - Generates QR code with medication details
  - Opens print window with QR code and organization letterhead
  - QR code contains prescription information
- **Test Steps**:
  1. Click "Generate QR Code"
  2. Verify QR code is generated
  3. Check organization branding
  4. Test scanning the QR code (if possible)

### 4. **Add to Repeat Medications**
- **Action**: Adds prescription to repeat medications list
- **Expected Behavior**:
  - Updates prescription duration to "Ongoing as directed"
  - Adds "[Added to repeat medications]" to instructions
  - Shows toast: "Added to Repeat Medications - [Medication] is now available in repeat medications tab"
  - Refreshes medication list
  - Medication appears in "Repeat" tab
- **Test Steps**:
  1. Click "Add to Repeat Medications"
  2. Verify toast notification
  3. Check "Repeat" tab for the medication
  4. Verify instructions were updated

### 5. **Send to Dispensary**
- **Action**: Sends prescription to pharmacy/dispensary
- **Expected Behavior**:
  - Creates pharmacy activity record
  - Shows toast: "Sent to Dispensary - [Medication] has been sent to the dispensary for processing"
  - Creates activity with type 'dispensing_request' and status 'pending'
- **Test Steps**:
  1. Click "Send to Dispensary"
  2. Verify toast notification
  3. Check pharmacy activities/queue (if accessible)
  4. Verify activity was created

### 6. **Mark Completed**
- **Action**: Marks prescription as completed
- **Expected Behavior**:
  - Updates prescription status to 'completed'
  - Shows toast: "Medication Status Updated - Medication has been completed"
  - Refreshes medication list
  - Medication moves from "Current" to "Past" tab
- **Test Steps**:
  1. Click "Mark Completed"
  2. Verify toast notification
  3. Check medication moves to "Past" tab
  4. Verify status is "completed"

### 7. **Discontinue**
- **Action**: Discontinues the prescription
- **Expected Behavior**:
  - Updates prescription status to 'discontinued'
  - Shows toast: "Medication Status Updated - Medication has been discontinued"
  - Refreshes medication list
  - Medication moves from "Current" to "Past" tab
- **Test Steps**:
  1. Click "Discontinue"
  2. Verify toast notification
  3. Check medication moves to "Past" tab
  4. Verify status is "discontinued"

## Testing Checklist

- [ ] **Edit Details** - Can edit prescription dosage
- [ ] **Print** - Print preview opens with organization branding
- [ ] **Generate QR Code** - QR code generates and prints correctly
- [ ] **Add to Repeat Medications** - Medication appears in Repeat tab
- [ ] **Send to Dispensary** - Activity created in pharmacy system
- [ ] **Mark Completed** - Medication moves to Past tab
- [ ] **Discontinue** - Medication moves to Past tab with discontinued status

## Error Handling

All actions should:
- Show appropriate error messages if API calls fail
- Display toast notifications for both success and failure
- Handle network errors gracefully
- Refresh data after successful operations

## Notes

- All actions require appropriate permissions (doctor, nurse, or pharmacist roles)
- Some actions may require organization context
- Print and QR Code actions use organization branding
- Status changes (Completed/Discontinued) are permanent and move medications to Past tab

