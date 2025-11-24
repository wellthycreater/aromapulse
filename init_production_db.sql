-- Cloudflare D1 Production Database Initialization
-- aromapulse-production

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profile_image TEXT,
  is_oauth INTEGER DEFAULT 0,
  user_type TEXT DEFAULT 'B2C',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. OAuth Accounts Table
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(provider, provider_user_id)
);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. OAuth States Table
CREATE TABLE IF NOT EXISTS oauth_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Oneday Classes Table
CREATE TABLE IF NOT EXISTS oneday_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT NOT NULL,
  address TEXT,
  studio_name TEXT,
  instructor_name TEXT,
  price INTEGER,
  duration INTEGER,
  max_participants INTEGER,
  image_url TEXT,
  naver_place_id TEXT,
  kakao_place_id TEXT,
  google_place_id TEXT,
  map_providers TEXT DEFAULT 'google,naver,kakao',
  latitude REAL,
  longitude REAL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id)
);

-- 6. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  oneday_class_id INTEGER,
  workshop_id INTEGER,
  booking_date DATETIME NOT NULL,
  participants INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  booker_name TEXT NOT NULL,
  booker_phone TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_oneday_classes_active ON oneday_classes(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_class ON bookings(oneday_class_id);
