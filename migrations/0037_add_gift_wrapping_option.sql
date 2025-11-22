-- Migration: Add gift wrapping option for one-day classes
-- Date: 2025-11-21
-- Description: Add is_gift_wrapping column to workshop_quotes table

-- Add gift wrapping option column
ALTER TABLE workshop_quotes ADD COLUMN is_gift_wrapping INTEGER DEFAULT 0;

-- Update index for better query performance
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_options 
ON workshop_quotes(is_workation, is_gift_wrapping);
