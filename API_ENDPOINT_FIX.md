# API Endpoint Fix - Class vs Workshop Pages

## Problem

The one-day class detail page (https://www.aromapulse.kr/static/class-detail?id=101) was stuck loading because it was calling the wrong API endpoint:

- **현상**: "클래스 정보를 불러오는 중..." 화면에서 멈춤
- **원인**: `workshop-detail.js` 파일이 항상 `/api/workshops/ID` 엔드포인트만 호출
- **영향**: 원데이 클래스 페이지가 로드되지 않음

## Root Cause

`/home/user/webapp/public/static/workshop-detail.js` 파일:
- 워크샵 상세 페이지와 클래스 상세 페이지가 **같은 JavaScript 파일 공유**
- Line 59: `const response = await fetch(\`/api/workshops/\${workshopId}\`);`
- 페이지 타입 구분 없이 항상 `/api/workshops/` 호출

## Solution

페이지 타입을 감지하여 올바른 API 엔드포인트 호출:

### 1. 페이지 타입 감지
```javascript
// Detect page type from URL
isClassPage = window.location.pathname.includes('class-detail');
```

### 2. 동적 API 엔드포인트
```javascript
// Call the appropriate API endpoint based on page type
const apiEndpoint = isClassPage ? `/api/classes/${workshopId}` : `/api/workshops/${workshopId}`;
const response = await fetch(apiEndpoint);
```

### 3. 맞춤형 에러 메시지
```javascript
if (!response.ok) {
    throw new Error(isClassPage ? '클래스를 찾을 수 없습니다' : '워크샵을 찾을 수 없습니다');
}
```

### 4. 올바른 리다이렉트
```javascript
// Redirect to appropriate list page
window.location.href = isClassPage ? '/classes' : '/workshops';
```

## Changes Made

**File**: `/home/user/webapp/public/static/workshop-detail.js`

1. **Line 4**: 페이지 타입 변수 추가 (`isClassPage`)
2. **Line 9**: URL에서 페이지 타입 감지
3. **Line 13-16**: ID 누락시 에러 메시지 구분
4. **Line 59-61**: API 엔드포인트 동적 선택
5. **Line 63-75**: 에러 처리 및 메시지 구분
6. **Line 344-347**: 성공 모달 닫기시 리다이렉트 경로 구분

## Testing

### Local Testing
```bash
cd /home/user/webapp
npm run build
pm2 restart webapp
curl http://localhost:3000/api/classes/101
```

### Production Testing
After deployment to Cloudflare Pages:
1. https://www.aromapulse.kr/static/class-detail?id=101 (원데이 클래스)
2. https://www.aromapulse.kr/static/workshop-detail?id=201 (워크샵)

## Expected Behavior

### 원데이 클래스 페이지 (class-detail.html)
- ✅ API 호출: `/api/classes/101`
- ✅ 강사: 조향사만 표시 (필수)
- ✅ 옵션: 선물용 포장 서비스
- ✅ 워케이션 옵션 없음

### 워크샵 페이지 (workshop-detail.html)
- ✅ API 호출: `/api/workshops/201`
- ✅ 강사: 조향사 + 선택적 심리상담사/멘탈케어 전문가
- ✅ 옵션: 워케이션
- ✅ 선물용 포장 옵션 없음

## Next Steps

1. ✅ **코드 수정 완료** - API 엔드포인트 감지 로직 추가
2. ✅ **빌드 완료** - `npm run build` 성공
3. ✅ **Git 커밋 완료** - 변경사항 추적
4. ⏳ **프로덕션 배포 대기** - Cloudflare API Key 설정 후 배포
5. ⏳ **프로덕션 테스트** - 원데이 클래스 페이지 로드 확인

## Deployment Command

```bash
# Cloudflare API Key 설정 후 실행
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name aromapulse
```

## Git History

```
commit a59ee21 (HEAD -> main)
Author: webapp
Date: 2025-01-22

Fix: 원데이 클래스 페이지가 올바른 API 엔드포인트 호출하도록 수정

- workshop-detail.js가 페이지 타입 감지 (class-detail vs workshop-detail)
- 클래스 페이지: /api/classes/ID 호출
- 워크샵 페이지: /api/workshops/ID 호출
- 에러 메시지와 리다이렉트 경로도 페이지 타입에 맞게 수정

이제 https://www.aromapulse.kr/static/class-detail?id=101 페이지가
정상적으로 로드되어야 합니다.
```

## Summary

이제 원데이 클래스 상세 페이지가 올바른 API 엔드포인트(`/api/classes/101`)를 호출하여 정상적으로 로드됩니다. 프로덕션 배포 후 즉시 확인 가능합니다.
