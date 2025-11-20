-- Insert comprehensive sample user data with new category structure

-- B2C 직무 스트레스 - 직장인 (9명)
INSERT INTO users (name, email, phone, user_type, b2c_category, b2c_subcategory, position, oauth_provider, referral_source, created_at, is_active) VALUES
('김민준', 'minjun.kim@example.com', '010-1001-1001', 'B2C', 'work', 'it_developer', '백엔드 개발자', 'kakao', 'instagram', datetime('now', '-25 days'), 1),
('이서연', 'seoyeon.lee@example.com', '010-1002-1002', 'B2C', 'work', 'design_planning', 'UI/UX 디자이너', 'naver', 'blog', datetime('now', '-23 days'), 1),
('박지훈', 'jihun.park@example.com', '010-1003-1003', 'B2C', 'work', 'education_teacher', '고등학교 교사', 'google', 'youtube', datetime('now', '-21 days'), 1),
('최수진', 'sujin.choi@example.com', '010-1004-1004', 'B2C', 'work', 'medical_welfare', '간호사', 'kakao', 'instagram', datetime('now', '-19 days'), 1),
('정예린', 'yerin.jung@example.com', '010-1005-1005', 'B2C', 'work', 'service_customer', '호텔 프론트', 'naver', 'blog', datetime('now', '-17 days'), 1),
('강태윤', 'taeyoon.kang@example.com', '010-1006-1006', 'B2C', 'work', 'manufacturing_production', '생산관리', 'email', 'direct', datetime('now', '-15 days'), 1),
('윤미래', 'mirae.yoon@example.com', '010-1007-1007', 'B2C', 'work', 'public_admin', '공무원', 'kakao', 'blog', datetime('now', '-13 days'), 1),
('한도현', 'dohyun.han@example.com', '010-1008-1008', 'B2C', 'work', 'sales_marketing', '영업팀장', 'naver', 'youtube', datetime('now', '-11 days'), 1),
('서하은', 'haeun.seo@example.com', '010-1009-1009', 'B2C', 'work', 'research_tech', '연구원', 'google', 'instagram', datetime('now', '-9 days'), 1);

-- B2C 직무 스트레스 - 독립 직군 (4명)
INSERT INTO users (name, email, phone, user_type, b2c_category, b2c_subcategory, position, oauth_provider, referral_source, created_at, is_active) VALUES
('임준서', 'junseo.lim@example.com', '010-2001-2001', 'B2C', 'work', 'independent_self_employed', '카페 운영', 'kakao', 'instagram', datetime('now', '-8 days'), 1),
('오지우', 'jiwoo.oh@example.com', '010-2002-2002', 'B2C', 'work', 'independent_freelancer', '그래픽 디자이너', 'naver', 'blog', datetime('now', '-7 days'), 1),
('신예준', 'yejun.shin@example.com', '010-2003-2003', 'B2C', 'work', 'independent_startup', '스타트업 대표', 'google', 'youtube', datetime('now', '-6 days'), 1),
('조서아', 'seoa.jo@example.com', '010-2004-2004', 'B2C', 'work', 'independent_creator', '유튜브 크리에이터', 'kakao', 'instagram', datetime('now', '-5 days'), 1);

-- B2C 일상 스트레스 - 학생 (4명)
INSERT INTO users (name, email, phone, user_type, b2c_category, b2c_subcategory, oauth_provider, referral_source, created_at, is_active) VALUES
('홍서준', 'seojun.hong@example.com', '010-3001-3001', 'B2C', 'daily', 'student_middle', 'kakao', 'instagram', datetime('now', '-20 days'), 1),
('김하린', 'harin.kim@example.com', '010-3002-3002', 'B2C', 'daily', 'student_high', 'naver', 'blog', datetime('now', '-18 days'), 1),
('이민서', 'minseo.lee@example.com', '010-3003-3003', 'B2C', 'daily', 'student_college', 'google', 'youtube', datetime('now', '-16 days'), 1),
('박도윤', 'doyun.park@example.com', '010-3004-3004', 'B2C', 'daily', 'student_graduate', 'kakao', 'blog', datetime('now', '-14 days'), 1);

-- B2C 일상 스트레스 - 구직자/취준생 (4명)
INSERT INTO users (name, email, phone, user_type, b2c_category, b2c_subcategory, oauth_provider, referral_source, created_at, is_active) VALUES
('최시우', 'siwoo.choi@example.com', '010-4001-4001', 'B2C', 'daily', 'job_seeker_new', 'naver', 'instagram', datetime('now', '-12 days'), 1),
('정수아', 'sua.jung@example.com', '010-4002-4002', 'B2C', 'daily', 'job_seeker_career', 'kakao', 'blog', datetime('now', '-10 days'), 1),
('강민재', 'minjae.kang@example.com', '010-4003-4003', 'B2C', 'daily', 'job_seeker_long', 'google', 'youtube', datetime('now', '-8 days'), 1),
('윤채원', 'chaewon.yoon@example.com', '010-4004-4004', 'B2C', 'daily', 'job_seeker_exam', 'kakao', 'instagram', datetime('now', '-6 days'), 1);

-- B2C 일상 스트레스 - 양육자 (4명)
INSERT INTO users (name, email, phone, user_type, b2c_category, b2c_subcategory, oauth_provider, referral_source, created_at, is_active) VALUES
('한지원', 'jiwon.han@example.com', '010-5001-5001', 'B2C', 'daily', 'caregiver_working_mom', 'naver', 'blog', datetime('now', '-22 days'), 1),
('서준호', 'junho.seo@example.com', '010-5002-5002', 'B2C', 'daily', 'caregiver_working_dad', 'kakao', 'youtube', datetime('now', '-20 days'), 1),
('오은서', 'eunseo.oh@example.com', '010-5003-5003', 'B2C', 'daily', 'caregiver_fulltime', 'google', 'instagram', datetime('now', '-18 days'), 1),
('신유진', 'yujin.shin@example.com', '010-5004-5004', 'B2C', 'daily', 'caregiver_single', 'kakao', 'blog', datetime('now', '-16 days'), 1);

-- B2B - 기업 (3명)
INSERT INTO users (name, email, phone, user_type, b2b_category, b2b_business_name, company_size, department, oauth_provider, referral_source, created_at, is_active) VALUES
('조민수', 'minsu.jo@company1.com', '010-6001-6001', 'B2B', 'company', '테크스타트업', 'startup', '인사팀', 'email', 'direct', datetime('now', '-15 days'), 1),
('배서현', 'seohyun.bae@company2.com', '010-6002-6002', 'B2B', 'company', '글로벌기업', 'large', '복리후생팀', 'google', 'blog', datetime('now', '-13 days'), 1),
('노지훈', 'jihoon.no@company3.com', '010-6003-6003', 'B2B', 'company', '중견기업', 'medium', 'HR팀', 'naver', 'youtube', datetime('now', '-11 days'), 1);

-- B2B - 매장/자영업 (2명)
INSERT INTO users (name, email, phone, user_type, b2b_category, b2b_business_name, oauth_provider, referral_source, created_at, is_active) VALUES
('이소율', 'soyul.lee@shop1.com', '010-7001-7001', 'B2B', 'shop', '아로마샵 강남점', 'kakao', 'instagram', datetime('now', '-10 days'), 1),
('김하늘', 'haneul.kim@shop2.com', '010-7002-7002', 'B2B', 'shop', '힐링 카페', 'naver', 'blog', datetime('now', '-8 days'), 1);

-- B2B - 독립 (2명)
INSERT INTO users (name, email, phone, user_type, b2b_category, oauth_provider, referral_source, created_at, is_active) VALUES
('박예은', 'yeeun.park@independent1.com', '010-8001-8001', 'B2B', 'independent', 'kakao', 'instagram', datetime('now', '-7 days'), 1),
('최재현', 'jaehyun.choi@independent2.com', '010-8002-8002', 'B2B', 'independent', 'google', 'blog', datetime('now', '-5 days'), 1);

-- B2B - 조향사 (1명)
INSERT INTO users (name, email, phone, user_type, b2b_category, b2b_business_name, oauth_provider, referral_source, created_at, is_active) VALUES
('홍예진', 'yejin.hong@perfumer.com', '010-9001-9001', 'B2B', 'perfumer', '향기공방', 'naver', 'youtube', datetime('now', '-4 days'), 1);
