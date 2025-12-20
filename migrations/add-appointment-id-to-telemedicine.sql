-- Migration: Add appointment_id to telemedicine_sessions table
-- Date: 2024-01-15
-- Description: Links telemedicine sessions to appointments for better workflow integration

-- Add appointment_id column (nullable, as sessions can be created without appointments)
ALTER TABLE telemedicine_sessions 
ADD COLUMN IF NOT EXISTS appointment_id INTEGER;

-- Add foreign key constraint
ALTER TABLE telemedicine_sessions
ADD CONSTRAINT fk_telemedicine_sessions_appointment 
FOREIGN KEY (appointment_id) 
REFERENCES appointments(id) 
ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_appointment_id 
ON telemedicine_sessions(appointment_id);

-- Add comment
COMMENT ON COLUMN telemedicine_sessions.appointment_id IS 'Optional reference to the appointment this telemedicine session is associated with';

