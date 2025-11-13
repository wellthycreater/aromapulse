-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- NULL for OAuth users
  name TEXT NOT NULL,
  phone TEXT,
  
  -- 사용자 타입
  user_type TEXT NOT NULL CHECK(user_type IN ('B2C', 'B2B')),
  
  -- B2C 세부 분류
  b2c_category TEXT CHECK(b2c_category IN ('daily_stress', 'work_stress', NULL)),
  b2c_subcategory TEXT, -- 학생/취준생/돌봄인 또는 9개 산업군
  
  -- B2B 세부 분류
  b2b_category TEXT CHECK(b2b_category IN ('perfumer', 'company', 'shop', 'independent', NULL)),
  b2b_business_name TEXT,
  b2b_business_number TEXT,
  b2b_address TEXT,
  
  -- OAuth 정보
  oauth_provider TEXT CHECK(oauth_provider IN ('naver', 'kakao', 'google', 'email', NULL)),
  oauth_id TEXT,
  
  -- 메타 정보
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active INTEGER DEFAULT 1,
  
  UNIQUE(oauth_provider, oauth_id)
);

-- 워크샵 테이블
CREATE TABLE IF NOT EXISTS workshops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL, -- B2B 사용자 ID
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 아로마테라피 종류
  location TEXT NOT NULL,
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

-- 워크샵 예약 테이블
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL, -- B2C 사용자 ID
  booking_date DATETIME NOT NULL,
  participants INTEGER DEFAULT 1,
  total_price INTEGER,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  booking_id INTEGER,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  source TEXT CHECK(source IN ('platform', 'blog', 'external')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 사용자 행동 로그 테이블 (행동 예측용)
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  activity_type TEXT NOT NULL, -- 'view', 'search', 'bookmark', 'booking'
  target_type TEXT, -- 'workshop', 'review', 'profile'
  target_id INTEGER,
  metadata TEXT, -- JSON 형식
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_workshops_provider ON workshops(provider_id);
CREATE INDEX IF NOT EXISTS idx_workshops_active ON workshops(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_workshop ON bookings(workshop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_workshop ON reviews(workshop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_logs(activity_type);
