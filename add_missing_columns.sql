-- Add missing B2B columns to production users table

-- Add company_size column
ALTER TABLE users ADD COLUMN company_size TEXT CHECK(company_size IN ('under_20', '20_to_50', '50_to_100', 'over_100', NULL));

-- Add department column
ALTER TABLE users ADD COLUMN department TEXT;

-- Add position column
ALTER TABLE users ADD COLUMN position TEXT;

-- Add b2c_subcategory if missing
ALTER TABLE users ADD COLUMN b2c_subcategory TEXT;

-- Add occupation column
ALTER TABLE users ADD COLUMN occupation TEXT;

-- Add life_situation column
ALTER TABLE users ADD COLUMN life_situation TEXT;
