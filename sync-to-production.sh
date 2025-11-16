#!/bin/bash
# 로컬 DB의 제품을 프로덕션 DB로 동기화하는 스크립트

echo "🔄 로컬 → 프로덕션 DB 동기화 시작..."
echo ""

# 1. 로컬 DB에서 제품 목록 가져오기
echo "📦 로컬 DB 제품 조회 중..."
LOCAL_PRODUCTS=$(npx wrangler d1 execute aromapulse-production --local --command="SELECT id, name, description, concept, category, refresh_type, volume, items_per_box, price, stock, thumbnail_image, detail_image, workshop_name, workshop_location, workshop_address, workshop_contact, is_active, fulfillment_type FROM products;" --json 2>/dev/null | jq -r '.[] | .results')

echo "로컬 제품 개수: $(echo "$LOCAL_PRODUCTS" | jq '. | length')"
echo ""

# 2. SQL 생성 (Cloudflare D1 Console에서 실행할 SQL)
echo "📝 프로덕션 DB 동기화 SQL 생성 중..."
cat > /home/user/webapp/SYNC-TO-PRODUCTION.sql << 'EOF'
-- ====================================
-- 로컬 → 프로덕션 DB 동기화 SQL
-- ====================================
-- Cloudflare D1 Console에서 실행:
-- https://dash.cloudflare.com → D1 → aromapulse-production → Console
-- ====================================

-- 1. 기존 프로덕션 제품 모두 삭제
DELETE FROM products;

EOF

# 3. 로컬 제품 데이터를 INSERT 문으로 변환
echo "$LOCAL_PRODUCTS" | jq -r '.[] | 
"-- 제품: \(.name)
INSERT INTO products (name, description, concept, category, refresh_type, volume, items_per_box, price, stock, thumbnail_image, detail_image, workshop_name, workshop_location, workshop_address, workshop_contact, is_active, fulfillment_type, created_at, updated_at) 
VALUES (\"\(.name)\", \"\(.description // "")\", \"\(.concept)\", \"\(.category // "")\", \"\(.refresh_type // "")\", \"\(.volume // "")\", \(.items_per_box // 2), \(.price), \(.stock), \"\(.thumbnail_image // "")\", \"\(.detail_image // "")\", \"\(.workshop_name // "")\", \"\(.workshop_location // "")\", \"\(.workshop_address // "")\", \"\(.workshop_contact // "")\", \(.is_active), \"\(.fulfillment_type)\", datetime(\"now\"), datetime(\"now\"));
"' >> /home/user/webapp/SYNC-TO-PRODUCTION.sql

cat >> /home/user/webapp/SYNC-TO-PRODUCTION.sql << 'EOF'

-- 동기화 완료 확인
SELECT id, name, price, stock, concept FROM products ORDER BY id;
EOF

echo "✅ SQL 파일 생성 완료: /home/user/webapp/SYNC-TO-PRODUCTION.sql"
echo ""
echo "📋 다음 단계:"
echo "1. Cloudflare D1 Console 접속: https://dash.cloudflare.com"
echo "2. Workers & Pages → D1 → aromapulse-production → Console"
echo "3. SYNC-TO-PRODUCTION.sql 파일의 내용을 복사해서 실행"
echo ""
echo "🎉 실행 후 사용자 페이지를 새로고침하면 동기화됩니다!"
