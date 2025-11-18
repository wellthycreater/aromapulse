-- 원데이 클래스 테이블
CREATE TABLE IF NOT EXISTS oneday_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL, -- B2B 사용자 ID (공방 운영자)
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 아로마테라피 종류
  location TEXT NOT NULL, -- 공방 이름
  address TEXT,
  price INTEGER,
  duration INTEGER, -- 분 단위
  max_participants INTEGER,
  image_url TEXT,
  
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (provider_id) REFERENCES users(id)
);

-- 원데이 클래스 예약 테이블 (기존 bookings 테이블 확장)
-- bookings 테이블에 oneday_class_id 컬럼 추가
ALTER TABLE bookings ADD COLUMN oneday_class_id INTEGER;
ALTER TABLE bookings ADD COLUMN booking_type TEXT DEFAULT 'workshop' CHECK(booking_type IN ('workshop', 'oneday_class'));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_oneday_classes_provider ON oneday_classes(provider_id);
CREATE INDEX IF NOT EXISTS idx_oneday_classes_active ON oneday_classes(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_oneday_class ON bookings(oneday_class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
