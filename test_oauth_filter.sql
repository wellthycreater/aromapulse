-- OAuth Filter Test Data
-- 3개씩 그룹으로 만들어서 카카오/구글/네이버별로 분배 테스트

-- 제품 추가 (ID 4~12: 총 9개 추가로 12개)
INSERT INTO products (id, name, description, price, stock, category, main_image, is_active, concept, created_at, updated_at)
VALUES 
-- ID 4 (4%3=1 → Google)
(4, '페퍼민트 컨센트레이션 롤온', '집중력 향상을 위한 페퍼민트 롤온', 15000, 50, 'rollon', 'https://example.com/peppermint.jpg', 1, 'symptom_care', datetime('now'), datetime('now')),

-- ID 5 (5%3=2 → Naver)
(5, '로즈마리 메모리 부스트 디퓨저', '기억력 증진을 위한 로즈마리 디퓨저', 38000, 30, 'diffuser', 'https://example.com/rosemary.jpg', 1, 'symptom_care', datetime('now'), datetime('now')),

-- ID 6 (6%3=0 → Kakao)
(6, '시트러스 에너지 스프레이', '활력 충전을 위한 시트러스 룸스프레이', 22000, 40, 'spray', 'https://example.com/citrus.jpg', 1, 'refresh', datetime('now'), datetime('now')),

-- ID 7 (7%3=1 → Google)
(7, '카모마일 슬립 에센셜 오일', '숙면을 위한 카모마일 에센셜 오일', 28000, 35, 'essential_oil', 'https://example.com/chamomile.jpg', 1, 'symptom_care', datetime('now'), datetime('now')),

-- ID 8 (8%3=2 → Naver)
(8, '티트리 퓨리파잉 디퓨저', '공기 정화를 위한 티트리 디퓨저', 42000, 25, 'diffuser', 'https://example.com/teatree.jpg', 1, 'refresh', datetime('now'), datetime('now')),

-- ID 9 (9%3=0 → Kakao)
(9, '재스민 리프레시 롤온', '기분 전환을 위한 재스민 롤온', 16000, 45, 'rollon', 'https://example.com/jasmine.jpg', 1, 'refresh', datetime('now'), datetime('now')),

-- ID 10 (10%3=1 → Google)
(10, '샌달우드 메디테이션 인센스', '명상을 위한 샌달우드 인센스', 19000, 60, 'incense', 'https://example.com/sandalwood.jpg', 1, 'symptom_care', datetime('now'), datetime('now')),

-- ID 11 (11%3=2 → Naver)
(11, '일랑일랑 로맨스 캔들', '분위기 연출을 위한 일랑일랑 캔들', 25000, 30, 'candle', 'https://example.com/ylangylang.jpg', 1, 'refresh', datetime('now'), datetime('now')),

-- ID 12 (12%3=0 → Kakao)
(12, '베르가못 스트레스 릴리프 오일', '스트레스 완화를 위한 베르가못 오일', 32000, 40, 'essential_oil', 'https://example.com/bergamot.jpg', 1, 'symptom_care', datetime('now'), datetime('now'));

-- 원데이 클래스 추가 (ID 1~9: 총 9개)
INSERT INTO oneday_classes (
  id, provider_id, title, description, category, location, address, 
  price, duration, max_participants, 
  image_url, latitude, longitude, is_active, created_at, updated_at
)
VALUES 
-- ID 1 (1%3=1 → Google)
(1, 1, '아로마 디퓨저 만들기', '나만의 향기 디퓨저를 직접 만드는 원데이 클래스', 'workshop', '강남', '서울 강남구 테헤란로 123', 
 45000, 120, 8, 
 'https://example.com/class1.jpg', 37.5012, 127.0396, 1, datetime('now'), datetime('now')),

-- ID 2 (2%3=2 → Naver)
(2, 1, '천연 비누 만들기 클래스', '피부에 좋은 천연 비누를 만드는 체험', 'workshop', '홍대', '서울 마포구 홍대입구 456', 
 38000, 90, 10, 
 'https://example.com/class2.jpg', 37.5565, 126.9244, 1, datetime('now'), datetime('now')),

-- ID 3 (3%3=0 → Kakao)
(3, 1, '힐링 아로마 테라피', '스트레스 해소를 위한 아로마 테라피 체험', 'therapy', '신사', '서울 강남구 논현로 789', 
 55000, 150, 6, 
 'https://example.com/class3.jpg', 37.5172, 127.0286, 1, datetime('now'), datetime('now')),

-- ID 4 (4%3=1 → Google)
(4, 1, '캔들 공예 원데이', '향기로운 캔들을 직접 제작하는 클래스', 'workshop', '이태원', '서울 용산구 이태원로 234', 
 42000, 100, 8, 
 'https://example.com/class4.jpg', 37.5343, 126.9945, 1, datetime('now'), datetime('now')),

-- ID 5 (5%3=2 → Naver)
(5, 1, '천연 화장품 만들기', '피부에 순한 천연 화장품 제작 워크샵', 'workshop', '압구정', '서울 강남구 압구정로 567', 
 48000, 110, 6, 
 'https://example.com/class5.jpg', 37.5271, 127.0288, 1, datetime('now'), datetime('now')),

-- ID 6 (6%3=0 → Kakao)
(6, 1, '향수 블렌딩 클래스', '나만의 시그니처 향수를 만드는 특별한 경험', 'workshop', '삼청동', '서울 종로구 삼청로 890', 
 65000, 180, 5, 
 'https://example.com/class6.jpg', 37.5862, 126.9833, 1, datetime('now'), datetime('now')),

-- ID 7 (7%3=1 → Google)
(7, 1, '힐링 티 블렌딩', '아로마 힐링 티를 블렌딩하는 클래스', 'therapy', '가로수길', '서울 강남구 가로수길 101', 
 35000, 80, 10, 
 'https://example.com/class7.jpg', 37.5196, 127.0226, 1, datetime('now'), datetime('now')),

-- ID 8 (8%3=2 → Naver)
(8, 1, '아로마 마사지 오일 만들기', '힐링 마사지 오일 제작 워크샵', 'workshop', '명동', '서울 중구 명동길 345', 
 40000, 90, 8, 
 'https://example.com/class8.jpg', 37.5636, 126.9848, 1, datetime('now'), datetime('now')),

-- ID 9 (9%3=0 → Kakao)
(9, 1, '천연 룸스프레이 만들기', '집안 분위기를 바꾸는 룸스프레이 제작', 'workshop', '성수', '서울 성동구 아차산로 678', 
 33000, 75, 12, 
 'https://example.com/class9.jpg', 37.5446, 127.0555, 1, datetime('now'), datetime('now'));

-- 분배 확인 쿼리
SELECT '=== 제품 분배 (Total: 12개) ===' as info;
SELECT 
  'Kakao (ID%3=0)' as provider,
  COUNT(*) as count,
  GROUP_CONCAT(id || ':' || name, ', ') as items
FROM products 
WHERE id % 3 = 0 AND is_active = 1;

SELECT 
  'Google (ID%3=1)' as provider,
  COUNT(*) as count,
  GROUP_CONCAT(id || ':' || name, ', ') as items
FROM products 
WHERE id % 3 = 1 AND is_active = 1;

SELECT 
  'Naver (ID%3=2)' as provider,
  COUNT(*) as count,
  GROUP_CONCAT(id || ':' || name, ', ') as items
FROM products 
WHERE id % 3 = 2 AND is_active = 1;

SELECT '=== 원데이 클래스 분배 (Total: 9개) ===' as info;
SELECT 
  'Kakao (ID%3=0)' as provider,
  COUNT(*) as count,
  GROUP_CONCAT(id || ':' || title, ', ') as items
FROM oneday_classes 
WHERE id % 3 = 0 AND is_active = 1;

SELECT 
  'Google (ID%3=1)' as provider,
  COUNT(*) as count,
  GROUP_CONCAT(id || ':' || title, ', ') as items
FROM oneday_classes 
WHERE id % 3 = 1 AND is_active = 1;

SELECT 
  'Naver (ID%3=2)' as provider,
  COUNT(*) as count,
  GROUP_CONCAT(id || ':' || title, ', ') as items
FROM oneday_classes 
WHERE id % 3 = 2 AND is_active = 1;
