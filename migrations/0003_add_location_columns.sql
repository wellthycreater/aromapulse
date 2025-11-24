-- Add latitude and longitude columns to oneday_classes table
ALTER TABLE oneday_classes ADD COLUMN latitude REAL;
ALTER TABLE oneday_classes ADD COLUMN longitude REAL;
ALTER TABLE oneday_classes ADD COLUMN google_place_id TEXT;

-- Create index on google_place_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_oneday_classes_google_place_id ON oneday_classes(google_place_id);
