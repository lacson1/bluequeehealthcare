#!/usr/bin/env node

/**
 * Script to display Patient database schema and data
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, varchar, text, date, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Patient table schema (matching shared/schema.ts)
const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 10 }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  bloodType: varchar("blood_type", { length: 5 }),
  preferredLanguage: varchar("preferred_language", { length: 50 }).default('English'),
  interpreterNeeded: boolean("interpreter_needed").default(false),
  primaryCareProviderId: integer("primary_care_provider_id"),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  emergencyContactRelationship: varchar("emergency_contact_relationship", { length: 50 }),
  codeStatus: varchar("code_status", { length: 20 }).default('full'),
  nationalId: varchar("national_id", { length: 50 }),
  insuranceId: varchar("insurance_id", { length: 50 }),
  organizationId: integer('organization_id'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

async function showPatientsDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please set DATABASE_URL in your .env file');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    console.log('='.repeat(80));
    console.log('📋 PATIENT DATABASE SCHEMA');
    console.log('='.repeat(80));
    console.log(`
Table: patients

Columns:
  id                    SERIAL PRIMARY KEY
  title                 VARCHAR(10)          - Mr., Mrs., Ms., Dr., Prof., etc.
  first_name            TEXT NOT NULL        - Patient's first name
  last_name             TEXT NOT NULL        - Patient's last name
  date_of_birth         DATE NOT NULL        - Date of birth
  gender                TEXT NOT NULL        - Gender
  phone                 TEXT NOT NULL        - Phone number
  email                 TEXT                 - Email address
  address               TEXT                 - Physical address
  allergies             TEXT                 - Known allergies
  medical_history       TEXT                 - Medical history
  blood_type            VARCHAR(5)           - A+, A-, B+, B-, AB+, AB-, O+, O-
  preferred_language    VARCHAR(50)          - Preferred language (default: English)
  interpreter_needed   BOOLEAN              - Interpreter required (default: false)
  primary_care_provider_id INTEGER           - Reference to users.id (PCP)
  emergency_contact_name VARCHAR(100)        - Emergency contact name
  emergency_contact_phone VARCHAR(20)       - Emergency contact phone
  emergency_contact_relationship VARCHAR(50) - Relationship to patient
  code_status           VARCHAR(20)          - full, dnr, dni, dnr_dni, comfort (default: full)
  national_id           VARCHAR(50)          - National ID number
  insurance_id          VARCHAR(50)          - Insurance ID
  organization_id       INTEGER              - Reference to organizations.id
  created_at            TIMESTAMP            - Record creation timestamp
`);

    console.log('\n' + '='.repeat(80));
    console.log('📊 PATIENT DATA');
    console.log('='.repeat(80));

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM patients');
    const totalCount = countResult.rows[0].count;
    console.log(`\nTotal Patients: ${totalCount}\n`);

    if (totalCount > 0) {
      // Get all patients with limited fields for display
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
        LIMIT 50
      `);

      if (result.rows.length > 0) {
        console.log('Patient Records (showing first 50):\n');
        console.log('ID | Title | Name | DOB | Gender | Phone | Email | Org ID | Created');
        console.log('-'.repeat(100));

        result.rows.forEach(patient => {
          const name = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
          const dob = patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : 'N/A';
          const email = patient.email || 'N/A';
          const orgId = patient.organization_id || 'N/A';
          const created = patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A';
          
          console.log(
            `${String(patient.id).padEnd(3)} | ${String(patient.title || '').padEnd(5)} | ${name.padEnd(20)} | ${dob} | ${String(patient.gender || '').padEnd(6)} | ${String(patient.phone || '').padEnd(12)} | ${email.padEnd(20)} | ${String(orgId).padEnd(6)} | ${created}`
          );
        });

        if (totalCount > 50) {
          console.log(`\n... and ${totalCount - 50} more patients (showing first 50 only)`);
        }
      }

      // Get detailed info for a sample patient
      const sampleResult = await pool.query(`
        SELECT * FROM patients ORDER BY id LIMIT 1
      `);

      if (sampleResult.rows.length > 0) {
        const sample = sampleResult.rows[0];
        console.log('\n' + '='.repeat(80));
        console.log('📝 SAMPLE PATIENT RECORD (Full Details)');
        console.log('='.repeat(80));
        console.log(JSON.stringify(sample, null, 2));
      }

      // Statistics
      console.log('\n' + '='.repeat(80));
      console.log('📈 STATISTICS');
      console.log('='.repeat(80));

      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT organization_id) as organizations,
          COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male,
          COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female,
          COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
          COUNT(CASE WHEN allergies IS NOT NULL THEN 1 END) as with_allergies,
          COUNT(CASE WHEN primary_care_provider_id IS NOT NULL THEN 1 END) as with_pcp
        FROM patients
      `);

      const s = stats.rows[0];
      console.log(`Total Patients: ${s.total}`);
      console.log(`Organizations: ${s.organizations}`);
      console.log(`Male: ${s.male}`);
      console.log(`Female: ${s.female}`);
      console.log(`With Email: ${s.with_email}`);
      console.log(`With Allergies: ${s.with_allergies}`);
      console.log(`With Primary Care Provider: ${s.with_pcp}`);
    } else {
      console.log('No patients found in the database.');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Database query completed');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

showPatientsDatabase();

