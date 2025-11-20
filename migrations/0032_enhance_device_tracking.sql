-- Migration: Enhance device tracking for better analytics
-- Date: 2025-01-19
-- Purpose: Add detailed device and OS information to users table

-- Check if device_type column exists, if not add it
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll use a different approach

-- Add device fields (will fail silently if already exists)
-- We'll handle this with try-catch in the application layer

-- Try to add device_type column
-- ALTER TABLE users ADD COLUMN device_type TEXT; -- May already exist

-- Add new device OS and browser fields to users table
ALTER TABLE users ADD COLUMN device_os TEXT; -- 'Android', 'iOS', 'Windows', 'macOS', 'Linux', 'Unknown'
ALTER TABLE users ADD COLUMN device_browser TEXT; -- 'Chrome', 'Safari', 'Firefox', 'Edge', etc.

-- Create indexes for faster device analytics queries
CREATE INDEX IF NOT EXISTS idx_users_device_os ON users(device_os);
CREATE INDEX IF NOT EXISTS idx_users_device_browser ON users(device_browser);

-- Update existing NULL values
UPDATE users SET device_os = 'Unknown' WHERE device_os IS NULL;
UPDATE users SET device_browser = 'Unknown' WHERE device_browser IS NULL;
