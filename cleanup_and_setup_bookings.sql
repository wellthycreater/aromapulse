-- 예약 정리 및 샘플 데이터 생성
-- 목적: 원데이 클래스 예약 1개 + 제품 예약 1개만 남기기

-- 1. 원데이 클래스 예약 정리 (ID 9번만 남기고 삭제)
DELETE FROM oneday_class_bookings WHERE id != 9;

-- 2. 제품 예약 모두 삭제 (혹시 있다면)
DELETE FROM product_bookings;

-- 3. 제품 예약 1개 생성 (라벤더 릴렉스 디퓨저)
-- user_id를 확인해야 하므로, 먼저 user_id를 가져옵니다
-- 정하민 (01030045183, wellthykorea@gmail.com) 사용자의 ID 사용

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
    1,  -- 라벤더 릴렉스 디퓨저
    (SELECT id FROM users WHERE email = 'wellthykorea@gmail.com' LIMIT 1),
    '2024-11-25T07:14:00',
    4,
    180000,  -- 45000 * 4
    '정하민',
    '01030045183',
    'wellthykorea@gmail.com',
    '편안한 휴식을 위한 프리미엄 라벤더 디퓨저입니다. 자연스러운 향기로 마음의 안정을 찾아보세요.',
    'confirmed',
    datetime('now'),
    datetime('now')
);

-- 4. 확인 쿼리
SELECT '=== 원데이 클래스 예약 (1개만 남음) ===' as info;
SELECT id, class_id, booking_date, participants, booker_name 
FROM oneday_class_bookings;

SELECT '=== 제품 예약 (1개 생성됨) ===' as info;
SELECT id, product_id, booking_date, quantity, booker_name 
FROM product_bookings;

SELECT '=== 총 예약 개수 ===' as info;
SELECT 
    (SELECT COUNT(*) FROM oneday_class_bookings) as class_bookings,
    (SELECT COUNT(*) FROM product_bookings) as product_bookings,
    (SELECT COUNT(*) FROM oneday_class_bookings) + (SELECT COUNT(*) FROM product_bookings) as total;
