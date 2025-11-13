-- 회원 세밀 분류 추가 (직무/일상 스트레스, B2B 세부 정보)
-- 생성일: 2025-11-13
-- 기존 0002 마이그레이션에서 추가된 컬럼 제외하고 추가

-- B2C 일상 스트레스 세부 유형
ALTER TABLE users ADD COLUMN daily_stress_category TEXT CHECK(daily_stress_category IN (
  'student_high', 'student_college', 'student_graduate',
  'job_seeker_exam', 'job_seeker_new', 'job_seeker_career', 'job_seeker_parttime', 'job_seeker_short', 'job_seeker_long',
  'caregiver_working_mom', 'caregiver_working_dad', 'caregiver_fulltime', 'caregiver_single',
  NULL
));

-- B2C 직무 스트레스 - 업종
ALTER TABLE users ADD COLUMN work_industry TEXT CHECK(work_industry IN (
  'it_developer', 'design_planning', 'education_teacher', 'medical_welfare',
  'service_customer', 'manufacturing_production', 'public_admin', 'sales_marketing',
  'research_tech', NULL
));

-- B2C 직무 스트레스 - 직종 (상세)
ALTER TABLE users ADD COLUMN work_position TEXT;

-- B2C 공통 - 연령대
ALTER TABLE users ADD COLUMN age_group TEXT CHECK(age_group IN (
  '10s', '20s', '30s', '40s', '50s', '60s_plus', NULL
));

-- B2C 공통 - 성별
ALTER TABLE users ADD COLUMN gender TEXT CHECK(gender IN ('male', 'female', 'other', NULL));

-- B2B - 독립 직군 세부
ALTER TABLE users ADD COLUMN b2b_independent_type TEXT CHECK(b2b_independent_type IN (
  'self_employed', 'startup_founder', 'freelancer', 'creator_influencer', NULL
));

-- B2B - 기업 정보
ALTER TABLE users ADD COLUMN b2b_company_name TEXT;
ALTER TABLE users ADD COLUMN b2b_company_size TEXT CHECK(b2b_company_size IN (
  'small', 'medium', 'large', 'startup', NULL
));
ALTER TABLE users ADD COLUMN b2b_department TEXT; -- 부서
ALTER TABLE users ADD COLUMN b2b_position TEXT; -- 직책

-- B2B - 문의 유형
ALTER TABLE users ADD COLUMN b2b_inquiry_type TEXT; -- JSON 배열: ["협업", "대량납품", "기업클래스", "워크샵", "복리후생"]

-- B2B - 매장 정보
ALTER TABLE users ADD COLUMN b2b_shop_name TEXT;
ALTER TABLE users ADD COLUMN b2b_shop_type TEXT; -- 매장 유형

-- 제품 - 카테고리 (기존 type을 보완)
ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'room_spray' CHECK(category IN (
  'room_spray', 'fabric_perfume', 'fabric_deodorizer', 'diffuser', 'candle', 'perfume'
));

-- 블로그 댓글에 자동 분류 추가
ALTER TABLE blog_comments ADD COLUMN auto_user_type TEXT CHECK(auto_user_type IN ('B2C', 'B2B', NULL));

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_daily_category ON users(daily_stress_category);
CREATE INDEX IF NOT EXISTS idx_users_work_industry ON users(work_industry);
CREATE INDEX IF NOT EXISTS idx_users_age_group ON users(age_group);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
