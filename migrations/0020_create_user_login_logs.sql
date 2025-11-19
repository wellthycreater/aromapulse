-- Migration: Create user login logs table
-- Date: 2025-11-19
-- Purpose: Track detailed user login activity including device, browser, OS, and time

CREATE TABLE IF NOT EXISTS user_login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  
  -- Device information
  device_type TEXT CHECK(device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  os TEXT,              -- Operating system (iOS, Android, Windows, macOS, Linux, etc.)
  browser TEXT,         -- Browser name (Chrome, Safari, Firefox, Edge, etc.)
  browser_version TEXT, -- Browser version
  
  -- Network information
  ip_address TEXT,
  user_agent TEXT,      -- Full user agent string
  
  -- Location (optional - can be derived from IP)
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Login details
  login_method TEXT CHECK(login_method IN ('email', 'oauth', 'kakao', 'naver', 'google')),
  login_status TEXT CHECK(login_status IN ('success', 'failed', 'blocked')) DEFAULT 'success',
  
  -- Timestamps
  login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Session info
  session_id TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_email ON user_login_logs(email);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_login_at ON user_login_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_device_type ON user_login_logs(device_type);
