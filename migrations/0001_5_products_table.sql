-- Products table for symptom care items
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'insomnia', 'depression', 'anxiety', etc.
  price INTEGER NOT NULL,
  thumbnail_image TEXT,    -- 대표 이미지 URL
  detail_image TEXT,       -- 상세 이미지 URL (일체형)
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Index for active products
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
