-- Add map provider tracking for oneday classes
-- This allows classes to be displayed on different map platforms based on user's login provider
-- 생성일: 2025-11-24

-- Add map_provider column to oneday_classes table
ALTER TABLE oneday_classes ADD COLUMN map_providers TEXT DEFAULT 'google,naver,kakao';

-- Add Google Place ID
ALTER TABLE oneday_classes ADD COLUMN google_place_id TEXT;

-- Add Naver Place ID
ALTER TABLE oneday_classes ADD COLUMN naver_place_id TEXT;

-- Add Kakao Place ID
ALTER TABLE oneday_classes ADD COLUMN kakao_place_id TEXT;

-- Add latitude and longitude if not exists
-- (Check if columns exist first - these might have been added in previous migrations)
-- ALTER TABLE oneday_classes ADD COLUMN latitude REAL;
-- ALTER TABLE oneday_classes ADD COLUMN longitude REAL;
-- ALTER TABLE oneday_classes ADD COLUMN address TEXT;

-- Create index for map provider filtering
CREATE INDEX IF NOT EXISTS idx_oneday_classes_map_providers ON oneday_classes(map_providers);
CREATE INDEX IF NOT EXISTS idx_oneday_classes_google_place ON oneday_classes(google_place_id);
CREATE INDEX IF NOT EXISTS idx_oneday_classes_naver_place ON oneday_classes(naver_place_id);
CREATE INDEX IF NOT EXISTS idx_oneday_classes_kakao_place ON oneday_classes(kakao_place_id);
