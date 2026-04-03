-- Migration to add Google OAuth fields to users table
-- Run this in PostgreSQL to update the schema

-- Add google_id column (unique)
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Add apple_id column (unique)
ALTER TABLE users ADD COLUMN apple_id VARCHAR(255) UNIQUE;

-- Add avatar column
ALTER TABLE users ADD COLUMN avatar TEXT;

-- Add password reset columns
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;

-- Ensure email is unique (if not already)
-- First check if constraint exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- Optional: Make password_hash nullable for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;