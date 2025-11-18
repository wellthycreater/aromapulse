-- 원데이 클래스 테이블
-- workshops 테이블과 유사하지만, 개인 예약 중심의 로컬 공방 클래스
CREATE TABLE IF NOT EXISTS oneday_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL, -- B2B 사용자 ID (공방 운영자)
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 아로마테라피 종류 (워크샵과 동일한 카테고리)
  location TEXT NOT NULL, -- 지역명 (예: 서울 강남구)
  address TEXT, -- 상세 주소
  
  -- 공방 정보
  studio_name TEXT, -- 공방명
  instructor_name TEXT, -- 강사명
  
  price INTEGER,
  duration INTEGER, -- 분 단위
  max_participants INTEGER, -- 최대 참가 인원
  image_url TEXT,
  
  -- 외부 지도 연동 (추후 구현)
  naver_place_id TEXT, -- 네이버 플레이스 ID
  kakao_place_id TEXT, -- 카카오맵 장소 ID
  google_place_id TEXT, -- 구글 맵 Place ID
  
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (provider_id) REFERENCES users(id)
);

-- 원데이 클래스 예약 테이블
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

-- 원데이 클래스 리뷰 테이블
CREATE TABLE IF NOT EXISTS oneday_class_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  booking_id INTEGER,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  source TEXT CHECK(source IN ('platform', 'blog', 'external')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (class_id) REFERENCES oneday_classes(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES oneday_class_bookings(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_oneday_classes_provider ON oneday_classes(provider_id);
CREATE INDEX IF NOT EXISTS idx_oneday_classes_active ON oneday_classes(is_active);
CREATE INDEX IF NOT EXISTS idx_oneday_classes_category ON oneday_classes(category);
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_user ON oneday_class_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_class ON oneday_class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_status ON oneday_class_bookings(status);
CREATE INDEX IF NOT EXISTS idx_oneday_class_bookings_date ON oneday_class_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_oneday_class_reviews_class ON oneday_class_reviews(class_id);
CREATE INDEX IF NOT EXISTS idx_oneday_class_reviews_user ON oneday_class_reviews(user_id);
