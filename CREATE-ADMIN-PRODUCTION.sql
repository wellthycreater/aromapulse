-- ============================================
-- 프로덕션 DB에 관리자 계정 생성
-- 이메일: admin@aromapulse.kr
-- 비밀번호: admin123
-- ============================================

-- 기존 관리자 계정 삭제 (있을 경우)
DELETE FROM users WHERE email = 'admin@aromapulse.kr';

-- 새 관리자 계정 생성 (oauth_provider='email' 추가)
INSERT INTO users (
  email,
  password_hash,
  name,
  role,
  user_type,
  oauth_provider,
  is_oauth,
  is_active,
  created_at
) VALUES (
  'admin@aromapulse.kr',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye3IUdAvqC6V8Tt6d1SxhZ.wzXJXlxZLy',
  '아로마펄스 관리자',
  'admin',
  'B2B',
  'email',
  0,
  1,
  datetime('now')
);

-- 결과 확인
SELECT id, email, name, role, user_type, oauth_provider FROM users WHERE email = 'admin@aromapulse.kr';
