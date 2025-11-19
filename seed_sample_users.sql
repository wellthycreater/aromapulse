-- Sample users for testing admin dashboard charts

-- B2C Users - Daily Stress
INSERT INTO users (email, name, phone, user_type, b2c_category, life_situation, gender, age_group, region, role, oauth_provider, is_active) VALUES
('student1@example.com', '김학생', '010-1111-1111', 'B2C', 'daily_stress', 'student', 'male', '20s', '서울', 'user', 'email', 1),
('parent1@example.com', '이부모', '010-2222-2222', 'B2C', 'daily_stress', 'parent', 'female', '30s', '경기', 'user', 'naver', 1),
('homemaker1@example.com', '박주부', '010-3333-3333', 'B2C', 'daily_stress', 'homemaker', 'female', '40s', '인천', 'user', 'kakao', 1),
('jobseeker1@example.com', '최취준', '010-4444-4444', 'B2C', 'daily_stress', 'job_seeker', 'male', '20s', '부산', 'user', 'google', 1),
('retiree1@example.com', '정은퇴', '010-5555-5555', 'B2C', 'daily_stress', 'retiree', 'male', '60s+', '대구', 'user', 'email', 1);

-- B2C Users - Work Stress
INSERT INTO users (email, name, phone, user_type, b2c_category, occupation, gender, age_group, region, role, oauth_provider, is_active) VALUES
('office1@example.com', '강사무', '010-6666-6666', 'B2C', 'work_stress', 'office_it', 'male', '30s', '서울', 'user', 'email', 1),
('service1@example.com', '송서비', '010-7777-7777', 'B2C', 'work_stress', 'service_retail', 'female', '20s', '경기', 'user', 'naver', 1),
('medical1@example.com', '윤의료', '010-8888-8888', 'B2C', 'work_stress', 'medical_care', 'female', '30s', '서울', 'user', 'kakao', 1),
('teacher1@example.com', '한교사', '010-9999-9999', 'B2C', 'work_stress', 'education', 'female', '40s', '대전', 'user', 'google', 1),
('factory1@example.com', '오현장', '010-1010-1010', 'B2C', 'work_stress', 'manufacturing_logistics', 'male', '30s', '인천', 'user', 'email', 1),
('freelancer1@example.com', '임프리', '010-1212-1212', 'B2C', 'work_stress', 'freelancer_self_employed', 'male', '30s', '서울', 'user', 'naver', 1),
('finance1@example.com', '신금융', '010-1313-1313', 'B2C', 'work_stress', 'finance', 'male', '30s', '서울', 'user', 'email', 1),
('manager1@example.com', '조관리', '010-1414-1414', 'B2C', 'work_stress', 'management_executive', 'male', '40s', '서울', 'user', 'email', 1);

-- B2B Users
INSERT INTO users (email, name, phone, user_type, b2b_category, b2b_business_name, b2b_address, gender, age_group, region, role, oauth_provider, is_active) VALUES
('perfumer1@example.com', '홍조향', '010-2020-2020', 'B2B', 'perfumer', '홍조향사', '서울시 강남구', 'female', '30s', '서울', 'user', 'email', 1),
('perfumer2@example.com', '김향기', '010-2121-2121', 'B2B', 'perfumer', '김향기 스튜디오', '경기도 성남시', 'female', '40s', '경기', 'user', 'naver', 1),
('company1@example.com', '박기업', '010-3030-3030', 'B2B', 'company', '웰니스코퍼레이션', '서울시 서초구', 'male', '40s', '서울', 'user', 'email', 1),
('company2@example.com', '이회사', '010-3131-3131', 'B2B', 'company', '힐링주식회사', '부산시 해운대구', 'male', '50s', '부산', 'user', 'email', 1),
('shop1@example.com', '최공방', '010-4040-4040', 'B2B', 'shop', '아로마공방', '인천시 남동구', 'female', '30s', '인천', 'user', 'kakao', 1),
('shop2@example.com', '정가게', '010-4141-4141', 'B2B', 'shop', '힐링스페이스', '대구시 중구', 'female', '40s', '대구', 'user', 'email', 1);

-- Admin User
INSERT INTO users (email, name, phone, user_type, b2c_category, gender, age_group, region, role, oauth_provider, password_hash, is_active) VALUES
('admin@aromapulse.kr', '관리자', '010-0000-0000', 'B2C', 'daily_stress', 'other', '30s', '서울', 'admin', 'email', 'hashed_password_here', 1);

-- Additional diverse users for better charts
INSERT INTO users (email, name, phone, user_type, b2c_category, life_situation, gender, age_group, region, role, oauth_provider, is_active) VALUES
('user20@example.com', '유저20', '010-2020-2020', 'B2C', 'daily_stress', 'student', 'female', '20s', '광주', 'user', 'email', 1),
('user23@example.com', '유저23', '010-2323-2323', 'B2C', 'daily_stress', 'parent', 'female', '30s', '경기', 'user', 'google', 1);

INSERT INTO users (email, name, phone, user_type, b2c_category, occupation, gender, age_group, region, role, oauth_provider, is_active) VALUES
('user21@example.com', '유저21', '010-2121-2121', 'B2C', 'work_stress', 'office_it', 'female', '30s', '울산', 'user', 'naver', 1),
('user22@example.com', '유저22', '010-2222-2222', 'B2C', 'work_stress', 'service_retail', 'male', '20s', '서울', 'user', 'kakao', 1);
