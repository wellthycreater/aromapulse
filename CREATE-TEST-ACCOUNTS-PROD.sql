-- B2C 테스트 계정
-- 이메일: b2c@test.com
-- 비밀번호: test1234
INSERT INTO users (
  email, 
  password_hash, 
  name, 
  phone,
  user_type,
  b2c_category,
  oauth_provider,
  created_at,
  is_active
) VALUES (
  'b2c@test.com',
  '$2a$10$YourHashedPasswordHere',  -- 실제로는 bcrypt 해시 필요
  'B2C 테스트',
  '010-1234-5678',
  'B2C',
  'daily_stress',
  'email',
  CURRENT_TIMESTAMP,
  1
);

-- B2B 테스트 계정
-- 이메일: b2b@test.com
-- 비밀번호: test1234
INSERT INTO users (
  email,
  password_hash,
  name,
  phone,
  user_type,
  b2b_category,
  b2b_business_name,
  oauth_provider,
  created_at,
  is_active
) VALUES (
  'b2b@test.com',
  '$2a$10$YourHashedPasswordHere',  -- 실제로는 bcrypt 해시 필요
  'B2B 테스트',
  '010-8765-4321',
  'B2B',
  'company',
  '테스트 기업',
  'email',
  CURRENT_TIMESTAMP,
  1
);
