import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function createTelemedicineTable() {
  try {
    console.log('Creating telemedicine_sessions table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS telemedicine_sessions (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_time TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        type VARCHAR(20) NOT NULL DEFAULT 'video',
        session_url VARCHAR(500),
        notes TEXT,
        duration INTEGER,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);

    console.log('Adding appointment_id column if it doesn\'t exist...');
    
    await db.execute(sql`
      ALTER TABLE telemedicine_sessions 
      ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL;
    `);

    console.log('Creating indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_patient_id ON telemedicine_sessions(patient_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_doctor_id ON telemedicine_sessions(doctor_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_appointment_id ON telemedicine_sessions(appointment_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_organization_id ON telemedicine_sessions(organization_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_status ON telemedicine_sessions(status);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_scheduled_time ON telemedicine_sessions(scheduled_time);
    `);

    console.log('✅ Telemedicine sessions table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTelemedicineTable();

