-- ============================================
-- 관리자 비밀번호를 SHA-256 해시로 변경
-- 비밀번호: admin123
-- ============================================

UPDATE users 
SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
WHERE email = 'admin@aromapulse.kr';

-- 결과 확인
SELECT email, password_hash, oauth_provider, role FROM users WHERE email = 'admin@aromapulse.kr';
