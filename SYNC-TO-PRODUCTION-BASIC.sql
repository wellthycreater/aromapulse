-- ============================================
-- 로컬 → 프로덕션 DB 동기화 SQL (이미지 제외)
-- 생성 시각: 2025-11-16
-- 제품: 라벤더 수면 롤온
-- 이미지는 별도 업데이트 필요
-- ============================================

-- 1단계: 기존 프로덕션 제품 삭제 (선택사항)
-- DELETE FROM products;

-- 2단계: 로컬 제품 삽입 (이미지 제외)
INSERT INTO products (
  name,
  description,
  concept,
  category,
  price,
  stock,
  is_active
) VALUES (
  '라벤더 수면 롤온',
  '라벤더 수면 롤온',
  'symptom_care',
  'insomnia',
  1,
  1,
  1
);

-- 3단계: 동기화 결과 확인
SELECT id, name, concept, category, price, stock, is_active 
FROM products 
ORDER BY id DESC;

-- 총 제품 개수
SELECT COUNT(*) as total_products FROM products;
