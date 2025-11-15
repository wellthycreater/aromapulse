-- Migration: Add items_per_box column to products table
-- Description: Add items per box information for refresh products (default: 2)
-- Date: 2025-11-15

-- Add items_per_box column (for refresh products, default 2 items per box)
ALTER TABLE products ADD COLUMN items_per_box INTEGER DEFAULT 2;

-- Add comment for clarity
-- items_per_box: Number of items included in one box (e.g., 2 bottles per box for refresh products)
