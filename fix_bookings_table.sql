-- 원데이 클래스 예약 테이블 생성
-- 만약 테이블이 이미 존재하면 무시됨 (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS oneday_class_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL, -- B2C/B2B 개인 사용자 ID
  booking_date DATETIME NOT NULL, -- 예약한 클래스 일시
  participants INTEGER DEFAULT 1, -- 예약 인원
  total_price INTEGER,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  -- 예약자 정보
  booker_name TEXT,
  booker_phone TEXT,
  booker_email TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (class_id) REFERENCES oneday_classes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_user ON oneday_class_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_class ON oneday_class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_status ON oneday_class_bookings(status);
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_date ON oneday_class_bookings(booking_date);

-- 확인 쿼리
SELECT 'oneday_class_bookings 테이블 생성 완료' as status;
SELECT COUNT(*) as table_exists FROM sqlite_master WHERE type='table' AND name='oneday_class_bookings';
