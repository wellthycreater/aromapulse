# 프로덕션 접속 가이드

## 🌐 공식 프로덕션 URL

### 메인 도메인
```
https://aromapulse.pages.dev
```

### Healing Experience (힐링 체험) 페이지
```
https://aromapulse.pages.dev/static/healing
```

---

## 🗺️ Naver Maps 사용 가이드

### Naver 계정으로 로그인 후 지도 사용

1. **메인 페이지 접속**: https://aromapulse.pages.dev
2. **Naver 로그인**: 우측 상단 "로그인" → Naver 선택
3. **Healing Experience 이동**: 메뉴에서 "힐링 체험" 클릭
4. **Naver Maps 확인**: 자동으로 Naver 지도 표시
5. **위치 권한 허용**: "허용" 클릭 → 내 위치 기반 공방 검색

### 지원 기능
- ✅ **Naver Maps**: Naver 로그인 사용자
- ✅ **Google Maps**: Google 로그인 사용자
- ✅ **내 위치로 검색**: 50km 내 공방 필터링
- ✅ **거리순 정렬**: 가까운 공방부터 표시
- ✅ **캘린더 통합**: 예약 후 Google/Naver/Kakao Calendar 자동 생성

---

## 🔐 인증 도메인 정보

### Naver Cloud Platform 등록 도메인
```
https://*.aromapulse.pages.dev
https://aromapulse.pages.dev
http://localhost:3000
```

### ⚠️ 사용 불가 도메인
```
❌ https://www.aromapulse.kr (Naver Maps API 인증 실패)
❌ https://aromapulse.kr (Naver Maps API 인증 실패)
```

**이유**: Cloudflare 프록시로 인해 Naver API가 실제 도메인을 인식하지 못함

---

## 📱 모바일 접속

### iOS (Safari)
```
https://aromapulse.pages.dev
```

### Android (Chrome)
```
https://aromapulse.pages.dev
```

### 모바일 위치 권한
1. 브라우저에서 위치 권한 요청 팝업 표시
2. **"허용"** 선택
3. GPS 기반 정확한 위치 사용
4. "내 위치로 검색" 버튼 자동 활성화

---

## 🧪 테스트 체크리스트

### Naver 로그인 사용자
- [ ] https://aromapulse.pages.dev 접속
- [ ] Naver 계정으로 로그인
- [ ] "힐링 체험" 메뉴 클릭
- [ ] **Naver Maps 정상 표시 확인**
- [ ] 지도 확대/축소/드래그 작동
- [ ] 공방 마커 클릭 → 정보창 표시
- [ ] "내 위치로 검색" 클릭 → 위치 권한 허용
- [ ] 50km 내 공방 필터링 확인
- [ ] 공방 목록 거리순 정렬 확인

### Google 로그인 사용자
- [ ] https://aromapulse.pages.dev 접속
- [ ] Google 계정으로 로그인
- [ ] "힐링 체험" 메뉴 클릭
- [ ] **Google Maps 정상 표시 확인**
- [ ] 동일한 기능 테스트

---

## 🆘 문제 해결

### 문제 1: "Naver Maps API 인증 실패" 에러

**증상**:
```
Authentication Failed
URI: https://www.aromapulse.kr/static/healing
```

**해결**:
```
✅ https://aromapulse.pages.dev/static/healing 접속
```

### 문제 2: 지도에 로고만 반복 표시

**원인**: API 인증 실패 또는 서브모듈 미로드

**해결**:
1. 브라우저 캐시 삭제 (Ctrl+Shift+R)
2. `aromapulse.pages.dev` 도메인 사용 확인
3. 브라우저 콘솔(F12) 에러 확인

### 문제 3: 위치 업데이트 500 에러

**원인**: 로컬 DB에 `user_latitude`, `user_longitude` 컬럼 없음

**해결** (로컬 개발 환경):
```bash
npx wrangler d1 execute aromapulse-production --local --command="ALTER TABLE users ADD COLUMN user_latitude REAL; ALTER TABLE users ADD COLUMN user_longitude REAL;"
```

**프로덕션**: 이미 배포 완료

---

## 📊 배포 정보

- **최신 배포**: 2025-11-25
- **프로덕션 URL**: https://aromapulse.pages.dev
- **최신 빌드**: https://34462036.aromapulse.pages.dev
- **GitHub**: https://github.com/wellthycreater/aromapulse
- **최신 커밋**: `2f39a26`

---

## 🔗 관련 문서

- `NAVER_MAPS_FIX.md` - Naver Maps 구현 및 수정
- `NAVER_MAPS_SETUP_GUIDE.md` - Naver Maps API 설정
- `GEOLOCATION_FEATURE.md` - 위치 기반 검색 기능
- `PRODUCTION_DEPLOYMENT_2025-11-25.md` - 최신 배포 내역

---

## 💡 중요 참고사항

### Cloudflare Pages 기본 도메인 사용 이유

1. **Naver Maps API 인증**: `*.aromapulse.pages.dev`는 이미 Naver에 등록됨
2. **안정성**: Cloudflare 프록시 없이 직접 통신
3. **HTTPS 기본 지원**: 별도 인증서 불필요
4. **빠른 배포**: Git push만으로 자동 배포

### 커스텀 도메인 마이그레이션 (향후)

**Naver Maps API v2**로 업그레이드 시:
- 신규 API는 Cloudflare 프록시 지원
- `www.aromapulse.kr` 사용 가능
- 마이그레이션 가이드: https://navermaps.github.io/maps.js.ncp/

---

**공식 프로덕션 URL**: https://aromapulse.pages.dev ✅
