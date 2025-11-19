-- Add missing fields to users table for admin dashboard
-- Note: Using CREATE TABLE + INSERT to handle potential duplicate columns

-- Backup existing users table
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Drop old users table
DROP TABLE IF EXISTS users;

-- Recreate users table with all fields
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  
  -- User type
  user_type TEXT NOT NULL CHECK(user_type IN ('B2C', 'B2B')),
  
  -- B2C details
  b2c_category TEXT CHECK(b2c_category IN ('daily_stress', 'work_stress', NULL)),
  b2c_subcategory TEXT,
  
  -- B2B details
  b2b_category TEXT CHECK(b2b_category IN ('perfumer', 'company', 'shop', 'independent', NULL)),
  b2b_business_name TEXT,
  b2b_business_number TEXT,
  b2b_address TEXT,
  
  -- OAuth info
  oauth_provider TEXT CHECK(oauth_provider IN ('naver', 'kakao', 'google', 'email', NULL)),
  oauth_id TEXT,
  
  -- NEW: Role field
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  
  -- NEW: Gender field
  gender TEXT CHECK(gender IN ('male', 'female', 'other', NULL)),
  
  -- NEW: Age group field
  age_group TEXT CHECK(age_group IN ('10s', '20s', '30s', '40s', '50s', '60s+', NULL)),
  
  -- NEW: Region field
  region TEXT,
  
  -- NEW: Address field (general)
  address TEXT,
  
  -- NEW: Occupation (for work_stress users)
  occupation TEXT,
  
  -- NEW: Life situation (for daily_stress users)
  life_situation TEXT,
  
  -- Meta info
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active INTEGER DEFAULT 1,
  
  UNIQUE(oauth_provider, oauth_id)
);

-- Restore data from backup
INSERT INTO users (
  id, email, password_hash, name, phone, user_type,
  b2c_category, b2c_subcategory,
  b2b_category, b2b_business_name, b2b_business_number, b2b_address,
  oauth_provider, oauth_id,
  created_at, updated_at, last_login_at, is_active
)
SELECT 
  id, email, password_hash, name, phone, user_type,
  b2c_category, b2c_subcategory,
  b2b_category, b2b_business_name, b2b_business_number, b2b_address,
  oauth_provider, oauth_id,
  created_at, updated_at, last_login_at, is_active
FROM users_backup;

-- Drop backup table
DROP TABLE users_backup;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
