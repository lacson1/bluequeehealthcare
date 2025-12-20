-- Migration: Create telemedicine_sessions table
-- Date: 2024-01-20
-- Description: Creates the telemedicine_sessions table if it doesn't exist

CREATE TABLE IF NOT EXISTS telemedicine_sessions (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_patient_id ON telemedicine_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_doctor_id ON telemedicine_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_appointment_id ON telemedicine_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_organization_id ON telemedicine_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_status ON telemedicine_sessions(status);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_scheduled_time ON telemedicine_sessions(scheduled_time);

-- Add comments
COMMENT ON TABLE telemedicine_sessions IS 'Stores telemedicine consultation sessions';
COMMENT ON COLUMN telemedicine_sessions.appointment_id IS 'Optional reference to the appointment this telemedicine session is associated with';

