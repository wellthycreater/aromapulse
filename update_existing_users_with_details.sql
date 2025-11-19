-- Update existing B2B company users with company_size
-- These are the 6 B2B company users we need to update

-- Get the first 6 B2B company user IDs and update them
UPDATE users 
SET company_size = 'under_20'
WHERE id IN (
  SELECT id FROM users 
  WHERE user_type = 'B2B' AND b2b_category = 'company' 
  LIMIT 1
);

UPDATE users 
SET company_size = '20_to_50'
WHERE id IN (
  SELECT id FROM users 
  WHERE user_type = 'B2C' AND b2b_category = 'company' 
  AND company_size IS NULL
  LIMIT 2
);

UPDATE users 
SET company_size = '50_to_100'
WHERE id IN (
  SELECT id FROM users 
  WHERE user_type = 'B2B' AND b2b_category = 'company' 
  AND company_size IS NULL
  LIMIT 1
);

UPDATE users 
SET company_size = 'over_100'
WHERE id IN (
  SELECT id FROM users 
  WHERE user_type = 'B2B' AND b2b_category = 'company' 
  AND company_size IS NULL
  LIMIT 2
);

-- Update B2C work_stress users with occupations
WITH work_stress_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM users 
  WHERE user_type = 'B2C' AND b2c_category = 'work_stress'
)
UPDATE users
SET occupation = CASE 
  WHEN id IN (SELECT id FROM work_stress_users WHERE rn <= 3) THEN 'office_it'
  WHEN id IN (SELECT id FROM work_stress_users WHERE rn BETWEEN 4 AND 5) THEN 'service_retail'
  WHEN id IN (SELECT id FROM work_stress_users WHERE rn BETWEEN 6 AND 7) THEN 'medical_care'
  WHEN id IN (SELECT id FROM work_stress_users WHERE rn BETWEEN 8 AND 9) THEN 'education'
  WHEN id IN (SELECT id FROM work_stress_users WHERE rn BETWEEN 10 AND 11) THEN 'manufacturing_logistics'
  WHEN id IN (SELECT id FROM work_stress_users WHERE rn = 12) THEN 'freelancer'
  WHEN id IN (SELECT id FROM work_stress_users WHERE rn = 13) THEN 'finance'
  ELSE occupation
END
WHERE user_type = 'B2C' AND b2c_category = 'work_stress';

-- Update B2C daily_stress users with life_situations
WITH daily_stress_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM users 
  WHERE user_type = 'B2C' AND b2c_category = 'daily_stress'
)
UPDATE users
SET life_situation = CASE 
  WHEN id IN (SELECT id FROM daily_stress_users WHERE rn <= 2) THEN 'student'
  WHEN id IN (SELECT id FROM daily_stress_users WHERE rn BETWEEN 3 AND 4) THEN 'parent'
  WHEN id IN (SELECT id FROM daily_stress_users WHERE rn BETWEEN 5 AND 6) THEN 'homemaker'
  WHEN id IN (SELECT id FROM daily_stress_users WHERE rn = 7) THEN 'job_seeker'
  WHEN id IN (SELECT id FROM daily_stress_users WHERE rn = 8) THEN 'retiree'
  WHEN id IN (SELECT id FROM daily_stress_users WHERE rn = 9) THEN 'caregiver'
  ELSE life_situation
END
WHERE user_type = 'B2C' AND b2c_category = 'daily_stress';

-- Add other demographic data to all users
UPDATE users
SET 
  gender = CASE 
    WHEN id % 2 = 0 THEN 'female'
    ELSE 'male'
  END,
  age_group = CASE 
    WHEN id % 4 = 0 THEN '20s'
    WHEN id % 4 = 1 THEN '30s'
    WHEN id % 4 = 2 THEN '40s'
    ELSE '50s'
  END,
  region = CASE 
    WHEN id % 5 = 0 THEN '서울'
    WHEN id % 5 = 1 THEN '경기'
    WHEN id % 5 = 2 THEN '부산'
    WHEN id % 5 = 3 THEN '대구'
    ELSE '인천'
  END
WHERE gender IS NULL OR age_group IS NULL OR region IS NULL;
