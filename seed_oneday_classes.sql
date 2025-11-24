-- Seed data for oneday_classes table
-- Test data with Google/Naver/Kakao place IDs

-- Insert test oneday classes
INSERT OR IGNORE INTO oneday_classes (
  provider_id,
  title,
  description, 
  location, 
  address,
  latitude,
  longitude,
  map_providers,
  google_place_id,
  naver_place_id,
  kakao_place_id,
  price,
  duration,
  max_participants,
  is_active,
  created_at
) VALUES 
-- Google Maps only
(
  1,
  '강남 아로마 힐링 클래스',
  '직장인을 위한 스트레스 해소 아로마 테라피 클래스. 나만의 향수 만들기와 힐링 마사지 체험',
  '강남',
  '서울특별시 강남구 테헤란로 123',
  37.5007,
  127.0377,
  'google',
  'ChIJH8jXXjmjfDUR4ZWm-DQjMrw',
  NULL,
  NULL,
  89000,
  120,
  10,
  1,
  datetime('now')
),

-- Naver Map only
(
  1,
  '홍대 천연 비누 만들기',
  '천연 재료로 나만의 비누를 만들어보는 체험형 클래스. 선물용으로도 좋아요!',
  '홍대',
  '서울특별시 마포구 와우산로 29길 45',
  37.5537,
  126.9218,
  'naver',
  NULL,
  '38324765',
  NULL,
  59000,
  90,
  8,
  1,
  datetime('now')
),

-- Kakao Map only
(
  1,
  '이태원 캔들 제작 클래스',
  '향기로운 캔들을 직접 만들어보는 감성 원데이 클래스',
  '이태원',
  '서울특별시 용산구 이태원로 100',
  37.5346,
  126.9944,
  'kakao',
  NULL,
  NULL,
  '27497865',
  69000,
  100,
  12,
  1,
  datetime('now')
),

-- All platforms
(
  1,
  '신촌 아로마 디퓨저 클래스',
  '인테리어 소품으로도 좋은 아로마 디퓨저를 직접 만들어보세요',
  '신촌',
  '서울특별시 서대문구 연세로 50',
  37.5579,
  126.9368,
  'google,naver,kakao',
  'ChIJQU8PWAmjfDUR4l5X-9UHQjw',
  '12345678',
  '98765432',
  79000,
  110,
  15,
  1,
  datetime('now')
),

-- Google + Naver
(
  1,
  '압구정 핸드메이드 향수 클래스',
  '조향사와 함께하는 나만의 향수 제작 클래스. 프리미엄 향료 사용',
  '압구정',
  '서울특별시 강남구 압구정로 100',
  37.5275,
  127.0284,
  'google,naver',
  'ChIJRzYBLjajfDUR-Esg1G8L0jQ',
  '55667788',
  NULL,
  129000,
  150,
  6,
  1,
  datetime('now')
),

-- Naver + Kakao
(
  1,
  '성수동 자연주의 클래스',
  '피부에 좋은 천연 화장품을 직접 만들어보는 클래스',
  '성수동',
  '서울특별시 성동구 성수이로 100',
  37.5446,
  127.0558,
  'naver,kakao',
  NULL,
  '99887766',
  '11223344',
  95000,
  130,
  10,
  1,
  datetime('now')
);
