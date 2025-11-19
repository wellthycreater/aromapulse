-- Insert comprehensive sample users with B2B company size data

-- B2C Daily Stress Users (8 users)
INSERT OR IGNORE INTO users (email, name, phone, user_type, b2c_category, b2c_subcategory, gender, age_group, region, life_situation, referral_source, oauth_provider, is_active) VALUES
('daily_stress_1@example.com', '김학생', '010-1111-1111', 'B2C', 'daily_stress', 'student', 'male', '20s', '서울', 'student', 'blog', 'email', 1),
('daily_stress_2@example.com', '이학생', '010-1111-2222', 'B2C', 'daily_stress', 'student', 'female', '20s', '서울', 'student', 'instagram', 'kakao', 1),
('daily_stress_3@example.com', '박엄마', '010-1111-3333', 'B2C', 'daily_stress', 'parent', 'female', '30s', '경기', 'parent', 'blog', 'naver', 1),
('daily_stress_4@example.com', '최주부', '010-1111-4444', 'B2C', 'daily_stress', 'homemaker', 'female', '40s', '서울', 'homemaker', 'youtube', 'email', 1),
('daily_stress_5@example.com', '정구직', '010-1111-5555', 'B2C', 'daily_stress', 'job_seeker', 'male', '20s', '인천', 'job_seeker', 'blog', 'email', 1),
('daily_stress_6@example.com', '강은퇴', '010-1111-6666', 'B2C', 'daily_stress', 'retiree', 'male', '60s+', '부산', 'retiree', 'direct', 'email', 1),
('daily_stress_7@example.com', '조돌봄', '010-1111-7777', 'B2C', 'daily_stress', 'caregiver', 'female', '50s', '서울', 'caregiver', 'instagram', 'email', 1),
('daily_stress_8@example.com', '윤취준', '010-1111-8888', 'B2C', 'daily_stress', 'job_seeker', 'male', '30s', '서울', 'job_seeker', 'other', 'google', 1);

-- B2C Work Stress Users (13 users)
INSERT OR IGNORE INTO users (email, name, phone, user_type, b2c_category, b2c_subcategory, gender, age_group, region, occupation, referral_source, oauth_provider, is_active) VALUES
('work_stress_1@example.com', '김개발', '010-2222-1111', 'B2C', 'work_stress', 'office_it', 'male', '30s', '서울', 'office_it', 'blog', 'email', 1),
('work_stress_2@example.com', '이디자인', '010-2222-2222', 'B2C', 'work_stress', 'office_it', 'female', '20s', '서울', 'office_it', 'instagram', 'email', 1),
('work_stress_3@example.com', '박판매', '010-2222-3333', 'B2C', 'work_stress', 'service_retail', 'female', '30s', '부산', 'service_retail', 'youtube', 'email', 1),
('work_stress_4@example.com', '최서비스', '010-2222-4444', 'B2C', 'work_stress', 'service_retail', 'male', '20s', '대구', 'service_retail', 'blog', 'email', 1),
('work_stress_5@example.com', '정간호', '010-2222-5555', 'B2C', 'work_stress', 'medical_care', 'female', '30s', '서울', 'medical_care', 'instagram', 'email', 1),
('work_stress_6@example.com', '강의료', '010-2222-6666', 'B2C', 'work_stress', 'medical_care', 'male', '40s', '서울', 'medical_care', 'blog', 'email', 1),
('work_stress_7@example.com', '조선생', '010-2222-7777', 'B2C', 'work_stress', 'education', 'female', '30s', '경기', 'education', 'youtube', 'email', 1),
('work_stress_8@example.com', '윤교수', '010-2222-8888', 'B2C', 'work_stress', 'education', 'male', '40s', '서울', 'education', 'direct', 'email', 1),
('work_stress_9@example.com', '한공장', '010-2222-9999', 'B2C', 'work_stress', 'manufacturing_logistics', 'male', '30s', '인천', 'manufacturing_logistics', 'instagram', 'email', 1),
('work_stress_10@example.com', '신물류', '010-2222-1010', 'B2C', 'work_stress', 'manufacturing_logistics', 'male', '40s', '경기', 'manufacturing_logistics', 'blog', 'email', 1),
('work_stress_11@example.com', '오프리', '010-2222-1111', 'B2C', 'work_stress', 'freelancer', 'male', '30s', '서울', 'freelancer', 'instagram', 'email', 1),
('work_stress_12@example.com', '하금융', '010-2222-1212', 'B2C', 'work_stress', 'finance', 'female', '30s', '서울', 'finance', 'youtube', 'email', 1),
('work_stress_13@example.com', '김관리', '010-2222-1313', 'B2C', 'work_stress', 'manager', 'male', '40s', '서울', 'manager', 'direct', 'email', 1);

-- B2B Independent (Small Business) - 5 users
INSERT OR IGNORE INTO users (email, name, phone, user_type, b2b_category, b2b_business_name, b2b_address, gender, age_group, region, referral_source, oauth_provider, is_active) VALUES
('b2b_indie_1@example.com', '에스테틱사장', '010-3333-1111', 'B2B', 'independent', '뷰티에스테틱', '서울시 강남구 123', 'female', '30s', '서울', 'blog', 'email', 1),
('b2b_indie_2@example.com', '미용실원장', '010-3333-2222', 'B2B', 'independent', '헤어살롱', '서울시 홍대 456', 'female', '40s', '서울', 'instagram', 'email', 1),
('b2b_indie_3@example.com', '네일샵사장', '010-3333-3333', 'B2B', 'independent', '네일아트샵', '서울시 강남구 789', 'female', '30s', '서울', 'youtube', 'email', 1),
('b2b_indie_4@example.com', '마사지샵원장', '010-3333-4444', 'B2B', 'independent', '힐링마사지', '부산시 해운대 111', 'male', '40s', '부산', 'direct', 'email', 1),
('b2b_indie_5@example.com', '카페사장', '010-3333-5555', 'B2B', 'independent', '아로마카페', '서울시 성수동 222', 'female', '30s', '서울', 'instagram', 'email', 1);

-- B2B Wholesale - 2 users
INSERT OR IGNORE INTO users (email, name, phone, user_type, b2b_category, b2b_business_name, b2b_address, gender, age_group, region, referral_source, oauth_provider, is_active) VALUES
('b2b_whole_1@example.com', '도매상대표', '010-4444-1111', 'B2B', 'wholesale', '향기도매', '서울시 중구 도매시장 A동', 'male', '40s', '서울', 'other', 'email', 1),
('b2b_whole_2@example.com', '유통업체사장', '010-4444-2222', 'B2B', 'wholesale', '뷰티유통', '경기도 고양시 333', 'male', '50s', '경기', 'direct', 'email', 1);

-- B2B Company (with company_size) - 6 users
INSERT OR IGNORE INTO users (email, name, phone, user_type, b2b_category, b2b_business_name, b2b_address, company_size, department, position, gender, age_group, region, referral_source, oauth_provider, is_active) VALUES
('b2b_company_1@example.com', '스타트업HR', '010-5555-1111', 'B2B', 'company', '스타트업A', '서울시 강남구 111', 'under_20', 'HR팀', '팀장', 'female', '30s', '서울', 'blog', 'google', 1),
('b2b_company_2@example.com', '중소기업복지', '010-5555-2222', 'B2B', 'company', '중소기업B', '서울시 마포구 222', '20_to_50', '복지팀', '과장', 'male', '30s', '서울', 'instagram', 'naver', 1),
('b2b_company_3@example.com', '중소인사담당', '010-5555-3333', 'B2B', 'company', '중소기업C', '경기도 성남시 333', '20_to_50', '인사팀', '대리', 'female', '20s', '경기', 'blog', 'kakao', 1),
('b2b_company_4@example.com', '중견복지팀장', '010-5555-4444', 'B2B', 'company', '중견기업D', '서울시 영등포구 444', '50_to_100', '복지팀', '팀장', 'male', '40s', '서울', 'youtube', 'email', 1),
('b2b_company_5@example.com', '대기업HR', '010-5555-5555', 'B2B', 'company', '대기업E', '서울시 강남구 555', 'over_100', 'HR본부', '차장', 'female', '40s', '서울', 'instagram', 'google', 1),
('b2b_company_6@example.com', '대기업복지', '010-5555-6666', 'B2B', 'company', '대기업F', '서울시 종로구 666', 'over_100', '복지팀', '부장', 'male', '40s', '서울', 'direct', 'email', 1);
