-- Simple OAuth Filter Test
-- Add more products with different IDs to test modulo-3 distribution

-- Products (already have 1,2,3)
-- Add 4,5,6,7,8,9 to make total 9 products
INSERT OR IGNORE INTO products (id, name, description, price, stock, category, main_image, is_active, concept, created_at, updated_at)
VALUES 
(4, '페퍼민트 롤온', '집중력 향상', 15000, 50, 'rollon', NULL, 1, 'symptom_care', datetime('now'), datetime('now')),
(5, '로즈마리 디퓨저', '기억력 증진', 38000, 30, 'diffuser', NULL, 1, 'symptom_care', datetime('now'), datetime('now')),
(6, '시트러스 스프레이', '활력 충전', 22000, 40, 'spray', NULL, 1, 'refresh', datetime('now'), datetime('now')),
(7, '카모마일 오일', '숙면 유도', 28000, 35, 'oil', NULL, 1, 'symptom_care', datetime('now'), datetime('now')),
(8, '티트리 디퓨저', '공기 정화', 42000, 25, 'diffuser', NULL, 1, 'refresh', datetime('now'), datetime('now')),
(9, '재스민 롤온', '기분 전환', 16000, 45, 'rollon', NULL, 1, 'refresh', datetime('now'), datetime('now'));

-- Check distribution
SELECT '=== Products Distribution ===' as info;
SELECT 'Total: ' || COUNT(*) || ' products' as summary FROM products WHERE is_active = 1;
SELECT 'Kakao (ID%3=0): ' || COUNT(*) || ' items' as kakao FROM products WHERE id % 3 = 0 AND is_active = 1;
SELECT 'Google (ID%3=1): ' || COUNT(*) || ' items' as google FROM products WHERE id % 3 = 1 AND is_active = 1;
SELECT 'Naver (ID%3=2): ' || COUNT(*) || ' items' as naver FROM products WHERE id % 3 = 2 AND is_active = 1;
