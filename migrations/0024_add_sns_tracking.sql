-- Add SNS channel tracking and online-to-offline conversion tracking

-- Add referral source field to users table (to track where they came from)
ALTER TABLE users ADD COLUMN referral_source TEXT CHECK(referral_source IN ('direct', 'blog', 'instagram', 'youtube', 'kakao', 'naver', 'google', 'other', NULL));

-- Create SNS channel visits tracking table
CREATE TABLE IF NOT EXISTS sns_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL CHECK(channel IN ('blog', 'instagram', 'youtube')),
  visit_date DATE NOT NULL,
  visitor_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  click_through INTEGER DEFAULT 0, -- Number of clicks to main website
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create online-to-offline conversion tracking table
CREATE TABLE IF NOT EXISTS o2o_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  workshop_id INTEGER,
  booking_id INTEGER,
  referral_source TEXT CHECK(referral_source IN ('blog', 'instagram', 'youtube', 'direct', 'other')),
  conversion_type TEXT CHECK(conversion_type IN ('workshop_booking', 'class_booking', 'consultation', 'store_visit')),
  workshop_location TEXT, -- 로컬 공방 위치
  conversion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount INTEGER, -- 예약 금액
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (workshop_id) REFERENCES workshops(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sns_visits_channel ON sns_visits(channel);
CREATE INDEX IF NOT EXISTS idx_sns_visits_date ON sns_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_o2o_conversions_source ON o2o_conversions(referral_source);
CREATE INDEX IF NOT EXISTS idx_o2o_conversions_date ON o2o_conversions(conversion_date DESC);
CREATE INDEX IF NOT EXISTS idx_o2o_conversions_user ON o2o_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_source);
