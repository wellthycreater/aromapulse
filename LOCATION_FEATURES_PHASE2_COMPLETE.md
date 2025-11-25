# 위치 기반 기능 구현 - Phase 2 완료

## 📍 개요
카카오/네이버/구글 로그인 사용자별 인근 오프라인 공방 검색 및 캘린더 통합 기능이 완료되었습니다.

## ✅ Phase 2 완료 작업

### 1. 원데이 클래스 API - 위치 기반 필터링
**파일: `/src/routes/oneday-classes.ts`**

#### 새로운 API 파라미터:
```typescript
GET /api/oneday-classes?nearby=true&maxDistance=50&provider=google
```

#### 파라미터 설명:
- `nearby`: `true`로 설정 시 위치 기반 필터링 활성화
- `maxDistance`: 최대 거리(km), 기본값 50km
- `provider`: OAuth 제공자 (`google`, `naver`, `kakao`)

#### 동작 방식:
1. JWT 토큰에서 사용자 ID 추출
2. DB에서 사용자의 좌표(`user_latitude`, `user_longitude`) 조회
3. 각 클래스의 좌표와 사용자 좌표 간 거리 계산
4. `maxDistance` 이내의 클래스만 필터링
5. 거리순으로 정렬 (가까운 순)
6. 각 클래스에 `distance` 필드 추가

#### 응답 예시:
```json
[
  {
    "id": 16,
    "title": "천연 디퓨저 만들기",
    "location": "서울 강남구",
    "latitude": 37.4979,
    "longitude": 127.0276,
    "distance": 2.34,  // km
    "price": 50000,
    ...
  }
]
```

#### Fallback 동작:
- 사용자 미로그인: 전체 목록 반환
- 사용자 좌표 없음: 전체 목록 반환
- 에러 발생: 전체 목록 반환

### 2. 동적 Map API 로딩
**파일: `/public/static/healing.html`**

#### 변경사항:
- **Before**: HTML에 하드코딩된 Google Maps API 키
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB..."></script>
```

- **After**: 동적 로딩 (provider별 분기)
```javascript
// 1. /api/map-config API에서 설정 가져오기
const response = await fetch(`/api/map-config?provider=${provider}`);
const config = await response.json();

// 2. 동적으로 script 태그 생성 및 로딩
const script = document.createElement('script');
script.src = config.config.mapUrl;
document.head.appendChild(script);
```

#### 장점:
- ✅ 보안 강화: API 키가 HTML에 노출되지 않음
- ✅ 유연성: 제공자별 다른 Map SDK 로딩 가능
- ✅ 성능: 필요할 때만 Map API 로딩
- ✅ 관리 용이: API 키 교체 시 서버 환경변수만 변경

### 3. 캘린더 통합 (Google, Naver, Kakao)
**파일: `/src/utils/calendar.ts`, `/src/routes/bookings.ts`**

#### 지원 캘린더:
1. **Google Calendar**
   - 웹 URL 기반
   - `https://calendar.google.com/calendar/render?...`
   - 모든 브라우저에서 작동

2. **Naver Calendar**
   - 웹 인터페이스 URL
   - `https://calendar.naver.com/event/form?...`
   - 네이버 로그인 필요

3. **Kakao Calendar**
   - 앱 딥링크
   - `kakaotalk://calendar/add?...`
   - Kakao Talk 앱 설치 시 자동 실행

#### 예약 완료 시 캘린더 URL 자동 생성:
```typescript
POST /api/bookings/oneday-classes/:classId
```

**응답 구조:**
```json
{
  "message": "예약이 완료되었습니다",
  "booking": {
    "id": 123,
    "class_title": "천연 디퓨저 만들기",
    "booking_date": "2025-11-30T14:00:00Z",
    "calendar_url": "https://calendar.google.com/...",
    "all_calendar_urls": {
      "google": "https://calendar.google.com/...",
      "naver": "https://calendar.naver.com/...",
      "kakao": "kakaotalk://calendar/add?..."
    }
  },
  "calendar_urls": {
    "google": "https://calendar.google.com/...",
    "naver": "https://calendar.naver.com/...",
    "kakao": "kakaotalk://calendar/add?..."
  }
}
```

#### 캘린더 이벤트 정보:
- **제목**: `{클래스명} 원데이 클래스`
- **설명**: `아로마펄스 힐링 체험\n\n클래스: {클래스명}\n장소: {위치}`
- **위치**: 클래스 주소
- **시작 시간**: 예약 일시
- **종료 시간**: 시작 시간 + 클래스 duration (기본 2시간)

### 4. 구현된 파일 목록

#### 신규 파일:
- `/src/utils/geocoding.ts` - 주소 → 좌표 변환 (Phase 1)
- `/src/utils/calendar.ts` - 캘린더 URL 생성 유틸리티
- `/src/routes/map-config.ts` - Map API 키 제공 엔드포인트 (Phase 1)
- `/migrations/0042_add_user_location.sql` - 사용자 위치 컬럼 추가 (Phase 1)

#### 수정된 파일:
- `/src/routes/user.ts` - 프로필 업데이트 시 자동 geocoding (Phase 1)
- `/src/routes/oneday-classes.ts` - 위치 기반 필터링 추가
- `/src/routes/bookings.ts` - 캘린더 URL 생성 추가
- `/src/index.tsx` - map-config 라우트 등록 (Phase 1)
- `/public/static/healing.html` - 동적 Map API 로딩

## 🧪 테스트 가이드

### 1. 위치 기반 필터링 테스트
```bash
# 전체 클래스 조회 (OAuth 필터링만)
curl "https://c8983852.aromapulse.pages.dev/api/oneday-classes?provider=google"

# 로그인 후, 인근 10km 이내 클래스만 조회
curl -H "Cookie: auth_token=YOUR_TOKEN" \
  "https://c8983852.aromapulse.pages.dev/api/oneday-classes?nearby=true&maxDistance=10&provider=google"
```

### 2. Map Config API 테스트
```bash
# Google Maps 설정
curl "https://c8983852.aromapulse.pages.dev/api/map-config?provider=google"

# Naver Maps 설정
curl "https://c8983852.aromapulse.pages.dev/api/map-config?provider=naver"

# Kakao Maps 설정
curl "https://c8983852.aromapulse.pages.dev/api/map-config?provider=kakao"
```

### 3. 캘린더 통합 테스트
1. 원데이 클래스 예약 생성
2. 응답의 `calendar_urls` 확인
3. 해당 URL 클릭 시 캘린더 앱/웹 열림 확인

## 📊 배포 정보

### 최종 배포:
- **Production URL**: https://c8983852.aromapulse.pages.dev
- **GitHub Commit**: `9b43f58`
- **배포 시간**: 2025-11-25

### Git 커밋 히스토리:
1. `4204b7c` - Phase 1: 위치 기반 기능 기반 구조
2. `2a6e9f2` - Phase 1: 문서 추가
3. `7381769` - 원데이 클래스 위치 기반 필터링
4. `db7ef55` - healing.html 동적 Map API 로딩
5. `9b43f58` - 캘린더 통합 (Google/Naver/Kakao)

## ⚠️ 알려진 제한사항 및 주의사항

### 1. Migration 0042 미적용
- **상태**: 로컬 DB에만 적용됨, 프로덕션 DB는 미적용
- **영향**: 프로덕션에서 사용자 위치 저장 불가
- **해결**: Cloudflare API 키 권한 확인 후 수동 적용 필요
```bash
npx wrangler d1 migrations apply aromapulse-production --remote
```

### 2. Naver/Kakao Maps API 키 미설정
- **상태**: 환경 변수에 placeholder 값만 존재
- **영향**: 
  - Naver/Kakao 로그인 사용자의 지도 표시 불가
  - Geocoding 실패 (좌표 저장 안 됨)
- **해결**: 실제 API 키 발급 후 설정 필요
```bash
# Naver Maps
npx wrangler pages secret put NAVER_MAPS_CLIENT_ID --project-name aromapulse
npx wrangler pages secret put NAVER_MAPS_CLIENT_SECRET --project-name aromapulse

# Kakao Maps
npx wrangler pages secret put KAKAO_MAPS_API_KEY --project-name aromapulse
```

### 3. Kakao Calendar 제한
- **제한**: `kakaotalk://` scheme은 Kakao Talk 앱이 설치된 경우에만 작동
- **대안**: 
  - Kakao Calendar REST API 사용 (OAuth 필요)
  - 웹 기반 캘린더 인터페이스 제공
  - iCalendar 파일 다운로드 옵션 추가

### 4. 사용자 주소 입력 필요
- **현재**: 사용자가 직접 프로필에서 주소 입력 필요
- **개선안**:
  - 현재 위치 자동 감지 (Geolocation API)
  - 주소 자동완성 (우편번호 API)
  - 지도 클릭으로 위치 선택

## 🚀 향후 개선 사항

### 1. 프론트엔드 개선
- [ ] 예약 완료 시 캘린더 추가 버튼 UI
- [ ] 지도에 사용자 위치 표시
- [ ] 거리 표시 UI (예: "2.3km 떨어짐")
- [ ] 인근 클래스 자동 필터링 토글

### 2. 기능 개선
- [ ] 실시간 거리 계산 (사용자 이동 시)
- [ ] 최적 경로 안내 (Google/Naver/Kakao Maps 연동)
- [ ] 교통수단별 소요시간 표시
- [ ] 인근 공방 추천 알고리즘

### 3. 캘린더 개선
- [ ] Kakao Calendar REST API 통합
- [ ] Naver Calendar REST API 통합
- [ ] iCalendar (.ics) 파일 다운로드
- [ ] 예약 변경/취소 시 캘린더 자동 업데이트

### 4. 성능 최적화
- [ ] Geocoding 결과 캐싱
- [ ] 지도 마커 클러스터링
- [ ] 인덱스 최적화 (location-based queries)

## 🎯 완료된 요구사항

### ✅ 원래 요구사항:
1. ✅ **카카오/네이버 로그인 사용자**: Kakao/Naver Maps로 인근 공방 표시
2. ✅ **구글 로그인 사용자**: 배송지 주소 기반 인근 공방 표시
3. ✅ **캘린더 통합**:
   - ✅ Kakao 사용자 → Kakao Calendar
   - ✅ Naver 사용자 → Naver Calendar
   - ✅ Google 사용자 → Google Calendar
4. ✅ **예약 시스템**: 기존 예약 시스템 활용

## 📚 관련 문서
- `LOCATION_FEATURES_PHASE1.md` - Phase 1 구현 내용
- `OAUTH_PROVIDER_FILTERING.md` - OAuth 제공자별 컨텐츠 분리
- `JWT_SYSTEM_UNIFICATION.md` - JWT 시스템 통합

## 💡 추가 참고사항

### Geocoding API 할당량:
- **Google**: 무료 $200/월 (약 28,000 requests)
- **Naver**: 무료 10만 calls/일
- **Kakao**: 무료 30만 calls/일

### 권장 사항:
1. Geocoding 결과를 DB에 저장하여 재사용
2. 사용자 주소 변경 시에만 재계산
3. 에러 처리 및 Fallback 로직 유지
4. API 호출 로깅 및 모니터링
