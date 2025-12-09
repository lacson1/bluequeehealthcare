-- Migration: Create sessions table for PostgreSQL session store
-- This table is used by connect-pg-simple for session persistence
-- Note: This matches the Drizzle schema definition in shared/schema.ts

CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- Create index for session expiration cleanup (matches Drizzle schema)
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Grant permissions (adjust user if needed)
-- GRANT ALL PRIVILEGES ON TABLE sessions TO clinicuser;

