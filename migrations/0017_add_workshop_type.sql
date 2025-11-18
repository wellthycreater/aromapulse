-- Add type column to distinguish between workshops (B2B) and classes (B2C)
-- Type: 'workshop' = B2B 기업 전용, 'class' = 누구나 참여 가능

-- Add type column with default 'class'
ALTER TABLE workshops ADD COLUMN type TEXT DEFAULT 'class';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_workshops_type ON workshops(type);

-- Update existing data
-- Currently all data are classes, so they already have correct default value 'class'
