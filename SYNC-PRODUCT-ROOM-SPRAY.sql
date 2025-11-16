-- 라벤더 수면 룸 스프레이 제품 프로덕션 DB 동기화
-- Cloudflare Dashboard Console에서 실행

-- Step 1: 기본 제품 정보 삽입 (이미지는 제외)
INSERT INTO products (
  name,
  description,
  category,
  price,
  stock,
  concept,
  care_type,
  brand,
  volume,
  is_active,
  b2b_available,
  refresh_type,
  items_per_box,
  created_at,
  updated_at
) VALUES (
  '라벤더 수면 룸 스프레이',
  '편안한 수면을 위한 라벤더 룸 스프레이',
  'insomnia',
  25000,
  6,
  'symptom_care',
  NULL,
  NULL,
  NULL,
  1,
  0,
  NULL,
  2,
  datetime('now'),
  datetime('now')
);

-- Step 2: 삽입된 제품 ID 확인
SELECT id, name, category, price, is_active 
FROM products 
WHERE name = '라벤더 수면 룸 스프레이' 
ORDER BY id DESC 
LIMIT 1;

-- 참고: 이미지는 관리자 페이지(https://www.aromapulse.kr/admin-products)에서 업로드하세요
