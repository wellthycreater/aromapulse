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

-- 4. 원데이 클래스 샘플 데이터 추가 (누구나 참여 가능)
-- 참고: 기존 데이터(ID 1,2,3,4)가 이미 있다면 중복 추가되지 않도록 주의
INSERT INTO workshops (provider_id, title, description, category, location, address, price, duration, max_participants, type, is_active)
VALUES 
  (1, '힐링 룸스프레이 만들기', '천연 에센셜 오일로 만드는 룸스프레이. 공간을 상쾌하게 바꿔보세요.', '룸스프레이 만들기', '서울', '마포구 홍대입구 234', 38000, 60, 12, 'class', 1),
  (1, '섬유향수 DIY 클래스', '옷과 침구에 뿌리는 은은한 향의 섬유향수를 직접 만들어보세요.', '섬유향수 만들기', '경기', '일산 주엽동 567', 42000, 75, 10, 'class', 1),
  (1, '아로마테라피 입문반', '아로마테라피의 기초부터 실전까지! 향기로 건강을 챙기는 법을 배워보세요.', '아로마테라피 기초', '서울', '강남구 역삼동 890', 95000, 180, 8, 'class', 1);

-- 5. 검증 쿼리 (실행 후 확인)
SELECT id, title, type, price FROM workshops ORDER BY type, id;
