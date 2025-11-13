-- Add refresh product type field to products table
-- This allows tracking specific refresh product types like fabric perfume, room spray, etc.

-- Add refresh_type column
ALTER TABLE products ADD COLUMN refresh_type TEXT CHECK(refresh_type IN ('fabric_perfume', 'room_spray', 'fabric_deodorizer', 'diffuser', 'candle', 'perfume', NULL));

-- Create index for refresh_type to improve query performance
CREATE INDEX IF NOT EXISTS idx_products_refresh_type ON products(refresh_type);

-- Create composite index for concept and refresh_type queries
CREATE INDEX IF NOT EXISTS idx_products_concept_refresh ON products(concept, refresh_type);
