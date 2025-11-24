-- Add latitude and longitude to oneday_classes table
-- 생성일: 2025-11-24

ALTER TABLE oneday_classes ADD COLUMN latitude REAL;
ALTER TABLE oneday_classes ADD COLUMN longitude REAL;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_oneday_classes_location ON oneday_classes(latitude, longitude);
