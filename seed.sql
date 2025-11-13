-- 관리자 계정 (Admin)
-- 비밀번호: admin123 (실제 운영 시 변경 필요)
INSERT OR IGNORE INTO users (email, password_hash, name, user_type, oauth_provider) VALUES 
  ('admin@aromapulse.kr', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '아로마펄스 관리자', 'admin', 'email');

-- 테스트용 B2B 사용자 (워크샵 제공자)
INSERT OR IGNORE INTO users (email, name, user_type, b2b_category, b2b_business_name, oauth_provider) VALUES 
  ('perfumer1@example.com', '향기공방', 'B2B', 'perfumer', '서울 향기공방', 'email'),
  ('shop1@example.com', '힐링아로마샵', 'B2B', 'shop', '강남 힐링아로마', 'email'),
  ('company1@example.com', '웰니스컴퍼니', 'B2B', 'company', '(주)웰니스컴퍼니', 'email');

-- 테스트용 B2C 사용자
INSERT OR IGNORE INTO users (email, name, user_type, b2c_category, b2c_subcategory, oauth_provider) VALUES 
  ('student1@example.com', '김민지', 'B2C', 'daily_stress', '학생', 'email'),
  ('jobseeker1@example.com', '이준호', 'B2C', 'daily_stress', '취준생', 'email'),
  ('worker1@example.com', '박서연', 'B2C', 'work_stress', 'IT/기술', 'email'),
  ('worker2@example.com', '최영수', 'B2C', 'work_stress', '금융/보험', 'email');

-- 테스트용 워크샵
INSERT OR IGNORE INTO workshops (provider_id, title, description, category, location, address, price, duration, max_participants) VALUES 
  (1, '초보자를 위한 아로마테라피 입문', '아로마테라피의 기본 원리와 에센셜 오일 사용법을 배웁니다.', '입문', '서울 강남구', '서울시 강남구 테헤란로 123', 50000, 120, 10),
  (1, '스트레스 해소 아로마 블렌딩', '스트레스 완화에 효과적인 나만의 아로마 블렌드 만들기', '블렌딩', '서울 강남구', '서울시 강남구 테헤란로 123', 80000, 180, 8),
  (2, '수면 개선 아로마 워크샵', '불면증과 수면 문제 해결을 위한 아로마테라피', '수면케어', '서울 서초구', '서울시 서초구 서초대로 456', 60000, 120, 12),
  (2, '직장인 힐링 아로마 클래스', '업무 스트레스 해소와 번아웃 예방을 위한 아로마테라피', '스트레스케어', '서울 서초구', '서울시 서초구 서초대로 456', 70000, 150, 15),
  (3, '기업 단체 아로마 프로그램', '임직원 복지를 위한 맞춤형 아로마테라피 프로그램', '기업', '서울 종로구', '서울시 종로구 세종대로 789', 200000, 240, 30);

-- 테스트용 예약
INSERT OR IGNORE INTO bookings (workshop_id, user_id, booking_date, participants, total_price, status) VALUES 
  (1, 4, datetime('now', '+3 days'), 1, 50000, 'confirmed'),
  (2, 5, datetime('now', '+5 days'), 1, 80000, 'confirmed'),
  (3, 6, datetime('now', '+7 days'), 1, 60000, 'pending'),
  (4, 7, datetime('now', '+10 days'), 1, 70000, 'confirmed');

-- 테스트용 리뷰
INSERT OR IGNORE INTO reviews (workshop_id, user_id, booking_id, rating, comment, source) VALUES 
  (1, 4, 1, 5, '아로마테라피에 대해 처음 배웠는데 너무 유익했습니다! 강사님이 친절하게 설명해주셔서 쉽게 이해할 수 있었어요.', 'platform'),
  (2, 5, 2, 4, '블렌딩 과정이 재미있었고, 나만의 향을 만들 수 있어서 좋았습니다. 시간이 조금 짧게 느껴졌네요.', 'platform'),
  (3, 6, 3, 5, '불면증 때문에 힘들었는데, 워크샵에서 배운 방법을 써보니 확실히 수면이 개선되었습니다!', 'platform');

-- 테스트용 활동 로그
INSERT OR IGNORE INTO user_activity_logs (user_id, activity_type, target_type, target_id) VALUES 
  (4, 'view', 'workshop', 1),
  (4, 'view', 'workshop', 2),
  (4, 'booking', 'workshop', 1),
  (5, 'view', 'workshop', 2),
  (5, 'search', NULL, NULL),
  (5, 'booking', 'workshop', 2),
  (6, 'view', 'workshop', 3),
  (6, 'view', 'workshop', 4),
  (7, 'view', 'workshop', 4),
  (7, 'bookmark', 'workshop', 4);
