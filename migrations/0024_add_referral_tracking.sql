-- Add referral source tracking for SNS channels and conversion tracking

-- Add referral_source to visitors table
ALTER TABLE visitors ADD COLUMN referral_source TEXT CHECK(referral_source IN ('blog', 'instagram', 'youtube', 'google', 'direct', 'other', NULL));
ALTER TABLE visitors ADD COLUMN utm_source TEXT;
ALTER TABLE visitors ADD COLUMN utm_medium TEXT;
ALTER TABLE visitors ADD COLUMN utm_campaign TEXT;

-- Create SNS referral stats table
CREATE TABLE IF NOT EXISTS sns_referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referral_source TEXT NOT NULL CHECK(referral_source IN ('blog', 'instagram', 'youtube', 'google', 'direct', 'other')),
  visit_date DATE NOT NULL,
  visitor_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referral_source, visit_date)
);

-- Create online to offline conversion tracking table
CREATE TABLE IF NOT EXISTS conversion_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  visitor_session_id TEXT,
  referral_source TEXT CHECK(referral_source IN ('blog', 'instagram', 'youtube', 'google', 'direct', 'other', NULL)),
  conversion_type TEXT NOT NULL CHECK(conversion_type IN ('workshop_booking', 'class_booking', 'workshop_inquiry', 'purchase')),
  workshop_id INTEGER,
  booking_id INTEGER,
  order_id INTEGER,
  conversion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (workshop_id) REFERENCES workshops(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sns_referrals_source ON sns_referrals(referral_source);
CREATE INDEX IF NOT EXISTS idx_sns_referrals_date ON sns_referrals(visit_date);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_user ON conversion_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_source ON conversion_tracking(referral_source);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_type ON conversion_tracking(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_date ON conversion_tracking(conversion_date);
CREATE INDEX IF NOT EXISTS idx_visitors_referral ON visitors(referral_source);
