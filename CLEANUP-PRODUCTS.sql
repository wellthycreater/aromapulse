-- 프로덕션 DB 제품 정리 스크립트
-- Cloudflare Dashboard Console에서 실행

-- 1단계: 현재 모든 제품 확인
SELECT id, name, price, stock, is_active, created_at 
FROM products 
ORDER BY id;

-- 2단계: 중복 제품 삭제 (실제 ID는 위 쿼리 결과를 보고 수정)
-- 예시: 테스트 제품이나 중복 제품 삭제
-- DELETE FROM products WHERE id IN (1, 2, 3);  -- 실제 ID로 수정 필요

-- 3단계: 올바른 제품만 남기기
-- 라벤더 수면 롤온만 남기고 나머지 삭제하려면:
-- DELETE FROM products WHERE name != '라벤더 수면 롤온';

-- 4단계: 라벤더 수면 롤온 정보 확인/수정
UPDATE products 
SET price = 35000,
    stock = 6,
    is_active = 1,
    description = '편안한 수면을 위한 라벤더 롤온',
    category = 'insomnia',
    concept = 'symptom_care',
    updated_at = datetime('now')
WHERE name = '라벤더 수면 롤온';

-- 5단계: 라벤더 수면 룸 스프레이 추가
INSERT INTO products (
  name, description, category, price, stock,
  concept, is_active, created_at, updated_at
) VALUES (
  '라벤더 수면 룸 스프레이',
  '편안한 수면을 위한 라벤더 룸 스프레이',
  'insomnia',
  25000,
  6,
  'symptom_care',
  1,
  datetime('now'),
  datetime('now')
);

-- 6단계: 최종 결과 확인
SELECT id, name, price, stock, is_active 
FROM products 
ORDER BY id;
