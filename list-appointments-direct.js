#!/usr/bin/env node

// Direct database query to list appointments
import { db } from './server/db.js';
import { appointments, patients, users } from './shared/schema.js';
import { eq, asc } from 'drizzle-orm';

async function main() {
  try {
    console.log('📋 Fetching appointments directly from database...\n');
    
    const allAppointments = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        doctorId: appointments.doctorId,
        doctorName: users.username,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        notes: appointments.notes,
        priority: appointments.priority,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .orderBy(asc(appointments.appointmentDate));
    
    console.log(`✅ Found ${allAppointments.length} appointment(s):\n`);
    console.log('='.repeat(80));
    
    if (allAppointments.length === 0) {
      console.log('   No appointments found in the database.');
    } else {
      allAppointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. Appointment #${apt.id}`);
        console.log(`   Patient: ${apt.patientName || ''} ${apt.patientLastName || ''}`.trim() || `Patient #${apt.patientId}`);
        console.log(`   Doctor: ${apt.doctorName || 'Unknown Doctor'}`);
        console.log(`   Date: ${apt.appointmentDate || 'N/A'}`);
        console.log(`   Time: ${apt.appointmentTime || 'N/A'}`);
        console.log(`   Duration: ${apt.duration || 30} minutes`);
        console.log(`   Type: ${apt.type || 'consultation'}`);
        console.log(`   Status: ${apt.status || 'scheduled'}`);
        console.log(`   Priority: ${apt.priority || 'medium'}`);
        if (apt.notes) {
          console.log(`   Notes: ${apt.notes}`);
        }
        console.log('-'.repeat(80));
      });
    }
    
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
  process.exit(0);
}

main();

