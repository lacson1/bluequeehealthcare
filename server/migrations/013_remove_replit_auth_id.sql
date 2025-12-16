-- Migration: Remove legacy replitAuthId column from users table
-- This field is no longer needed as Replit integration has been removed

-- Drop the unique constraint first (if it exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_replit_auth_id_unique;

-- Drop the column
ALTER TABLE users DROP COLUMN IF EXISTS replit_auth_id;

