#!/usr/bin/env node

/**
 * Script to remove patients from the database
 * 
 * Usage:
 *   node remove-patients.js <patient-id>              - Delete single patient
 *   node remove-patients.js <id1> <id2> <id3>         - Delete multiple patients
 *   node remove-patients.js --list                    - List all patients
 *   node remove-patients.js --dry-run <id>            - Preview what would be deleted
 *   node remove-patients.js --cascade <id>            - Delete patient and all related records
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });

// Related tables that reference patients
const RELATED_TABLES = [
  'visits',
  'lab_results',
  'prescriptions',
  'patient_referrals',
  'comments',
  'consultation_records',
  'appointments',
  'pharmacy_activities',
  'medication_reviews',
  'medication_review_assignments',
  'vaccinations',
  'patient_allergies',
  'patient_medical_history',
  'discharge_letters',
  'messages',
  'lab_orders',
  'medical_documents',
  'patient_procedures',
  'patient_consents',
  'patient_insurance',
  'safety_alerts',
  'invoices',
  'payments',
  'insurance_claims',
  'telemedicine_sessions',
  'ai_consultations',
  'vital_signs',
  'patient_imaging'
];

async function getRelatedRecordsCount(patientIds) {
  const counts = {};
  
  for (const table of RELATED_TABLES) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM ${table} WHERE patient_id = ANY($1::int[])`,
        [patientIds]
      );
      counts[table] = parseInt(result.rows[0].count);
    } catch (error) {
      // Table might not exist or have different column name
      counts[table] = 0;
    }
  }
  
  return counts;
}

async function listPatients() {
  const result = await pool.query(`
    SELECT 
      id,
      title,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      organization_id,
      created_at
    FROM patients 
    ORDER BY id
  `);
  
  if (result.rows.length === 0) {
    console.log('No patients found.');
    return;
  }
  
  console.log('\n📋 All Patients:\n');
  console.log('ID | Name | DOB | Gender | Phone | Email | Org ID | Created');
  console.log('-'.repeat(100));
  
  result.rows.forEach(patient => {
    const name = `${patient.title || ''} ${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const dob = patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : 'N/A';
    const email = patient.email || 'N/A';
    const orgId = patient.organization_id || 'N/A';
    const created = patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A';
    
    console.log(
      `${String(patient.id).padEnd(3)} | ${name.padEnd(25)} | ${dob} | ${String(patient.gender || '').padEnd(6)} | ${String(patient.phone || '').padEnd(12)} | ${email.padEnd(20)} | ${String(orgId).padEnd(6)} | ${created}`
    );
  });
  
  console.log(`\nTotal: ${result.rows.length} patients\n`);
}

async function previewDeletion(patientIds) {
  console.log('\n🔍 Preview: What will be deleted\n');
  console.log('='.repeat(80));
  
  // Get patient info
  const patientResult = await pool.query(
    `SELECT id, first_name, last_name, title FROM patients WHERE id = ANY($1::int[])`,
    [patientIds]
  );
  
  if (patientResult.rows.length === 0) {
    console.log('❌ No patients found with the provided IDs');
    return false;
  }
  
  console.log('\n📋 Patients to be deleted:');
  patientResult.rows.forEach(p => {
    const name = `${p.title || ''} ${p.first_name || ''} ${p.last_name || ''}`.trim();
    console.log(`   - ID ${p.id}: ${name}`);
  });
  
  // Get related records count
  const counts = await getRelatedRecordsCount(patientIds);
  
  console.log('\n📊 Related records that will be affected:');
  let totalRelated = 0;
  const hasRecords = [];
  
  for (const [table, count] of Object.entries(counts)) {
    if (count > 0) {
      console.log(`   - ${table}: ${count} record(s)`);
      totalRelated += count;
      hasRecords.push({ table, count });
    }
  }
  
  if (totalRelated === 0) {
    console.log('   (No related records found)');
  } else {
    console.log(`\n⚠️  Total related records: ${totalRelated}`);
    console.log('\n⚠️  WARNING: Deleting these patients will also delete all related records!');
  }
  
  console.log('\n' + '='.repeat(80));
  return true;
}

async function deletePatients(patientIds, cascade = false) {
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    if (cascade) {
      // Delete related records first
      console.log('\n🗑️  Deleting related records...');
      
      for (const table of RELATED_TABLES) {
        try {
          const result = await pool.query(
            `DELETE FROM ${table} WHERE patient_id = ANY($1::int[])`,
            [patientIds]
          );
          if (result.rowCount > 0) {
            console.log(`   ✓ Deleted ${result.rowCount} record(s) from ${table}`);
          }
        } catch (error) {
          // Table might not exist or have different structure
          // Continue with other tables
        }
      }
    } else {
      // Check if there are related records
      const counts = await getRelatedRecordsCount(patientIds);
      const totalRelated = Object.values(counts).reduce((sum, count) => sum + count, 0);
      
      if (totalRelated > 0) {
        console.log('\n❌ Cannot delete patients with related records!');
        console.log('   Use --cascade flag to delete patient and all related records.');
        console.log('   Or use --dry-run to preview what will be deleted.');
        await pool.query('ROLLBACK');
        return false;
      }
    }
    
    // Delete patients
    console.log('\n🗑️  Deleting patients...');
    const result = await pool.query(
      `DELETE FROM patients WHERE id = ANY($1::int[])`,
      [patientIds]
    );
    
    await pool.query('COMMIT');
    
    console.log(`\n✅ Successfully deleted ${result.rowCount} patient(s)`);
    return true;
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('\n❌ Error deleting patients:', error.message);
    throw error;
  }
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage:
  node remove-patients.js <patient-id>              - Delete single patient
  node remove-patients.js <id1> <id2> <id3>         - Delete multiple patients
  node remove-patients.js --list                   - List all patients
  node remove-patients.js --dry-run <id>           - Preview what would be deleted
  node remove-patients.js --cascade <id>            - Delete patient and all related records
  node remove-patients.js --cascade <id1> <id2>     - Delete multiple patients with cascade
    `);
    process.exit(0);
  }
  
  if (args[0] === '--list') {
    await listPatients();
    await pool.end();
    return;
  }
  
  const isDryRun = args[0] === '--dry-run';
  const isCascade = args[0] === '--cascade';
  
  const patientIds = (isDryRun || isCascade ? args.slice(1) : args)
    .map(id => parseInt(id))
    .filter(id => !isNaN(id));
  
  if (patientIds.length === 0) {
    console.error('❌ Please provide valid patient ID(s)');
    process.exit(1);
  }
  
  if (isDryRun) {
    await previewDeletion(patientIds);
    await pool.end();
    return;
  }
  
  // Preview first
  const hasPatients = await previewDeletion(patientIds);
  if (!hasPatients) {
    await pool.end();
    process.exit(1);
  }
  
  // Ask for confirmation
  console.log('\n⚠️  This action cannot be undone!');
  const confirmed = await askConfirmation('Are you sure you want to delete these patients? (yes/no): ');
  
  if (!confirmed) {
    console.log('\n❌ Deletion cancelled.');
    await pool.end();
    return;
  }
  
  // Delete
  try {
    await deletePatients(patientIds, isCascade);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);

