#!/usr/bin/env tsx
/**
 * Seed Permissions Script
 * Populates the permissions table with all available permissions
 */

import { db } from '../server/db';
import { permissions, roles, rolePermissions } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

const PERMISSIONS_DATA = [
  // Patient Data
  { name: 'viewPatients', description: 'View patient data' },
  { name: 'editPatients', description: 'Edit patient data' },
  { name: 'createPatients', description: 'Create new patient profiles' },

  // Visits & Consultations
  { name: 'createVisit', description: 'Create patient visits' },
  { name: 'viewVisits', description: 'View visit records' },
  { name: 'editVisits', description: 'Edit visit records' },

  // Lab Orders & Results
  { name: 'createLabOrder', description: 'Create lab orders' },
  { name: 'viewLabResults', description: 'View lab results' },
  { name: 'editLabResults', description: 'Update lab results' },

  // Consultations & Forms
  { name: 'createConsultation', description: 'Create specialist consultations' },
  { name: 'viewConsultation', description: 'View consultation records' },
  { name: 'createConsultationForm', description: 'Create consultation form templates' },

  // Medications & Prescriptions
  { name: 'viewMedications', description: 'View prescribed medications' },
  { name: 'manageMedications', description: 'Manage and dispense medications' },
  { name: 'createPrescription', description: 'Create prescriptions' },
  { name: 'viewPrescriptions', description: 'View prescription records' },

  // Referrals
  { name: 'createReferral', description: 'Create patient referrals' },
  { name: 'viewReferrals', description: 'View referral records' },
  { name: 'manageReferrals', description: 'Accept/reject referrals' },

  // Staff & Users
  { name: 'manageUsers', description: 'Manage staff and user roles' },
  { name: 'viewUsers', description: 'View staff information' },

  // Organizations
  { name: 'manageOrganizations', description: 'Manage organization settings' },
  { name: 'viewOrganizations', description: 'View organization information' },

  // File Management
  { name: 'uploadFiles', description: 'Upload files and documents' },
  { name: 'viewFiles', description: 'View and download files' },
  { name: 'deleteFiles', description: 'Delete files' },

  // Dashboard & Analytics
  { name: 'viewDashboard', description: 'Access the dashboard' },
  { name: 'viewReports', description: 'View analytics and performance reports' },
  { name: 'viewAuditLogs', description: 'View system audit logs' },

  // Appointments
  { name: 'viewAppointments', description: 'View appointment schedules' },
  { name: 'createAppointments', description: 'Create and schedule appointments' },
  { name: 'editAppointments', description: 'Modify existing appointments' },
  { name: 'cancelAppointments', description: 'Cancel appointments' },

  // Billing
  { name: 'viewBilling', description: 'View invoices and billing information' },
  { name: 'createInvoice', description: 'Create invoices for patients' },
  { name: 'processPayment', description: 'Process and record payments' },
];

async function seedPermissions() {
  console.log('🌱 Seeding permissions...\n');

  try {
    // Check if permissions already exist
    const existingPermissions = await db.select().from(permissions).limit(1);
    
    if (existingPermissions.length > 0) {
      console.log('⚠️  Permissions already exist in the database.');
      console.log('   Skipping seed to avoid duplicates.\n');
      console.log('   If you want to re-seed, delete existing permissions first.');
      return;
    }

    // Insert permissions
    console.log(`📝 Inserting ${PERMISSIONS_DATA.length} permissions...`);
    await db.insert(permissions).values(PERMISSIONS_DATA);
    
    console.log('✅ Successfully seeded permissions!\n');
    
    // Display summary
    const permissionCount = await db.select({ count: sql<number>`COUNT(*)` }).from(permissions);
    console.log(`📊 Total permissions in database: ${permissionCount[0].count}\n`);
    
    console.log('💡 Next steps:');
    console.log('   1. Refresh the role-permissions page in your browser');
    console.log('   2. Select a role (e.g., "Doctor")');
    console.log('   3. Expand permission categories to see checkboxes');
    console.log('   4. Use checkboxes to grant/revoke permissions\n');

  } catch (error: any) {
    console.error('❌ Error seeding permissions:', error.message);
    process.exit(1);
  }
}

// Run the seed
seedPermissions()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

