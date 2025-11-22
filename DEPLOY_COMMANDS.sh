#!/bin/bash
# Production Deployment Commands
# 프로덕션 배포 명령어 모음

echo "🚀 AromaPulse 프로덕션 배포"
echo "======================================"
echo ""

# 1. Git 상태 확인
echo "📋 1단계: Git 상태 확인"
git status
git log --oneline -3
echo ""
read -p "최신 커밋이 맞습니까? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ 배포 중단"
    exit 1
fi

# 2. 빌드
echo ""
echo "🔨 2단계: 프로덕션 빌드"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패"
    exit 1
fi
echo "✅ 빌드 성공"

# 3. Cloudflare 인증 확인
echo ""
echo "🔑 3단계: Cloudflare 인증 확인"
npx wrangler whoami
if [ $? -ne 0 ]; then
    echo "❌ Cloudflare 인증 실패"
    echo "💡 Deploy 탭에서 API Key를 설정해주세요"
    exit 1
fi
echo "✅ 인증 확인 완료"

# 4. 배포 전 확인
echo ""
echo "📦 4단계: 배포 준비 완료"
echo "프로젝트: aromapulse"
echo "배포 대상: Cloudflare Pages Production"
echo ""
read -p "배포를 진행하시겠습니까? (y/n): " deploy_confirm
if [ "$deploy_confirm" != "y" ]; then
    echo "❌ 배포 중단"
    exit 1
fi

# 5. Cloudflare Pages 배포
echo ""
echo "🚀 5단계: Cloudflare Pages 배포 중..."
npx wrangler pages deploy dist --project-name aromapulse
if [ $? -ne 0 ]; then
    echo "❌ 배포 실패"
    exit 1
fi

echo ""
echo "✅ 배포 완료!"
echo ""
echo "======================================"
echo "🎉 배포가 성공적으로 완료되었습니다!"
echo ""
echo "📝 다음 단계:"
echo "1. 프로덕션 URL 확인: https://aromapulse.pages.dev"
echo "2. DB 마이그레이션 적용 (PRODUCTION_DEPLOYMENT_GUIDE.md 참고)"
echo "3. 기능 테스트 수행"
echo "======================================"
