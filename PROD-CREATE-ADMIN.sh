#!/bin/bash
# 프로덕션 DB에 관리자 계정 생성 스크립트

cd /home/user/webapp

echo "=== 1. 기존 관리자 계정 삭제 ==="
npx wrangler d1 execute aromapulse-production --remote \
  --command="DELETE FROM users WHERE email = 'admin@aromapulse.kr';"

echo ""
echo "=== 2. 관리자 계정 생성 ==="
npx wrangler d1 execute aromapulse-production --remote \
  --command="INSERT INTO users (email, password_hash, name, role, user_type, oauth_provider, is_oauth, is_active, created_at) VALUES ('admin@aromapulse.kr', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', '아로마펄스 관리자', 'admin', 'B2B', 'email', 0, 1, datetime('now'));"

echo ""
echo "=== 3. 계정 생성 확인 ==="
npx wrangler d1 execute aromapulse-production --remote \
  --command="SELECT id, email, name, role, oauth_provider FROM users WHERE email = 'admin@aromapulse.kr';"
