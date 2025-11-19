-- Fix B2B category structure and add company-specific fields
-- B2B categories should be: independent (소규모 자영업자), wholesale (대량 납품), company (기업 복지)

-- Backup existing users table
CREATE TABLE IF NOT EXISTS users_backup_v2 AS SELECT * FROM users;

-- Drop old users table
DROP TABLE IF EXISTS users;

-- Recreate users table with corrected B2B structure
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
  
  -- B2B details (CORRECTED)
  b2b_category TEXT CHECK(b2b_category IN ('independent', 'wholesale', 'company', NULL)),
  b2b_business_name TEXT,
  b2b_business_number TEXT,
  b2b_address TEXT,
  
  -- B2B Company-specific fields (for company category)
  company_size TEXT CHECK(company_size IN ('under_20', '20_to_50', '50_to_100', 'over_100', NULL)),
  department TEXT, -- HR, 복지팀, 총무팀 등
  position TEXT, -- 직책
  
  -- OAuth info
  oauth_provider TEXT CHECK(oauth_provider IN ('naver', 'kakao', 'google', 'email', NULL)),
  oauth_id TEXT,
  
  -- Role field
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'provider')),
  
  -- Demographics
  gender TEXT CHECK(gender IN ('male', 'female', 'other', NULL)),
  age_group TEXT CHECK(age_group IN ('10s', '20s', '30s', '40s', '50s', '60s+', NULL)),
  region TEXT,
  address TEXT,
  
  -- B2C-specific fields
  occupation TEXT, -- for work_stress users
  life_situation TEXT, -- for daily_stress users
  
  -- Meta info
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active INTEGER DEFAULT 1,
  
  UNIQUE(oauth_provider, oauth_id)
);

-- Restore data from backup (with b2b_category migration)
INSERT INTO users (
  id, email, password_hash, name, phone, user_type,
  b2c_category, b2c_subcategory,
  b2b_category, b2b_business_name, b2b_business_number, b2b_address,
  oauth_provider, oauth_id, role,
  gender, age_group, region, address,
  occupation, life_situation,
  created_at, updated_at, last_login_at, is_active
)
SELECT 
  id, email, password_hash, name, phone, user_type,
  b2c_category, b2c_subcategory,
  -- Migrate old b2b_category values to new structure
  CASE 
    WHEN b2b_category = 'perfumer' THEN 'independent'
    WHEN b2b_category = 'shop' THEN 'independent'
    WHEN b2b_category = 'company' THEN 'company'
    ELSE b2b_category
  END as b2b_category,
  b2b_business_name, b2b_business_number, b2b_address,
  oauth_provider, oauth_id, role,
  gender, age_group, region, address,
  occupation, life_situation,
  created_at, updated_at, last_login_at, is_active
FROM users_backup_v2;

-- Drop backup table
DROP TABLE users_backup_v2;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_b2b_category ON users(b2b_category);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_users_company_size ON users(company_size);
