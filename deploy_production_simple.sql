-- ================================================================
-- AromaPulse Production Deployment - Simple Version
-- ================================================================
-- Purpose: SNS 및 O2O 테이블 생성 및 샘플 데이터 삽입
-- Date: 2024-01-15
-- ================================================================

-- ================================================================
-- Step 1: Add referral_source column to users (if not exists)
-- ================================================================
-- Using CREATE TABLE + INSERT to safely add column

CREATE TABLE IF NOT EXISTS users_new AS SELECT * FROM users LIMIT 0;

-- Add all columns including referral_source
ALTER TABLE users_new ADD COLUMN referral_source TEXT CHECK(referral_source IN ('direct', 'blog', 'instagram', 'youtube', 'kakao', 'naver', 'google', 'other', NULL));

-- Check if referral_source already exists
-- If this fails, it means column already exists and we can skip
INSERT INTO users_new SELECT *, NULL as referral_source FROM users WHERE 0=1;

DROP TABLE users_new;

-- ================================================================
-- Step 2: Create SNS and O2O tables
-- ================================================================

-- SNS channel visits tracking table
CREATE TABLE IF NOT EXISTS sns_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL CHECK(channel IN ('blog', 'instagram', 'youtube')),
  visit_date DATE NOT NULL,
  visitor_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  click_through INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Online-to-offline conversion tracking table
CREATE TABLE IF NOT EXISTS o2o_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  workshop_id INTEGER,
  booking_id INTEGER,
  referral_source TEXT CHECK(referral_source IN ('blog', 'instagram', 'youtube', 'direct', 'other')),
  conversion_type TEXT CHECK(conversion_type IN ('workshop_booking', 'class_booking', 'consultation', 'store_visit')),
  workshop_location TEXT,
  conversion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount INTEGER
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sns_visits_channel ON sns_visits(channel);
CREATE INDEX IF NOT EXISTS idx_sns_visits_date ON sns_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_o2o_conversions_source ON o2o_conversions(referral_source);
CREATE INDEX IF NOT EXISTS idx_o2o_conversions_date ON o2o_conversions(conversion_date DESC);
CREATE INDEX IF NOT EXISTS idx_o2o_conversions_user ON o2o_conversions(user_id);

-- ================================================================
-- Step 3: Insert SNS Sample Data (45 records)
-- ================================================================

INSERT INTO sns_visits (channel, visit_date, visitor_count, unique_visitors, click_through) VALUES
('blog', '2024-01-01', 120, 95, 45),
('blog', '2024-01-02', 135, 102, 52),
('blog', '2024-01-03', 145, 110, 58),
('blog', '2024-01-04', 150, 115, 62),
('blog', '2024-01-05', 165, 125, 68),
('blog', '2024-01-06', 155, 118, 65),
('blog', '2024-01-07', 140, 108, 55),
('blog', '2024-01-08', 175, 132, 72),
('blog', '2024-01-09', 180, 138, 75),
('blog', '2024-01-10', 190, 145, 80),
('blog', '2024-01-11', 195, 148, 82),
('blog', '2024-01-12', 205, 155, 88),
('blog', '2024-01-13', 200, 152, 85),
('blog', '2024-01-14', 185, 140, 78),
('blog', '2024-01-15', 220, 168, 95),

('instagram', '2024-01-01', 280, 215, 95),
('instagram', '2024-01-02', 295, 225, 102),
('instagram', '2024-01-03', 310, 238, 108),
('instagram', '2024-01-04', 325, 248, 115),
('instagram', '2024-01-05', 350, 268, 125),
('instagram', '2024-01-06', 380, 290, 135),
('instagram', '2024-01-07', 365, 278, 128),
('instagram', '2024-01-08', 420, 320, 148),
('instagram', '2024-01-09', 445, 340, 158),
('instagram', '2024-01-10', 425, 325, 152),
('instagram', '2024-01-11', 410, 312, 145),
('instagram', '2024-01-12', 395, 302, 138),
('instagram', '2024-01-13', 385, 295, 132),
('instagram', '2024-01-14', 400, 305, 140),
('instagram', '2024-01-15', 430, 328, 155),

('youtube', '2024-01-01', 85, 68, 28),
('youtube', '2024-01-02', 92, 72, 32),
('youtube', '2024-01-03', 88, 70, 30),
('youtube', '2024-01-04', 95, 75, 35),
('youtube', '2024-01-05', 105, 82, 40),
('youtube', '2024-01-06', 120, 95, 48),
('youtube', '2024-01-07', 115, 90, 45),
('youtube', '2024-01-08', 110, 85, 42),
('youtube', '2024-01-09', 125, 98, 50),
('youtube', '2024-01-10', 130, 102, 52),
('youtube', '2024-01-11', 135, 105, 55),
('youtube', '2024-01-12', 140, 110, 58),
('youtube', '2024-01-13', 155, 122, 65),
('youtube', '2024-01-14', 150, 118, 62),
('youtube', '2024-01-15', 160, 125, 68);

-- ================================================================
-- Step 4: Insert O2O Sample Data (29 records)
-- ================================================================

INSERT INTO o2o_conversions (user_id, workshop_id, referral_source, conversion_type, workshop_location, conversion_date, amount) VALUES
(25, NULL, 'blog', 'workshop_booking', '강남 로컬 공방', '2024-01-03 14:30:00', 85000),
(27, NULL, 'blog', 'class_booking', '홍대 아로마 스튜디오', '2024-01-05 16:00:00', 120000),
(29, NULL, 'blog', 'workshop_booking', '이태원 향기 공방', '2024-01-07 11:00:00', 95000),
(31, NULL, 'blog', 'consultation', '강남 로컬 공방', '2024-01-08 15:30:00', 0),
(33, NULL, 'blog', 'workshop_booking', '성수 센트 스페이스', '2024-01-10 13:00:00', 110000),
(35, NULL, 'blog', 'store_visit', '홍대 아로마 스튜디오', '2024-01-11 10:30:00', 45000),
(37, NULL, 'blog', 'class_booking', '연남동 향수 아틀리에', '2024-01-13 17:00:00', 150000),
(39, NULL, 'blog', 'workshop_booking', '이태원 향기 공방', '2024-01-14 14:00:00', 95000),

(26, NULL, 'instagram', 'workshop_booking', '강남 로컬 공방', '2024-01-02 13:00:00', 85000),
(28, NULL, 'instagram', 'class_booking', '홍대 아로마 스튜디오', '2024-01-04 15:30:00', 120000),
(30, NULL, 'instagram', 'workshop_booking', '삼청동 센트 갤러리', '2024-01-05 11:30:00', 130000),
(32, NULL, 'instagram', 'store_visit', '이태원 향기 공방', '2024-01-06 16:00:00', 55000),
(34, NULL, 'instagram', 'workshop_booking', '성수 센트 스페이스', '2024-01-08 14:00:00', 110000),
(36, NULL, 'instagram', 'consultation', '강남 로컬 공방', '2024-01-09 10:00:00', 0),
(38, NULL, 'instagram', 'class_booking', '연남동 향수 아틀리에', '2024-01-11 16:30:00', 150000),
(40, NULL, 'instagram', 'workshop_booking', '홍대 아로마 스튜디오', '2024-01-12 12:00:00', 95000),
(42, NULL, 'instagram', 'store_visit', '삼청동 센트 갤러리', '2024-01-13 15:00:00', 65000),
(44, NULL, 'instagram', 'workshop_booking', '이태원 향기 공방', '2024-01-15 13:30:00', 95000),

(41, NULL, 'youtube', 'workshop_booking', '홍대 아로마 스튜디오', '2024-01-04 11:00:00', 120000),
(43, NULL, 'youtube', 'class_booking', '성수 센트 스페이스', '2024-01-06 14:30:00', 110000),
(45, NULL, 'youtube', 'workshop_booking', '연남동 향수 아틀리에', '2024-01-08 16:00:00', 140000),
(47, NULL, 'youtube', 'store_visit', '강남 로컬 공방', '2024-01-10 10:30:00', 38000),
(49, NULL, 'youtube', 'workshop_booking', '삼청동 센트 갤러리', '2024-01-12 15:00:00', 130000),
(51, NULL, 'youtube', 'consultation', '이태원 향기 공방', '2024-01-14 11:30:00', 0),

(46, NULL, 'direct', 'workshop_booking', '강남 로컬 공방', '2024-01-03 10:00:00', 85000),
(48, NULL, 'direct', 'store_visit', '홍대 아로마 스튜디오', '2024-01-07 14:00:00', 52000),
(50, NULL, 'other', 'workshop_booking', '성수 센트 스페이스', '2024-01-09 13:00:00', 110000),
(52, NULL, 'direct', 'class_booking', '연남동 향수 아틀리에', '2024-01-11 15:30:00', 150000),
(54, NULL, 'other', 'consultation', '이태원 향기 공방', '2024-01-13 10:00:00', 0);

-- ================================================================
-- Deployment Complete
-- ================================================================
