#!/usr/bin/env tsx
/**
 * Script to add a patient to the database
 * Usage: tsx scripts/add-patient.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { patients, organizations } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface PatientData {
  title?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD format
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  medicalHistory?: string;
  bloodType?: string;
  preferredLanguage?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  nationalId?: string;
  insuranceId?: string;
  organizationId?: number;
}

async function addPatient(patientData: PatientData) {
  try {
    console.log('Connecting to database...');
    
    // If organizationId not provided, try to find or create a default organization
    let organizationId = patientData.organizationId;
    
    if (!organizationId) {
      console.log('No organization ID provided, looking for default organization...');
      const orgs = await db.select().from(organizations).limit(1);
      
      if (orgs.length > 0) {
        organizationId = orgs[0].id;
        console.log(`Using organization: ${orgs[0].name} (ID: ${organizationId})`);
      } else {
        console.log('No organizations found. Creating default organization...');
        // Create a default organization
        const [newOrg] = await db.insert(organizations).values({
          name: 'Demo Clinic',
          type: 'clinic',
          address: '123 Main Street',
          phone: '+1234567890',
          email: 'info@demo-clinic.com',
        }).returning();
        
        organizationId = newOrg.id;
        console.log(`Created default organization: ${newOrg.name} (ID: ${organizationId})`);
      }
    }

    // Prepare patient data
    const insertData = {
      title: patientData.title,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dateOfBirth: patientData.dateOfBirth,
      gender: patientData.gender,
      phone: patientData.phone,
      email: patientData.email || null,
      address: patientData.address || null,
      allergies: patientData.allergies || null,
      medicalHistory: patientData.medicalHistory || null,
      bloodType: patientData.bloodType || null,
      preferredLanguage: patientData.preferredLanguage || 'English',
      emergencyContactName: patientData.emergencyContactName || null,
      emergencyContactPhone: patientData.emergencyContactPhone || null,
      emergencyContactRelationship: patientData.emergencyContactRelationship || null,
      nationalId: patientData.nationalId || null,
      insuranceId: patientData.insuranceId || null,
      organizationId: organizationId,
    };

    console.log('Adding patient to database...');
    console.log('Patient data:', {
      name: `${insertData.firstName} ${insertData.lastName}`,
      dob: insertData.dateOfBirth,
      gender: insertData.gender,
      phone: insertData.phone,
      organizationId: insertData.organizationId,
    });

    // Check if patient with same phone already exists
    const existing = await db
      .select()
      .from(patients)
      .where(eq(patients.phone, insertData.phone))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⚠️  Patient with phone ${insertData.phone} already exists (ID: ${existing[0].id})`);
      return existing[0];
    }

    // Insert patient
    const [patient] = await db
      .insert(patients)
      .values(insertData)
      .returning();

    console.log('✅ Patient added successfully!');
    console.log('Patient ID:', patient.id);
    console.log('Full name:', `${patient.firstName} ${patient.lastName}`);
    console.log('Phone:', patient.phone);
    console.log('Date of Birth:', patient.dateOfBirth);
    console.log('Gender:', patient.gender);
    console.log('Organization ID:', patient.organizationId);

    return patient;
  } catch (error: any) {
    console.error('❌ Error adding patient:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

// Example patient data - modify as needed
const examplePatient: PatientData = {
  title: 'Mr.',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-15',
  gender: 'Male',
  phone: '+1234567890',
  email: 'john.doe@example.com',
  address: '123 Main Street, City, State 12345',
  allergies: 'Penicillin, Peanuts',
  medicalHistory: 'Hypertension, Type 2 Diabetes',
  bloodType: 'O+',
  preferredLanguage: 'English',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '+1234567891',
  emergencyContactRelationship: 'Spouse',
  nationalId: '123-45-6789',
  insuranceId: 'INS-123456',
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  addPatient(examplePatient)
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { addPatient };

