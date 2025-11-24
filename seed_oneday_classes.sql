-- Seed data for oneday_classes with real Seoul locations
-- 생성일: 2025-11-24

-- Insert dummy provider user if not exists
INSERT OR IGNORE INTO users (id, email, name, user_type, role, oauth_provider, created_at)
VALUES (999, 'aromapulse@example.com', 'AromaPulse 본사', 'B2B', 'admin', 'google', datetime('now'));

-- Insert oneday classes with real Seoul locations
INSERT INTO oneday_classes (
  provider_id, title, description, category, location, address,
  price, duration, max_participants,
  latitude, longitude, map_providers,
  google_place_id, is_active, created_at
) VALUES 
-- 1. 강남역 근처
(999, '힐링 아로마 디퓨저 만들기', '나만의 향기로 가득한 디퓨저를 직접 만들어보세요. 아로마펄스 강남점에서 김지향 조향사님과 함께합니다.', '아로마테라피', '서울 강남구', '서울특별시 강남구 테헤란로 152',
 45000, 90, 8,
 37.4979, 127.0276, 'google,naver,kakao',
 NULL, 1, datetime('now')),

-- 2. 홍대입구역 근처
(999, '천연 아로마 비누 만들기', '피부에 좋은 천연 아로마 비누를 만들어보세요. 홍대 아로마 공방에서 이향기 선생님과 함께합니다.', '아로마테라피', '서울 마포구', '서울특별시 마포구 와우산로 21길 19',
 38000, 120, 10,
 37.5563, 126.9242, 'google,naver,kakao',
 NULL, 1, datetime('now')),

-- 3. 신촌역 근처  
(999, '아로마 캔들 & 왁스타블렛 클래스', '향기로운 캔들과 왁스타블렛을 만들어보세요. 신촌 힐링 스튜디오의 박향수 조향사님과 함께합니다.', '아로마테라피', '서울 서대문구', '서울특별시 서대문구 신촌역로 30',
 42000, 100, 6,
 37.5552, 126.9364, 'google,naver,kakao',
 NULL, 1, datetime('now')),

-- 4. 잠실역 근처
(999, '커플 전용 아로마 클래스', '연인과 함께 만드는 특별한 향기 체험. 잠실 아로마 라운지에서 최향미 선생님과 함께합니다.', '아로마테라피', '서울 송파구', '서울특별시 송파구 올림픽로 240',
 89000, 150, 4,
 37.5133, 127.1003, 'google,naver,kakao',
 NULL, 1, datetime('now')),

-- 5. 이태원역 근처
(999, '힙한 디퓨저 & 향수 클래스', '나만의 시그니처 향을 찾아보세요. 이태원 센트 스튜디오에서 정향수 조향사님과 함께합니다.', '아로마테라피', '서울 용산구', '서울특별시 용산구 이태원로 200',
 55000, 110, 8,
 37.5342, 126.9947, 'google,naver,kakao',
 NULL, 1, datetime('now')),

-- 6. 강남 신논현역 근처
(999, '스트레스 해소 아로마 원데이', '일상의 스트레스를 날려버릴 힐링 클래스. 신논현 힐링존에서 김휴식 선생님과 함께합니다.', '아로마테라피', '서울 강남구', '서울특별시 강남구 강남대로 396',
 48000, 95, 10,
 37.5044, 127.0244, 'google,naver,kakao',
 NULL, 1, datetime('now')),

-- 7. 명동역 근처
(999, '관광객 환영 아로마 체험', '한국의 향을 체험하는 특별한 시간. 명동 아로마 갤러리에서 송향기 조향사님과 함께합니다.', '아로마테라피', '서울 중구', '서울특별시 중구 명동길 52',
 52000, 100, 12,
 37.5615, 126.9855, 'google,naver,kakao',
 NULL, 1, datetime('now')),

-- 8. 건대입구역 근처
(999, '대학생 할인 아로마 클래스', '학생 친화적인 가격의 힐링 클래스. 건대 유스 아로마에서 정청춘 선생님과 함께합니다.', '아로마테라피', '서울 광진구', '서울특별시 광진구 능동로 120',
 35000, 90, 15,
 37.5404, 127.0696, 'google,naver,kakao',
 NULL, 1, datetime('now'));

-- Verify insertion
SELECT COUNT(*) as total_classes FROM oneday_classes;
