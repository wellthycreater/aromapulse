-- 아로마펄스 향상된 스키마 (증상케어 vs 리프레시, B2C/B2B 세부 구분)
-- 생성일: 2025-11-13

-- users 테이블에 B2C/B2B 세부 컬럼 추가
ALTER TABLE users ADD COLUMN b2c_stress_type TEXT CHECK(b2c_stress_type IN ('daily', 'work', NULL));
ALTER TABLE users ADD COLUMN b2b_business_type TEXT CHECK(b2b_business_type IN ('perfumer', 'company', 'shop', NULL));

-- products 테이블에 컨셉 구분 컬럼 추가 (stock, detail_image는 이미 존재하므로 제외)
ALTER TABLE products ADD COLUMN concept TEXT NOT NULL DEFAULT 'symptom_care' CHECK(concept IN ('symptom_care', 'refresh'));
ALTER TABLE products ADD COLUMN care_type TEXT CHECK(care_type IN ('custom', 'ready_made', NULL));
ALTER TABLE products ADD COLUMN brand TEXT; -- 공방명 또는 '아로마펄스'
ALTER TABLE products ADD COLUMN volume TEXT; -- 30ml, 50ml, 100ml
ALTER TABLE products ADD COLUMN main_image TEXT; -- 대표 이미지 URL (썸네일과 다른 추가 이미지)
ALTER TABLE products ADD COLUMN b2b_available INTEGER DEFAULT 0; -- B2B 가능 여부

-- 공방/워크숍 테이블은 0001_initial_schema.sql에 이미 존재
-- CREATE TABLE IF NOT EXISTS workshops (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL,
--   region TEXT NOT NULL,
--   type TEXT, -- '체험형', '납품형', '협업형'
--   description TEXT,
--   contact_email TEXT,
--   contact_phone TEXT,
--   address TEXT,
--   website TEXT,
--   image_url TEXT,
--   status TEXT DEFAULT 'active',
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- reviews 테이블에 출처 구분 추가 (source는 이미 존재하므로 제외)
ALTER TABLE reviews ADD COLUMN source_url TEXT;
ALTER TABLE reviews ADD COLUMN auto_user_type TEXT CHECK(auto_user_type IN ('B2C', 'B2B', NULL));

-- 제품-공방 연결 테이블
CREATE TABLE IF NOT EXISTS product_workshops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  workshop_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  UNIQUE(product_id, workshop_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_products_concept ON products(concept);
CREATE INDEX IF NOT EXISTS idx_products_care_type ON products(care_type);
-- CREATE INDEX IF NOT EXISTS idx_workshops_region ON workshops(region); -- region 컬럼 없음
CREATE INDEX IF NOT EXISTS idx_users_b2c_stress ON users(b2c_stress_type);
CREATE INDEX IF NOT EXISTS idx_users_b2b_business ON users(b2b_business_type);
