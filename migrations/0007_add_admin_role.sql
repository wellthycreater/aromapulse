-- 관리자 역할 추가
-- 생성일: 2025-11-13

-- users 테이블에 role 컬럼 추가
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'super_admin'));

-- 기존 사용자들은 모두 'user' 역할로 설정 (이미 DEFAULT로 설정됨)

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
