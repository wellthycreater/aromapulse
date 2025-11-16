-- ============================================
-- 프로덕션 관리자 계정 업데이트 (간단한 방법)
-- 이메일: admin@aromapulse.kr
-- 비밀번호: admin123
-- ============================================

-- 기존 계정이 있으면 업데이트, 없으면 삽입
INSERT OR REPLACE INTO users (
  id,
  email,
  password_hash,
  name,
  user_type,
  sub_type,
  is_active
) VALUES (
  (SELECT id FROM users WHERE email = 'admin@aromapulse.kr'),
  'admin@aromapulse.kr',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye3IUdAvqC6V8Tt6d1SxhZ.wzXJXlxZLy',
  '아로마펄스 관리자',
  'B2B',
  'admin',
  1
);

-- 결과 확인
SELECT id, email, name, user_type, sub_type FROM users WHERE email = 'admin@aromapulse.kr';
