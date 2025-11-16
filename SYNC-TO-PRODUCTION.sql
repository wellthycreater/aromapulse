-- ====================================
-- 로컬 → 프로덕션 DB 동기화 SQL
-- ====================================
-- Cloudflare D1 Console에서 실행:
-- https://dash.cloudflare.com → D1 → aromapulse-production → Console
-- ====================================

-- 1. 기존 프로덕션 제품 모두 삭제
DELETE FROM products;


-- 동기화 완료 확인
SELECT id, name, price, stock, concept FROM products ORDER BY id;
