-- ========================================
-- 프로덕션 데이터베이스 마이그레이션 스크립트
-- 실행 위치: Cloudflare Dashboard > D1 > aromapulse-production > Console
-- ========================================

-- 1. workshops 테이블에 type 컬럼 추가
ALTER TABLE workshops ADD COLUMN type TEXT DEFAULT 'class';

-- 2. type 컬럼 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_workshops_type ON workshops(type);

-- 3. ID 4번 워크샵의 제목과 설명을 '원데이 클래스'로 수정
UPDATE workshops 
SET 
  title = '스트레스 해소 아로마 원데이 클래스',
  description = '직장 내 스트레스를 향기로 다스리는 힐링 원데이 클래스입니다. 조향사와 심리상담사가 함께합니다.'
WHERE id = 4;

-- 4. 검증 쿼리 (실행 후 확인)
SELECT id, title, type, price FROM workshops ORDER BY type, id;
