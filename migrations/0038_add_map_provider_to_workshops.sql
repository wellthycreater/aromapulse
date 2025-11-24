-- Add map provider tracking for workshops
-- This allows workshops to be displayed on different map platforms based on user's login provider
-- 생성일: 2025-11-24

-- Add map_provider column to workshops table
-- Tracks which map platform(s) this workshop should appear on
ALTER TABLE workshops ADD COLUMN map_providers TEXT DEFAULT 'google,naver,kakao'; 
-- Format: comma-separated list (e.g., 'google,naver,kakao' or 'google' or 'naver,kakao')

-- Add Google Place ID for better integration with Google Maps
ALTER TABLE workshops ADD COLUMN google_place_id TEXT;

-- Add Naver Place ID
ALTER TABLE workshops ADD COLUMN naver_place_id TEXT;

-- Add Kakao Place ID
ALTER TABLE workshops ADD COLUMN kakao_place_id TEXT;

-- Create index for map provider filtering
CREATE INDEX IF NOT EXISTS idx_workshops_map_providers ON workshops(map_providers);
CREATE INDEX IF NOT EXISTS idx_workshops_google_place ON workshops(google_place_id);
CREATE INDEX IF NOT EXISTS idx_workshops_naver_place ON workshops(naver_place_id);
CREATE INDEX IF NOT EXISTS idx_workshops_kakao_place ON workshops(kakao_place_id);
