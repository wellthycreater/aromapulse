-- Simple sequential updates for existing production users

-- 1. Update B2B company users with company_size (6 users total)
UPDATE users 
SET company_size = 'under_20'
WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL
AND id = (SELECT MIN(id) FROM users WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL);

UPDATE users 
SET company_size = '20_to_50'
WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL
AND id IN (SELECT id FROM users WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL LIMIT 2);

UPDATE users 
SET company_size = '50_to_100'
WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL
AND id = (SELECT MIN(id) FROM users WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL);

UPDATE users 
SET company_size = 'over_100'
WHERE user_type = 'B2B' AND b2b_category = 'company' AND company_size IS NULL;

-- 2. Update B2C work_stress users with occupations (13 users)
UPDATE users SET occupation = 'office_it' 
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 3);

UPDATE users SET occupation = 'service_retail'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2);

UPDATE users SET occupation = 'medical_care'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2);

UPDATE users SET occupation = 'education'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2);

UPDATE users SET occupation = 'manufacturing_logistics'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 2);

UPDATE users SET occupation = 'freelancer'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 1);

UPDATE users SET occupation = 'finance'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'work_stress' AND occupation IS NULL ORDER BY id LIMIT 1);

-- 3. Update B2C daily_stress users with life_situations (9 users)
UPDATE users SET life_situation = 'student' 
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 2);

UPDATE users SET life_situation = 'parent'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 2);

UPDATE users SET life_situation = 'homemaker'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 2);

UPDATE users SET life_situation = 'job_seeker'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 1);

UPDATE users SET life_situation = 'retiree'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 1);

UPDATE users SET life_situation = 'caregiver'
WHERE id IN (SELECT id FROM users WHERE user_type = 'B2C' AND b2c_category = 'daily_stress' AND life_situation IS NULL ORDER BY id LIMIT 1);

-- 4. Add gender to all users if missing
UPDATE users
SET gender = CASE WHEN id % 2 = 0 THEN 'female' ELSE 'male' END
WHERE gender IS NULL;

-- 5. Add age_group to all users if missing
UPDATE users
SET age_group = CASE 
  WHEN id % 4 = 0 THEN '20s'
  WHEN id % 4 = 1 THEN '30s'
  WHEN id % 4 = 2 THEN '40s'
  ELSE '50s'
END
WHERE age_group IS NULL;

-- 6. Add region to all users if missing
UPDATE users
SET region = CASE 
  WHEN id % 5 = 0 THEN '서울'
  WHEN id % 5 = 1 THEN '경기'
  WHEN id % 5 = 2 THEN '부산'
  WHEN id % 5 = 3 THEN '대구'
  ELSE '인천'
END
WHERE region IS NULL;
