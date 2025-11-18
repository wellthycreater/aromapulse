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

-- 4. B2B 워크샵 샘플 데이터 추가 (기업 전용)
INSERT INTO workshops (provider_id, title, description, category, location, address, price, duration, max_participants, type, is_active)
VALUES 
  (1, '기업 힐링 아로마 워크샵', '직원들의 스트레스 해소와 팀 빌딩을 위한 기업 전용 아로마 워크샵입니다. 조향사와 심리상담사가 함께합니다.', '캔들 만들기', '서울', '강남구 테헤란로 456', 800000, 180, 30, 'workshop', 1),
  (1, '임직원 웰니스 향기 프로그램', '임직원 복지를 위한 특별한 향기 체험 프로그램. 천연 디퓨저와 룸스프레이 제작을 통해 업무 환경을 개선합니다.', '디퓨저 만들기', '서울', '여의도 IFC몰 3층', 1200000, 240, 50, 'workshop', 1),
  (1, '리더십 향기 테라피 워크샵', '리더와 관리자를 위한 특별 프로그램. 향기를 통한 감성 리더십과 소통 능력 향상을 목표로 합니다.', '향수 만들기', '경기', '판교 테크노밸리', 1500000, 300, 20, 'workshop', 1);

-- 5. 검증 쿼리 (실행 후 확인)
SELECT id, title, type, price FROM workshops ORDER BY type, id;
