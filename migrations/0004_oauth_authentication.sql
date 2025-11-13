-- OAuth 인증 및 JWT 토큰 관리
-- 생성일: 2025-11-13

-- OAuth 연동 계정 테이블
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('naver', 'google', 'kakao')),
  provider_user_id TEXT NOT NULL, -- 각 플랫폼의 고유 사용자 ID
  email TEXT,
  name TEXT,
  profile_image TEXT,
  access_token TEXT, -- 암호화 권장
  refresh_token TEXT, -- 암호화 권장
  token_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);

-- 세션/토큰 테이블 (JWT 관리)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OAuth 상태 관리 (CSRF 방지)
CREATE TABLE IF NOT EXISTS oauth_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  redirect_uri TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
