import 'dotenv/config';
import { db } from './server/db';
import { appointments, patients, users } from './shared/schema';
import { eq, asc, sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('📋 Checking appointments in database...\n');
    
    // First, check if there are any appointments at all
    const appointmentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments);
    
    console.log(`Total appointments in database: ${appointmentCount[0]?.count || 0}\n`);
    
    if (appointmentCount[0]?.count === 0) {
      console.log('❌ No appointments found in the database.');
      console.log('   Try booking a new appointment through the UI.');
      process.exit(0);
    }
    
    // Get all appointments with basic info
    const allAppointments = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        duration: appointments.duration,
        type: appointments.type,
        status: appointments.status,
        organizationId: appointments.organizationId,
        notes: appointments.notes,
        priority: appointments.priority,
      })
      .from(appointments)
      .orderBy(asc(appointments.appointmentDate));
    
    console.log(`✅ Found ${allAppointments.length} appointment(s):\n`);
    console.log('='.repeat(80));
    
    // Get patient and doctor names separately
    for (const apt of allAppointments) {
      const [patient] = await db
        .select({
          firstName: patients.firstName,
          lastName: patients.lastName,
        })
        .from(patients)
        .where(eq(patients.id, apt.patientId))
        .limit(1);
      
      const [doctor] = await db
        .select({
          username: users.username,
        })
        .from(users)
        .where(eq(users.id, apt.doctorId))
        .limit(1);
      
      console.log(`\n📅 Appointment #${apt.id}`);
      console.log(`   Patient: ${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || `Patient #${apt.patientId}`);
      console.log(`   Doctor: ${doctor?.username || 'Unknown Doctor'}`);
      console.log(`   Date: ${apt.appointmentDate || 'N/A'}`);
      console.log(`   Time: ${apt.appointmentTime || 'N/A'}`);
      console.log(`   Duration: ${apt.duration || 30} minutes`);
      console.log(`   Type: ${apt.type || 'consultation'}`);
      console.log(`   Status: ${apt.status || 'scheduled'}`);
      console.log(`   Priority: ${apt.priority || 'medium'}`);
      console.log(`   Organization ID: ${apt.organizationId || 'N/A'}`);
      if (apt.notes) {
        console.log(`   Notes: ${apt.notes}`);
      }
      console.log('-'.repeat(80));
    }
    
    console.log('\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
  process.exit(0);
}

main();

