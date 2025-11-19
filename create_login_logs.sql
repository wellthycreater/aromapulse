CREATE TABLE IF NOT EXISTS user_login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  device_type TEXT CHECK(device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  os TEXT,
  browser TEXT,
  browser_version TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  login_method TEXT CHECK(login_method IN ('email', 'oauth', 'kakao', 'naver', 'google')),
  login_status TEXT CHECK(login_status IN ('success', 'failed', 'blocked')) DEFAULT 'success',
  login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_email ON user_login_logs(email);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_login_at ON user_login_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_device_type ON user_login_logs(device_type);
