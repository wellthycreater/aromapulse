-- Add region column to users table
ALTER TABLE users ADD COLUMN region TEXT;

-- Add index for region searches
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
