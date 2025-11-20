-- Migration: Add parent consent fields for minors
-- Created: 2024-11-20
-- Description: Add fields to store parent/guardian information for minor users (under 14)

-- Add parent consent columns to users table
ALTER TABLE users ADD COLUMN parent_name TEXT;
ALTER TABLE users ADD COLUMN parent_phone TEXT;
ALTER TABLE users ADD COLUMN parent_email TEXT;
ALTER TABLE users ADD COLUMN parent_consent_date DATETIME;
ALTER TABLE users ADD COLUMN is_minor BOOLEAN DEFAULT 0;

-- Create index for quick lookup of minor users
CREATE INDEX IF NOT EXISTS idx_users_is_minor ON users(is_minor);

-- Create index for parent phone lookup
CREATE INDEX IF NOT EXISTS idx_users_parent_phone ON users(parent_phone);
