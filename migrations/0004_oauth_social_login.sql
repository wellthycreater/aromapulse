-- OAuth 소셜 로그인 지원 추가
-- 생성일: 2025-11-13

-- users 테이블에 OAuth 관련 컬럼 추가
ALTER TABLE users ADD COLUMN oauth_provider TEXT CHECK(oauth_provider IN ('naver', 'google', 'kakao', NULL)); -- OAuth 제공자
ALTER TABLE users ADD COLUMN oauth_id TEXT; -- OAuth 제공자의 사용자 고유 ID
ALTER TABLE users ADD COLUMN profile_image TEXT; -- 프로필 이미지 URL
ALTER TABLE users ADD COLUMN is_oauth INTEGER DEFAULT 0; -- OAuth 로그인 여부 (0: 일반, 1: OAuth)

-- OAuth 계정 연결 테이블 (하나의 계정에 여러 OAuth 연결 가능)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('naver', 'google', 'kakao')),
  provider_user_id TEXT NOT NULL, -- OAuth 제공자의 사용자 ID
  provider_email TEXT,
  provider_name TEXT,
  profile_image TEXT,
  access_token TEXT, -- 암호화 저장 권장
  refresh_token TEXT, -- 암호화 저장 권장
  token_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);

-- 세션 테이블 (JWT 토큰 블랙리스트 관리용)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL, -- JWT 토큰
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- users 테이블 password 컬럼을 NULL 허용으로 변경 (OAuth 전용 계정용)
-- SQLite는 ALTER COLUMN을 지원하지 않으므로, 새 마이그레이션에서는 체크만 수행
-- 이미 생성된 테이블의 password는 OAuth 사용자의 경우 빈 문자열 또는 랜덤 값 저장

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider ON users(oauth_provider);
CREATE INDEX IF NOT EXISTS idx_users_oauth_id ON users(oauth_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
