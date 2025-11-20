-- Add location coordinates to workshops table
ALTER TABLE workshops ADD COLUMN latitude REAL;
ALTER TABLE workshops ADD COLUMN longitude REAL;
ALTER TABLE workshops ADD COLUMN detailed_address TEXT;
ALTER TABLE workshops ADD COLUMN postal_code TEXT;
ALTER TABLE workshops ADD COLUMN contact_phone TEXT;
ALTER TABLE workshops ADD COLUMN contact_email TEXT;

-- Create workshop_schedules table for available booking slots
CREATE TABLE IF NOT EXISTS workshop_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 1,
  booked_slots INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
);

-- Create workshop_bookings table (enhanced version)
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  schedule_id INTEGER,
  user_id INTEGER NOT NULL,
  
  -- Booking details
  booking_date DATE NOT NULL,
  booking_time TIME,
  num_participants INTEGER DEFAULT 1,
  
  -- Customer information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  
  -- Special requests
  special_requests TEXT,
  
  -- Pricing
  price_per_person INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  
  -- Status management
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending',      -- 예약 대기
    'confirmed',    -- 예약 확정
    'cancelled',    -- 취소됨
    'completed',    -- 완료됨
    'no_show'       -- 노쇼
  )),
  
  -- Payment info
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN (
    'pending',      -- 결제 대기
    'paid',         -- 결제 완료
    'refunded'      -- 환불됨
  )),
  payment_method TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  cancelled_at DATETIME,
  completed_at DATETIME,
  
  -- Cancellation info
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK(cancelled_by IN ('user', 'provider', 'admin', NULL)),
  
  -- iCalendar tracking
  icalendar_uid TEXT UNIQUE,
  icalendar_downloaded INTEGER DEFAULT 0,
  icalendar_downloaded_at DATETIME,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES workshop_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create booking_reminders table
CREATE TABLE IF NOT EXISTS booking_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  reminder_type TEXT NOT NULL CHECK(reminder_type IN ('email', 'sms', 'push')),
  reminder_time DATETIME NOT NULL,
  sent INTEGER DEFAULT 0,
  sent_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES workshop_bookings(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workshops_location ON workshops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_workshops_region ON workshops(location);
CREATE INDEX IF NOT EXISTS idx_workshop_schedules_workshop ON workshop_schedules(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_schedules_date ON workshop_schedules(available_date);
CREATE INDEX IF NOT EXISTS idx_workshop_schedules_available ON workshop_schedules(is_available);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_workshop ON workshop_bookings(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_user ON workshop_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_status ON workshop_bookings(status);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_date ON workshop_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_schedule ON workshop_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking ON booking_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent ON booking_reminders(sent);
