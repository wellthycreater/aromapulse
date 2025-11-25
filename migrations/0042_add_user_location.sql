-- Migration: Add user location columns
-- Description: Add user_latitude and user_longitude columns to users table for nearby workshop filtering

ALTER TABLE users ADD COLUMN user_latitude REAL;
ALTER TABLE users ADD COLUMN user_longitude REAL;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users(user_latitude, user_longitude);
