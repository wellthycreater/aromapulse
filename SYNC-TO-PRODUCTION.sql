-- ============================================
-- 로컬 → 프로덕션 DB 동기화 SQL
-- 생성 시각: 2025-11-16
-- ============================================

-- ⚠️ 주의사항:
-- 1. 이 SQL은 프로덕션 DB의 기존 제품을 모두 삭제합니다
-- 2. 주문 데이터가 있는 경우 Foreign Key 오류가 발생할 수 있습니다
-- 3. 필요시 DELETE 문을 주석 처리하고 INSERT만 실행하세요

-- 1단계: 기존 프로덕션 제품 삭제 (선택사항)
-- DELETE FROM products;

-- 2단계: 로컬 제품 삽입
-- 제품 1: 라벤더 수면 롤온 (불면증 케어)
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
  '편안한 수면을 위한 천연 라벤더 롤온 제품입니다.',
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
