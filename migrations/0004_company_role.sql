-- Add company role field for B2B users
-- This allows restricting workshop access to HR/welfare/culture team members

-- Add company_role column to users table
ALTER TABLE users ADD COLUMN company_role TEXT CHECK(company_role IN ('hr_manager', 'culture_team', 'welfare_manager', 'general_employee', NULL));

-- Add company_size column to users table (for workshop eligibility)
ALTER TABLE users ADD COLUMN company_size TEXT CHECK(company_size IN ('under_20', '20_50', '50_100', '100_300', '300_plus', NULL));

-- Add department column to users table
ALTER TABLE users ADD COLUMN department TEXT;

-- Create index for company_role queries
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_role);

-- Update existing test user to have HR manager role
UPDATE users 
SET company_role = 'hr_manager', 
    company_size = '20_50',
    department = 'HR팀'
WHERE email = 'b2b@test.com';

-- Add comments for clarity
-- company_role options:
--   'hr_manager': HR팀 담당자
--   'culture_team': 조직문화팀 담당자
--   'welfare_manager': 복리후생 담당자
--   'general_employee': 일반 직원 (워크샵 접근 불가)
--   NULL: 역할 미지정

-- company_size options:
--   'under_20': 20인 미만 (워크샵 부적합)
--   '20_50': 20-50인 (워크샵 적합)
--   '50_100': 50-100인 (워크샵 적합)
--   '100_300': 100-300인 (워크샵 적합)
--   '300_plus': 300인 이상 (대규모 워크샵 가능)
