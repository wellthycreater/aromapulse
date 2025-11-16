#!/bin/bash

# 이미지 동기화 스크립트
# 로컬 DB에서 이미지 추출 → 프로덕션 업로드

echo "로컬 DB에서 이미지 데이터 추출 중..."

# 라벤더 수면 룸 스프레이 이미지 추출
SPRAY_THUMB=$(cd /home/user/webapp && npx wrangler d1 execute aromapulse-production --local --command="SELECT thumbnail_image FROM products WHERE id = 4;" --json | jq -r '.[0].results[0].thumbnail_image')

# 라벤더 수면 롤온 이미지 추출
ROLLON_THUMB=$(cd /home/user/webapp && npx wrangler d1 execute aromapulse-production --local --command="SELECT thumbnail_image FROM products WHERE id = 3;" --json | jq -r '.[0].results[0].thumbnail_image')

echo "이미지 추출 완료!"
echo "스프레이 이미지 크기: ${#SPRAY_THUMB}"
echo "롤온 이미지 크기: ${#ROLLON_THUMB}"

# 참고: 프로덕션 업로드는 관리자 페이지에서 수동으로 진행하세요
echo ""
echo "다음 단계:"
echo "1. https://www.aromapulse.kr/admin-products 접속"
echo "2. 각 제품 '수정' 버튼 클릭"
echo "3. 로컬 관리자 페이지(localhost:3000)에서 이미지 다운로드"
echo "4. 프로덕션 관리자 페이지에서 이미지 업로드"
