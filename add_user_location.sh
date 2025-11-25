#!/bin/bash
# 프로덕션 DB에 user_location 컬럼 추가 스크립트

echo "=== 프로덕션 DB 마이그레이션 시작 ==="

echo "1. user_latitude 컬럼 추가..."
npx wrangler d1 execute aromapulse-production --remote --command="ALTER TABLE users ADD COLUMN user_latitude REAL;"

echo "2. user_longitude 컬럼 추가..."
npx wrangler d1 execute aromapulse-production --remote --command="ALTER TABLE users ADD COLUMN user_longitude REAL;"

echo "3. 인덱스 생성..."
npx wrangler d1 execute aromapulse-production --remote --command="CREATE INDEX IF NOT EXISTS idx_users_location ON users(user_latitude, user_longitude);"

echo "=== 마이그레이션 완료! ==="

# 검증
echo "4. users 테이블 스키마 확인..."
npx wrangler d1 execute aromapulse-production --remote --command="PRAGMA table_info(users);" | grep -E "user_latitude|user_longitude"
