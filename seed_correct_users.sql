-- Correct sample users reflecting actual business model

-- Clear existing data
DELETE FROM users;

-- ========================================
-- B2C Users - Daily Stress (일상 스트레스)
-- ========================================
INSERT INTO users (email, name, phone, user_type, b2c_category, life_situation, gender, age_group, region, role, oauth_provider, is_active) VALUES
('student1@example.com', '김학생', '010-1111-1111', 'B2C', 'daily_stress', 'student', 'male', '20s', '서울', 'user', 'email', 1),
('student2@example.com', '이학생', '010-1112-1112', 'B2C', 'daily_stress', 'student', 'female', '20s', '경기', 'user', 'naver', 1),
('parent1@example.com', '박부모', '010-2222-2222', 'B2C', 'daily_stress', 'parent', 'female', '30s', '서울', 'user', 'kakao', 1),
('parent2@example.com', '최부모', '010-2223-2223', 'B2C', 'daily_stress', 'parent', 'female', '40s', '경기', 'user', 'google', 1),
('homemaker1@example.com', '정주부', '010-3333-3333', 'B2C', 'daily_stress', 'homemaker', 'female', '40s', '인천', 'user', 'email', 1),
('jobseeker1@example.com', '강취준', '010-4444-4444', 'B2C', 'daily_stress', 'job_seeker', 'male', '20s', '부산', 'user', 'naver', 1),
('retiree1@example.com', '윤은퇴', '010-5555-5555', 'B2C', 'daily_stress', 'retiree', 'male', '60s+', '대구', 'user', 'email', 1),
('caregiver1@example.com', '송간병', '010-5556-5556', 'B2C', 'daily_stress', 'caregiver', 'female', '50s', '대전', 'user', 'kakao', 1);

-- ========================================
-- B2C Users - Work Stress (직무 스트레스)
-- ========================================
INSERT INTO users (email, name, phone, user_type, b2c_category, occupation, gender, age_group, region, role, oauth_provider, is_active) VALUES
-- 사무직/IT (고강도 인지부하)
('office1@example.com', '김사무', '010-6666-6666', 'B2C', 'work_stress', 'office_it', 'male', '30s', '서울', 'user', 'email', 1),
('office2@example.com', '이개발', '010-6667-6667', 'B2C', 'work_stress', 'office_it', 'female', '30s', '경기', 'user', 'naver', 1),
('office3@example.com', '박기획', '010-6668-6668', 'B2C', 'work_stress', 'office_it', 'male', '30s', '서울', 'user', 'kakao', 1),

-- 서비스업 (고객대면 스트레스)
('service1@example.com', '최서비', '010-7777-7777', 'B2C', 'work_stress', 'service_retail', 'female', '20s', '서울', 'user', 'email', 1),
('service2@example.com', '정판매', '010-7778-7778', 'B2C', 'work_stress', 'service_retail', 'female', '20s', '부산', 'user', 'naver', 1),

-- 의료/간병 (정서적 소모, 교대근무)
('medical1@example.com', '강간호', '010-8888-8888', 'B2C', 'work_stress', 'medical_care', 'female', '30s', '서울', 'user', 'kakao', 1),
('medical2@example.com', '윤의사', '010-8889-8889', 'B2C', 'work_stress', 'medical_care', 'male', '40s', '경기', 'user', 'email', 1),

-- 교육 (정서적 소모)
('teacher1@example.com', '한교사', '010-9999-9999', 'B2C', 'work_stress', 'education', 'female', '40s', '대전', 'user', 'google', 1),
('teacher2@example.com', '송선생', '010-9990-9990', 'B2C', 'work_stress', 'education', 'female', '30s', '광주', 'user', 'naver', 1),

-- 제조/물류 (교대·야간근무)
('factory1@example.com', '오현장', '010-1010-1010', 'B2C', 'work_stress', 'manufacturing_logistics', 'male', '30s', '인천', 'user', 'email', 1),
('logistics1@example.com', '임물류', '010-1011-1011', 'B2C', 'work_stress', 'manufacturing_logistics', 'male', '40s', '울산', 'user', 'email', 1),

-- 프리랜서/자영업 (불안정 소득)
('freelancer1@example.com', '전프리', '010-1212-1212', 'B2C', 'work_stress', 'freelancer_self_employed', 'male', '30s', '서울', 'user', 'naver', 1),

-- 금융/회계 (고강도 인지부하)
('finance1@example.com', '신금융', '010-1313-1313', 'B2C', 'work_stress', 'finance', 'male', '30s', '서울', 'user', 'email', 1),

-- 관리자/임원
('manager1@example.com', '조임원', '010-1414-1414', 'B2C', 'work_stress', 'management_executive', 'male', '50s', '서울', 'user', 'email', 1);

-- ========================================
-- B2B Users - Independent (소규모 자영업자)
-- ========================================
INSERT INTO users (email, name, phone, user_type, b2b_category, b2b_business_name, b2b_address, gender, age_group, region, role, oauth_provider, is_active) VALUES
('esthetic1@example.com', '김에스', '010-2020-2020', 'B2B', 'independent', '뷰티스파', '서울시 강남구 논현동 123', 'female', '30s', '서울', 'user', 'email', 1),
('salon1@example.com', '이미용', '010-2121-2121', 'B2B', 'independent', '힐링헤어', '경기도 성남시 분당구 456', 'female', '40s', '경기', 'user', 'naver', 1),
('nail1@example.com', '박네일', '010-2222-2222', 'B2B', 'independent', '네일아트', '인천시 남동구 789', 'female', '30s', '인천', 'user', 'kakao', 1),
('massage1@example.com', '최마사', '010-2323-2323', 'B2B', 'independent', '힐링마사지', '부산시 해운대구 012', 'female', '40s', '부산', 'user', 'google', 1),
('cafe1@example.com', '정카페', '010-2424-2424', 'B2B', 'independent', '아로마카페', '대구시 중구 345', 'male', '30s', '대구', 'user', 'email', 1);

-- ========================================
-- B2B Users - Wholesale (대량 납품 업체)
-- ========================================
INSERT INTO users (email, name, phone, user_type, b2b_category, b2b_business_name, b2b_address, gender, age_group, region, role, oauth_provider, is_active) VALUES
('wholesale1@example.com', '강도매', '010-3030-3030', 'B2B', 'wholesale', '(주)웰니스유통', '서울시 금천구 가산동 678', 'male', '40s', '서울', 'user', 'email', 1),
('wholesale2@example.com', '송납품', '010-3131-3131', 'B2B', 'wholesale', '힐링제품유통', '경기도 화성시 901', 'male', '50s', '경기', 'user', 'naver', 1);

-- ========================================
-- B2B Users - Company (기업 복지 담당자)
-- ========================================
-- 20인 미만
INSERT INTO users (email, name, phone, user_type, b2b_category, b2b_business_name, b2b_address, company_size, department, position, gender, age_group, region, role, oauth_provider, is_active) VALUES
('company1@example.com', '윤HR소', '010-4040-4040', 'B2B', 'company', '스타트업A', '서울시 강남구 테헤란로 234', 'under_20', 'HR팀', '팀장', 'female', '30s', '서울', 'user', 'email', 1),

-- 20-50인
('company2@example.com', '한복지중', '010-4141-4141', 'B2B', 'company', '(주)성장기업', '서울시 서초구 567', '20_to_50', '복지팀', '대리', 'female', '30s', '서울', 'user', 'kakao', 1),
('company3@example.com', '임총무중', '010-4242-4242', 'B2B', 'company', '중소기업B', '경기도 수원시 890', '20_to_50', '총무팀', '과장', 'male', '40s', '경기', 'user', 'naver', 1),

-- 50-100인
('company4@example.com', '조HR중', '010-4343-4343', 'B2B', 'company', '(주)중견기업', '서울시 영등포구 123', '50_to_100', 'HR팀', '부장', 'female', '40s', '서울', 'user', 'email', 1),

-- 100인 이상
('company5@example.com', '신복지대', '010-4444-4444', 'B2B', 'company', '대기업C', '서울시 종로구 456', 'over_100', '복지팀', '차장', 'male', '40s', '서울', 'user', 'google', 1),
('company6@example.com', '배HR대', '010-4545-4545', 'B2B', 'company', '(주)글로벌기업', '경기도 성남시 분당구 789', 'over_100', 'HR팀', '부장', 'female', '50s', '경기', 'user', 'email', 1);

-- ========================================
-- Admin User
-- ========================================
INSERT INTO users (email, name, phone, user_type, b2c_category, gender, age_group, region, role, oauth_provider, password_hash, is_active) VALUES
('admin@aromapulse.kr', '관리자', '010-0000-0000', 'B2C', 'daily_stress', 'other', '30s', '서울', 'admin', 'email', '$2a$10$hashedpassword', 1);

-- Total: 40 users
-- B2C daily_stress: 8
-- B2C work_stress: 13
-- B2B independent: 5
-- B2B wholesale: 2
-- B2B company: 6 (분류: under_20: 1, 20_to_50: 2, 50_to_100: 1, over_100: 2)
-- Admin: 1
