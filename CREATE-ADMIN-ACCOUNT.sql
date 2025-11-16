-- ============================================
-- 프로덕션 관리자 계정 생성
-- 이메일: admin@aromapulse.kr
-- 비밀번호: admin123
-- ============================================

-- 기존 관리자 계정 삭제 (있을 경우)
DELETE FROM users WHERE email = 'admin@aromapulse.kr';

-- 새 관리자 계정 생성
-- 비밀번호 해시는 bcrypt로 'admin123'을 해시한 값
INSERT INTO users (
  email,
  password_hash,
  name,
  role,
  user_type,
  sub_type,
  created_at
) VALUES (
  'admin@aromapulse.kr',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye3IUdAvqC6V8Tt6d1SxhZ.wzXJXlxZLy',
  '아로마펄스 관리자',
  'admin',
  'B2B',
  'admin',
  datetime('now')
);

-- 결과 확인
SELECT id, email, name, role, user_type FROM users WHERE email = 'admin@aromapulse.kr';
