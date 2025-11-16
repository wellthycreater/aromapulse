-- 라벤더 제품 품절 표시 해제
-- Cloudflare Dashboard Console에서 실행

-- 1. 현재 상태 확인
SELECT id, name, stock, is_active 
FROM products 
WHERE name LIKE '%라벤더%';

-- 2. 재고 업데이트 (모든 라벤더 제품)
UPDATE products 
SET stock = 100, updated_at = datetime('now')
WHERE name LIKE '%라벤더%';

-- 3. 특정 제품만 업데이트하려면 (ID 14 예시)
-- UPDATE products 
-- SET stock = 100, updated_at = datetime('now')
-- WHERE id = 14;

-- 4. 결과 확인
SELECT id, name, stock, is_active 
FROM products 
WHERE name LIKE '%라벤더%';
