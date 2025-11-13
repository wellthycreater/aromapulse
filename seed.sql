-- 아로마펄스 시드 데이터
-- 생성일: 2025-11-13

-- 관리자 계정 (비밀번호: admin123)
INSERT OR IGNORE INTO admins (email, password, name, role) VALUES 
  ('admin@aromapulse.co.kr', '$2a$10$YourHashedPasswordHere', '관리자', 'super_admin');

-- 테스트 사용자 (B2C)
INSERT OR IGNORE INTO users (email, password, name, phone, user_type, b2c_stress_type, region, symptoms, interests, source) VALUES 
  ('user1@test.com', 'hashed_password', '김지은', '010-1234-5678', 'B2C', 'daily', '서울', '["불면", "불안"]', '["룸스프레이", "디퓨저"]', '블로그'),
  ('user2@test.com', 'hashed_password', '이민준', '010-2345-6789', 'B2C', 'work', '경기', '["우울", "불안"]', '["향수", "캔들"]', '인스타그램');

-- 테스트 사용자 (B2B)
INSERT OR IGNORE INTO users (email, password, name, phone, user_type, b2b_business_type, region, interests, source) VALUES 
  ('perfumer@test.com', 'hashed_password', '박향기', '010-3456-7890', 'B2B', 'perfumer', '서울', '["섬유향수", "룸스프레이"]', '블로그'),
  ('company@test.com', 'hashed_password', '최기업', '010-4567-8901', 'B2B', 'company', '경기', '["디퓨저", "캔들"]', '네이버 카페');

-- 공방/워크숍
INSERT OR IGNORE INTO workshops (name, region, type, description, contact_email, contact_phone) VALUES 
  ('향기로운 공방', '서울', '체험형', '서울 강남에 위치한 아로마 체험 공방', 'contact@향기로운공방.com', '02-1234-5678'),
  ('힐링 아로마', '부산', '납품형', '대량 납품 전문 아로마 제조업체', 'healing@aroma.com', '051-1234-5678'),
  ('센트 스튜디오', '경기', '협업형', '맞춤형 조향 및 기업 협업 전문', 'studio@scent.com', '031-1234-5678');

-- 증상케어 제품 (타사 공방 - 완제품형)
INSERT OR IGNORE INTO products (
  name, type, concept, care_type, brand, volume, description, symptoms, region, 
  price, stock, is_b2b, b2b_available, status, main_image
) VALUES 
  ('라벤더 수면 룸스프레이', '룸스프레이', 'symptom_care', 'ready_made', '향기로운 공방', '100ml', 
   '불면 완화에 효과적인 라벤더 룸스프레이', '["불면"]', '서울', 
   35000, 50, 0, 1, 'active', '/images/lavender-spray.jpg'),
  
  ('베르가못 우울완화 디퓨저', '디퓨저', 'symptom_care', 'ready_made', '힐링 아로마', '200ml', 
   '우울감 완화에 도움을 주는 베르가못 디퓨저', '["우울"]', '부산', 
   45000, 30, 0, 1, 'active', '/images/bergamot-diffuser.jpg'),
  
  ('카모마일 불안완화 캔들', '캔들', 'symptom_care', 'ready_made', '센트 스튜디오', '150g', 
   '불안감 해소에 효과적인 카모마일 캔들', '["불안"]', '경기', 
   28000, 40, 0, 1, 'active', '/images/chamomile-candle.jpg');

-- 증상케어 제품 (타사 공방 - 맞춤제작형)
INSERT OR IGNORE INTO products (
  name, type, concept, care_type, brand, description, symptoms, region, 
  price, stock, is_b2b, b2b_available, status, main_image
) VALUES 
  ('맞춤 조향 섬유향수', '섬유향수', 'symptom_care', 'custom', '센트 스튜디오', 
   '개인 증상 상담 후 맞춤 제작하는 섬유향수 (제작기간 7-10일)', '["불면", "우울", "불안"]', '경기', 
   85000, 0, 0, 0, 'active', '/images/custom-fabric.jpg'),
  
  ('개인 맞춤 블렌딩 향수', '향수', 'symptom_care', 'custom', '향기로운 공방', 
   '1:1 상담을 통한 개인 맞춤 블렌딩 향수 (제작기간 14일)', '["스트레스", "불안"]', '서울', 
   120000, 0, 0, 0, 'active', '/images/custom-perfume.jpg');

-- 리프레시 제품 (아로마펄스 자체 브랜드 - 현재 제조 중)
INSERT OR IGNORE INTO products (
  name, type, concept, brand, volume, description, region, 
  price, stock, is_b2b, b2b_available, status, main_image
) VALUES 
  ('아로마펄스 시그니처 섬유향수', '섬유향수', 'refresh', '아로마펄스', '30ml', 
   '감성적인 일상을 위한 시그니처 섬유향수', '전국', 
   25000, 100, 0, 1, 'active', '/images/ap-fabric-30ml.jpg'),
  
  ('아로마펄스 리프레시 룸스프레이', '룸스프레이', 'refresh', '아로마펄스', '30ml', 
   '공간을 새롭게 만드는 리프레시 룸스프레이', '전국', 
   22000, 80, 0, 1, 'active', '/images/ap-room-30ml.jpg');

-- 리프레시 제품 (준비 중)
INSERT OR IGNORE INTO products (
  name, type, concept, brand, description, region, 
  price, stock, status, main_image
) VALUES 
  ('아로마펄스 섬유탈취제', '섬유탈취제', 'refresh', '아로마펄스', 
   '냄새 제거와 향기를 동시에 (준비 중)', '전국', 
   0, 0, 'preparing', '/images/ap-deodorizer.jpg'),
  
  ('아로마펄스 시그니처 디퓨저', '디퓨저', 'refresh', '아로마펄스', 
   '공간에 은은한 향기를 선사하는 디퓨저 (준비 중)', '전국', 
   0, 0, 'preparing', '/images/ap-diffuser.jpg'),
  
  ('아로마펄스 감성 캔들', '캔들', 'refresh', '아로마펄스', 
   '분위기 있는 공간을 위한 감성 캔들 (준비 중)', '전국', 
   0, 0, 'preparing', '/images/ap-candle.jpg'),
  
  ('아로마펄스 데일리 향수', '향수', 'refresh', '아로마펄스', 
   '일상에 특별함을 더하는 향수 (준비 중)', '전국', 
   0, 0, 'preparing', '/images/ap-perfume.jpg');

-- 블로그 포스트 샘플
INSERT OR IGNORE INTO blog_posts (post_id, title, link, published_at, category, comment_count) VALUES 
  ('223465789', '불면증 극복을 위한 라벤더 향기 활용법', 'https://blog.naver.com/aromapulse/223465789', '2025-11-01 14:30:00', '수면관리', 12),
  ('223465790', '직장인 스트레스 해소, 아로마테라피 시작하기', 'https://blog.naver.com/aromapulse/223465790', '2025-11-05 10:20:00', '스트레스관리', 8),
  ('223465791', '우울감 완화에 도움되는 향기 베스트 5', 'https://blog.naver.com/aromapulse/223465791', '2025-11-10 16:45:00', '심리케어', 15);

-- 블로그 댓글 샘플
INSERT OR IGNORE INTO blog_comments (comment_id, post_id, author_name, content, sentiment, intent, keywords, is_tagged, created_at) VALUES 
  ('c001', 1, '김수면', '라벤더 룸스프레이 써보고 싶어요! 어디서 구매할 수 있나요?', 'positive', '구매의향', '["라벤더", "룸스프레이", "구매"]', 1, '2025-11-02 09:15:00'),
  ('c002', 1, '이불면', '정말 효과 있을까요? 불면증이 심한데...', 'neutral', '문의', '["불면증", "효과"]', 1, '2025-11-02 11:30:00'),
  ('c003', 2, '박직장', '우리 회사에서 직원들 힐링 프로그램으로 도입하고 싶은데 대량 납품 가능한가요?', 'positive', '문의', '["회사", "납품", "프로그램"]', 1, '2025-11-06 14:20:00'),
  ('c004', 3, '최향기', '조향사인데 협업 가능할까요? 연락처 알려주세요', 'positive', '문의', '["조향사", "협업"]', 1, '2025-11-11 10:00:00');

-- 자체 리뷰 샘플
INSERT OR IGNORE INTO reviews (user_id, post_id, content, rating, sentiment, intent, keywords, is_tagged) VALUES 
  (1, 1, '라벤더 스프레이 써보니까 정말 잠이 잘 와요! 강추합니다', 5, 'positive', '체험후기', '["라벤더", "수면", "효과"]', 1),
  (2, 2, '직장 스트레스가 심했는데 디퓨저 덕분에 많이 나아졌어요', 4, 'positive', '체험후기', '["스트레스", "디퓨저", "완화"]', 1);

-- 패치 신청 샘플
INSERT OR IGNORE INTO patch_applications (user_id, name, phone, email, address, symptoms, status) VALUES 
  (1, '김지은', '010-1234-5678', 'user1@test.com', '서울시 강남구 테헤란로 123', '["불면", "불안"]', 'approved'),
  (2, '이민준', '010-2345-6789', 'user2@test.com', '경기도 성남시 분당구 정자동 456', '["우울", "불안"]', 'pending');

-- BEFORE 설문 샘플
INSERT OR IGNORE INTO surveys (user_id, application_id, survey_type, stress_level, sleep_quality, anxiety_level, depression_level, feedback) VALUES 
  (1, 1, 'before', 8, 3, 7, 5, '업무 스트레스로 잠을 잘 못 자고 불안감이 심합니다'),
  (2, 2, 'before', 9, 4, 8, 7, '직장 생활이 힘들고 우울한 기분이 계속됩니다');
