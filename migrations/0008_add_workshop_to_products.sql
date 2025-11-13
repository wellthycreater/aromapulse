-- 제품에 로컬 공방 정보 추가
-- 생성일: 2025-11-13

-- products 테이블에 공방 정보 컬럼 추가
ALTER TABLE products ADD COLUMN workshop_id INTEGER;
ALTER TABLE products ADD COLUMN workshop_name TEXT;
ALTER TABLE products ADD COLUMN workshop_location TEXT; -- 지역 (예: 서울, 부산, 대구)
ALTER TABLE products ADD COLUMN workshop_address TEXT; -- 상세 주소
ALTER TABLE products ADD COLUMN workshop_contact TEXT; -- 연락처

-- 외래키 제약조건 추가 (workshops 테이블과 연결)
-- SQLite에서는 ALTER TABLE로 외래키를 추가할 수 없으므로 주석으로 명시
-- FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_products_workshop ON products(workshop_id);
CREATE INDEX IF NOT EXISTS idx_products_location ON products(workshop_location);
