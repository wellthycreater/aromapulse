-- ========================================
-- 프로덕션 데이터베이스 마이그레이션 스크립트
-- 실행 위치: Cloudflare Dashboard > D1 > aromapulse-production > Console
-- ========================================

-- 1. workshops 테이블에 type 컬럼 추가 (이미 있으면 에러 무시)
ALTER TABLE workshops ADD COLUMN type TEXT DEFAULT 'class';

-- 2. type 컬럼 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_workshops_type ON workshops(type);

-- 3. "천연 디퓨저 만들기"를 원데이 클래스로 설정
UPDATE workshops 
SET type = 'class'
WHERE title = '천연 디퓨저 만들기';

-- 4. "나만의 향수 만들기"를 원데이 클래스로 설정
UPDATE workshops 
SET type = 'class'
WHERE title = '나만의 향수 만들기';

-- 5. 잘못된 데이터 삭제 (ID 1번)
DELETE FROM workshops WHERE id = 1;

-- 6. 검증 쿼리 (실행 후 확인)
SELECT id, title, type, price FROM workshops ORDER BY type, id;
