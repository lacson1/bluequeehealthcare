-- Migration: Create user_sessions table for PostgreSQL session store
-- This table is used by connect-pg-simple for session persistence

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
);

-- Create index for session expiration cleanup
CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");

-- Grant permissions (adjust user if needed)
-- GRANT ALL PRIVILEGES ON TABLE user_sessions TO clinicuser;

