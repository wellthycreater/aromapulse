-- Make category column nullable to support both symptom_care and refresh products
-- Symptom care products require category, but refresh products use refresh_type instead

-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table

-- Step 1: Create new table with nullable category
CREATE TABLE products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,  -- Changed from NOT NULL to nullable
  price INTEGER NOT NULL,
  thumbnail_image TEXT,
  detail_image TEXT,
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  concept TEXT NOT NULL DEFAULT 'symptom_care' CHECK(concept IN ('symptom_care', 'refresh')),
  care_type TEXT CHECK(care_type IN ('custom', 'ready_made', NULL)),
  brand TEXT,
  volume TEXT,
  main_image TEXT,
  b2b_available INTEGER DEFAULT 0,
  workshop_id INTEGER,
  workshop_name TEXT,
  workshop_location TEXT,
  workshop_address TEXT,
  workshop_contact TEXT,
  refresh_type TEXT CHECK(refresh_type IN ('fabric_perfume', 'room_spray', 'fabric_deodorizer', 'diffuser', 'candle', 'perfume', NULL)),
  items_per_box INTEGER DEFAULT 2
);

-- Step 2: Copy data from old table
INSERT INTO products_new SELECT * FROM products;

-- Step 3: Drop old table
DROP TABLE products;

-- Step 4: Rename new table
ALTER TABLE products_new RENAME TO products;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_refresh_type ON products(refresh_type);
CREATE INDEX IF NOT EXISTS idx_products_concept_refresh ON products(concept, refresh_type);
