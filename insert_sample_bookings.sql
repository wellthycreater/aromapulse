-- 정하민 사용자의 샘플 예약 데이터 추가
-- User ID: 2 (wellthykorea@gmail.com)

-- 1. 원데이 클래스 예약: 향기로운 힐링 체험
INSERT INTO oneday_class_bookings (
  class_id, 
  user_id, 
  booking_date, 
  participants, 
  total_price,
  booker_name, 
  booker_phone, 
  booker_email, 
  status,
  created_at, 
  updated_at
) VALUES (
  15,  -- 향기로운 힐링 체험 (class_id)
  2,   -- 정하민 (user_id)
  '2024-11-25 10:00:00',  -- 11월 25일 오전 10:00
  1,   -- 1명
  50000,  -- 50,000원
  '정하민',
  '01030045183',
  'wellthykorea@gmail.com',
  'confirmed',  -- 확정됨
  datetime('now'),
  datetime('now')
);

-- 2. 쇼핑(제품) 예약: 라벤더 릴렉스 디퓨저
INSERT INTO product_bookings (
  product_id,
  user_id,
  booking_date,
  quantity,
  total_price,
  booker_name,
  booker_phone,
  booker_email,
  special_requests,
  status,
  created_at,
  updated_at
) VALUES (
  1,  -- 라벤더 릴렉스 디퓨저 (product_id)
  2,  -- 정하민 (user_id)
  '2024-11-25 07:14:00',  -- 11월 25일 오전 7:14
  4,  -- 4개
  180000,  -- 45,000원 × 4 = 180,000원
  '정하민',
  '01030045183',
  'wellthykorea@gmail.com',
  '편안한 휴식을 위한 프리미엄 라벤더 디퓨저입니다.',
  'pending',  -- 대기중
  datetime('now', '-30 minutes'),  -- 30분 전에 생성
  datetime('now', '-30 minutes')
);

-- 확인 쿼리
SELECT '=== 원데이 클래스 예약 ===' as info;
SELECT 
  b.id, b.booking_date, b.participants, b.total_price, b.status,
  c.title as class_title
FROM oneday_class_bookings b
JOIN oneday_classes c ON b.class_id = c.id
WHERE b.user_id = 2
ORDER BY b.created_at DESC;

SELECT '=== 쇼핑 예약 ===' as info;
SELECT 
  b.id, b.booking_date, b.quantity, b.total_price, b.status,
  p.name as product_name
FROM product_bookings b
JOIN products p ON b.product_id = p.id
WHERE b.user_id = 2
ORDER BY b.created_at DESC;
