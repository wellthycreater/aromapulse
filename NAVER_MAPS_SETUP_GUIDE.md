# Naver Maps API 설정 가이드

## 📍 개요
Naver 로그인 사용자가 Naver Maps로 인근 공방을 볼 수 있도록 Naver Cloud Platform에서 Maps API 키를 발급받아 설정하는 방법입니다.

## 🔑 1단계: Naver Cloud Platform에서 API 키 발급

### 1.1 Naver Cloud Platform 접속
- **URL**: https://www.ncloud.com/
- 네이버 계정으로 로그인
- Console 접속

### 1.2 Application 등록
1. **메뉴 경로**: Services → AI·NAVER API → AI·NAVER API
2. **Application 등록** 버튼 클릭
3. **애플리케이션 정보 입력**:

```
애플리케이션 이름: aromapulse
```

4. **Service 선택**:
   - ✅ **Maps** (지도 표시용 - 필수)
   - ✅ **Geocoding** (주소 → 좌표 변환용 - 필수)

5. **서비스 환경 등록**:
   - **Web 서비스 URL**:
     ```
     https://*.aromapulse.pages.dev
     https://aromapulse.pages.dev
     http://localhost:3000
     ```
   - **Android 앱 패키지 이름**: (선택사항)
   - **iOS Bundle ID**: (선택사항)

### 1.3 인증 정보 확인
등록 완료 후 다음 정보를 확인하고 안전하게 보관하세요:

- **Client ID**: `xxxxxxxxxxxxxxx` (예: `abc123def456ghi789`)
- **Client Secret**: `xxxxxxxxxxxxxxx` (예: `AbC123DeF456GhI789JkL`)

⚠️ **보안 주의**: Client Secret은 외부에 노출되지 않도록 주의하세요!

---

## 🚀 2단계: Cloudflare Pages에 API 키 설정

### 2.1 로컬 개발 환경 설정 (.dev.vars)

프로젝트 루트의 `.dev.vars` 파일을 수정하세요:

```bash
# .dev.vars 파일 편집
cd /home/user/webapp

# 파일에 다음 내용 추가/수정
NAVER_MAPS_CLIENT_ID=발급받은_Client_ID
NAVER_MAPS_CLIENT_SECRET=발급받은_Client_Secret
```

**예시:**
```
NAVER_MAPS_CLIENT_ID=abc123def456ghi789
NAVER_MAPS_CLIENT_SECRET=AbC123DeF456GhI789JkL
```

### 2.2 프로덕션 환경 설정 (Wrangler)

다음 명령어를 실행하여 프로덕션 환경에 API 키를 설정하세요:

```bash
cd /home/user/webapp

# Naver Maps Client ID 설정
npx wrangler pages secret put NAVER_MAPS_CLIENT_ID --project-name aromapulse

# Naver Maps Client Secret 설정
npx wrangler pages secret put NAVER_MAPS_CLIENT_SECRET --project-name aromapulse
```

**실행 시 각각의 값을 입력하라는 프롬프트가 나타납니다:**
```
? Enter a secret value:
```

**입력 방법:**
1. `npx wrangler pages secret put NAVER_MAPS_CLIENT_ID --project-name aromapulse` 실행
2. 발급받은 Client ID 입력 후 Enter
3. `npx wrangler pages secret put NAVER_MAPS_CLIENT_SECRET --project-name aromapulse` 실행
4. 발급받은 Client Secret 입력 후 Enter

### 2.3 설정 확인

```bash
# 설정된 환경 변수 목록 확인
npx wrangler pages secret list --project-name aromapulse
```

**예상 출력:**
```
✨ Success! Uploaded 0 files (102 already uploaded)

Secrets:
- NAVER_MAPS_CLIENT_ID
- NAVER_MAPS_CLIENT_SECRET
- KAKAO_MAPS_API_KEY
- GOOGLE_MAPS_API_KEY
... (기타 secrets)
```

---

## 🧪 3단계: 동작 테스트

### 3.1 로컬 테스트
```bash
cd /home/user/webapp

# 서버 재시작
pm2 restart aromapulse-webapp

# Map Config API 테스트
curl "http://localhost:3000/api/map-config?provider=naver"
```

**예상 응답:**
```json
{
  "provider": "naver",
  "config": {
    "clientId": "abc123def456ghi789",
    "mapUrl": "https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=abc123def456ghi789"
  }
}
```

### 3.2 프로덕션 테스트

1. **배포 후 테스트**:
```bash
curl "https://23e18a97.aromapulse.pages.dev/api/map-config?provider=naver"
```

2. **브라우저 테스트**:
   - 네이버 계정으로 로그인
   - 힐링 체험 페이지 접속 (https://23e18a97.aromapulse.pages.dev/healing)
   - 지도가 정상적으로 표시되는지 확인
   - 공방 마커가 나타나는지 확인

### 3.3 에러 확인
만약 지도가 표시되지 않는다면:

1. **브라우저 개발자 도구 열기** (F12)
2. **Console 탭 확인**
3. 에러 메시지 확인:
   - `Authentication failed`: Client ID/Secret 확인
   - `Invalid referer`: Web 서비스 URL 확인
   - `CORS error`: 도메인 설정 확인

---

## 📊 4단계: Geocoding API 테스트

주소를 좌표로 변환하는 기능도 테스트하세요:

### 4.1 프로필 주소 업데이트 테스트
1. 마이페이지 접속
2. 주소 입력: `서울특별시 강남구 테헤란로 152`
3. 저장 버튼 클릭
4. 서버 로그 확인:
```
🗺️ [Geocoding] Address updated, calculating coordinates using naver provider...
📍 [Geocoding] Address: 서울특별시 강남구 테헤란로 152
✅ [Geocoding] Success: lat=37.xxxxxx, lng=127.xxxxxx
```

### 4.2 Geocoding API 직접 테스트
```bash
# 테스트용 cURL (실제 API 키 필요)
curl -X GET "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=서울특별시 강남구 테헤란로 152" \
  -H "X-NCP-APIGW-API-KEY-ID: 발급받은_Client_ID" \
  -H "X-NCP-APIGW-API-KEY: 발급받은_Client_Secret"
```

---

## 🛠️ 설정 명령어 요약

```bash
# 1. 로컬 개발 환경 (.dev.vars 파일 편집)
cd /home/user/webapp
nano .dev.vars
# 또는
vi .dev.vars

# 다음 내용 추가:
# NAVER_MAPS_CLIENT_ID=발급받은_Client_ID
# NAVER_MAPS_CLIENT_SECRET=발급받은_Client_Secret

# 2. 프로덕션 환경 설정
npx wrangler pages secret put NAVER_MAPS_CLIENT_ID --project-name aromapulse
npx wrangler pages secret put NAVER_MAPS_CLIENT_SECRET --project-name aromapulse

# 3. 설정 확인
npx wrangler pages secret list --project-name aromapulse

# 4. 재배포 (설정 반영)
npm run deploy
```

---

## ⚠️ 문제 해결 (Troubleshooting)

### 문제 1: "Authentication failed" 에러
**원인**: Client ID 또는 Client Secret이 잘못되었습니다.

**해결방법**:
1. Naver Cloud Console에서 인증 정보 재확인
2. 환경 변수 다시 설정
3. 재배포

### 문제 2: "Invalid referer" 에러
**원인**: Web 서비스 URL이 등록되지 않았습니다.

**해결방법**:
1. Naver Cloud Console → Application 설정
2. Web 서비스 URL 추가:
   - `https://*.aromapulse.pages.dev`
   - `https://aromapulse.pages.dev`
3. 설정 저장 후 5분 대기

### 문제 3: "Quota exceeded" 에러
**원인**: 일일 호출 한도를 초과했습니다.

**해결방법**:
1. Naver Cloud Console에서 사용량 확인
2. 필요시 유료 플랜으로 업그레이드
3. 캐싱 구현으로 API 호출 감소

**무료 할당량**:
- Maps API: 1일 10만 건
- Geocoding API: 1일 10만 건

### 문제 4: 지도가 표시되지 않음
**원인**: JavaScript 로딩 오류 또는 API 키 문제

**확인사항**:
1. 브라우저 Console 확인 (F12)
2. Network 탭에서 API 요청 확인
3. `/api/map-config?provider=naver` 응답 확인
4. Naver Maps SDK 로딩 확인

---

## 📚 참고 문서

### Naver Cloud Platform 공식 문서:
- **Maps API 가이드**: https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding
- **Geocoding API 가이드**: https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding-geocode
- **가격 정책**: https://www.ncloud.com/product/applicationService/maps

### 프로젝트 문서:
- `GEOLOCATION_FEATURE.md` - 위치 기반 기능
- `LOCATION_FEATURES_PHASE2_COMPLETE.md` - 전체 구현 내용
- `src/utils/geocoding.ts` - Geocoding 유틸리티 코드

---

## ✅ 체크리스트

설정 완료 후 다음 항목을 확인하세요:

- [ ] Naver Cloud Platform 계정 생성
- [ ] Application 등록 완료
- [ ] Maps API 선택
- [ ] Geocoding API 선택
- [ ] Web 서비스 URL 등록
- [ ] Client ID 발급 확인
- [ ] Client Secret 발급 확인
- [ ] `.dev.vars` 파일 업데이트
- [ ] 프로덕션 환경 변수 설정 (wrangler)
- [ ] 로컬 테스트 성공
- [ ] 재배포 완료
- [ ] 프로덕션 테스트 성공
- [ ] 네이버 로그인 → 지도 표시 확인
- [ ] 주소 입력 → 좌표 저장 확인

---

## 🎯 완료 후 다음 단계

API 키 설정이 완료되면:

1. ✅ 네이버 로그인 사용자가 Naver Maps 사용 가능
2. ✅ 주소 입력 시 Naver Geocoding으로 좌표 변환
3. ✅ 인근 공방 검색 기능 정상 작동
4. ✅ 네이버 사용자에게 최적화된 경험 제공

같은 방식으로 **Kakao Maps API 키**도 설정하실 수 있습니다!
