-- ========================================
-- 관리자 페이지와 사용자 페이지 동기화 스크립트
-- Cloudflare Dashboard Console에서 실행
-- ========================================

-- 1단계: 현재 프로덕션 DB의 모든 제품 확인
SELECT id, name, price, stock, is_active, created_at 
FROM products 
ORDER BY id;

-- 2단계: 모든 제품 삭제 (깨끗하게 시작)
DELETE FROM products;

-- 3단계: 라벤더 수면 롤온 추가 (35,000원)
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
  '라벤더 수면 롤온',
  '편안한 수면을 위한 라벤더 롤온',
  'insomnia',
  35000,
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

-- 4단계: 라벤더 수면 룸 스프레이 추가 (가격 수정 필요)
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

-- 5단계: 최종 결과 확인 (2개 제품만 있어야 함)
SELECT id, name, price, stock, is_active 
FROM products 
ORDER BY id;

-- ========================================
-- 완료 후 할 일:
-- 1. aromapulse.kr 메인 페이지 새로고침 (Ctrl+Shift+R로 캐시 삭제)
-- 2. 관리자 페이지에서 이미지 업로드
-- ========================================
