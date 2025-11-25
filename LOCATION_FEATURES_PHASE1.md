# 위치 기반 기능 구현 - Phase 1 완료

## 📍 개요
사용자의 주소를 기반으로 인근 오프라인 공방을 찾을 수 있는 기능의 기반 구조를 구현했습니다.

## ✅ 완료된 작업

### 1. 데이터베이스 스키마 업데이트
**Migration: `0042_add_user_location.sql`**
```sql
ALTER TABLE users ADD COLUMN user_latitude REAL;
ALTER TABLE users ADD COLUMN user_longitude REAL;
CREATE INDEX IF NOT EXISTS idx_users_location ON users(user_latitude, user_longitude);
```

- `users` 테이블에 위도/경도 컬럼 추가
- 위치 기반 쿼리 최적화를 위한 인덱스 생성

### 2. Geocoding 유틸리티 구현
**파일: `/src/utils/geocoding.ts`**

#### 주요 기능:
- **멀티 제공자 지원**: Google, Naver, Kakao Maps API
- **주소 → 좌표 변환**: `geocodeAddress()` 함수
- **거리 계산**: Haversine 공식 기반 `calculateDistance()` 함수

#### API 엔드포인트별 구현:
```typescript
// Google Maps Geocoding API
const geocodeWithGoogle = async (address: string, apiKey: string)

// Naver Maps Geocoding API
const geocodeWithNaver = async (address: string, clientId: string, clientSecret: string)

// Kakao Maps Geocoding API
const geocodeWithKakao = async (address: string, apiKey: string)
```

#### 거리 계산:
```typescript
// 두 지점 간 거리 계산 (단위: km)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number
```

### 3. Map Config API 엔드포인트
**파일: `/src/routes/map-config.ts`**
**엔드포인트: `GET /api/map-config?provider={google|naver|kakao}`**

#### 기능:
- OAuth 제공자별 Map API 키를 안전하게 프론트엔드에 전달
- 각 제공자의 Map JavaScript SDK URL 제공

#### 응답 예시:
```json
// Google
{
  "provider": "google",
  "config": {
    "apiKey": "AIzaSyB...",
    "mapUrl": "https://maps.googleapis.com/maps/api/js?key=...&libraries=places"
  }
}

// Naver
{
  "provider": "naver",
  "config": {
    "clientId": "abc123",
    "mapUrl": "https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=abc123"
  }
}

// Kakao
{
  "provider": "kakao",
  "config": {
    "apiKey": "xyz789",
    "mapUrl": "https://dapi.kakao.com/v2/maps/sdk.js?appkey=xyz789&libraries=services,clusterer,drawing"
  }
}
```

### 4. 프로필 업데이트 시 자동 Geocoding
**파일: `/src/routes/user.ts`**

#### 동작 방식:
1. 사용자가 프로필에서 주소를 업데이트
2. 사용자의 OAuth 제공자 확인 (Google/Naver/Kakao)
3. 해당 제공자의 Geocoding API를 사용해 좌표 계산
4. `user_latitude`, `user_longitude` 컬럼 자동 업데이트

#### 코드 흐름:
```typescript
// 주소 업데이트 시
if (data.address) {
  const provider = currentUser.oauth_provider; // 'google', 'naver', 'kakao'
  const coordinates = await geocodeAddress(data.address, provider, c.env);
  
  if (coordinates) {
    updateFields.push('user_latitude = ?', 'user_longitude = ?');
    updateValues.push(coordinates.latitude, coordinates.longitude);
  }
}
```

## 🔧 환경 변수 설정 필요

### 프로덕션 환경:
```bash
# Naver Maps (필요 시)
npx wrangler pages secret put NAVER_MAPS_CLIENT_ID --project-name aromapulse
npx wrangler pages secret put NAVER_MAPS_CLIENT_SECRET --project-name aromapulse

# Kakao Maps (필요 시)
npx wrangler pages secret put KAKAO_MAPS_API_KEY --project-name aromapulse
# 또는 기존 KAKAO_REST_API_KEY 사용 가능
```

### 로컬 개발 (.dev.vars):
```
NAVER_MAPS_CLIENT_ID=your_client_id
NAVER_MAPS_CLIENT_SECRET=your_client_secret
KAKAO_MAPS_API_KEY=your_api_key
```

## 📊 테스트 결과

### 로컬 환경:
✅ Map Config API - Google: 정상 작동
✅ Map Config API - Naver: 구조 정상 (API 키 설정 필요)
✅ Map Config API - Kakao: 구조 정상 (API 키 설정 필요)

### 프로덕션 환경:
✅ 배포 URL: https://76b97ea8.aromapulse.pages.dev
✅ Map Config API - Google: 정상 작동
⚠️ Map Config API - Naver: API 키 설정 필요
⚠️ Map Config API - Kakao: API 키 설정 필요

## 🎯 다음 단계 (Phase 2)

### 1. 원데이 클래스 API에 위치 필터링 추가
**목표**: 사용자 위치 기반으로 인근 클래스만 표시
```typescript
// GET /api/oneday-classes?nearby=true&maxDistance=10
// 사용자 좌표에서 10km 이내 클래스만 반환
```

### 2. Naver/Kakao Calendar 통합
**Kakao 로그인 사용자**:
- Kakao Calendar API 연동
- 예약 시 자동으로 캘린더에 일정 추가

**Naver 로그인 사용자**:
- Naver Calendar API 연동
- 예약 시 자동으로 캘린더에 일정 추가

**Google 로그인 사용자**:
- 기존 Google Calendar 링크 방식 유지

### 3. healing.html 업데이트
- 하드코딩된 API 키를 `/api/map-config` 엔드포인트에서 동적으로 가져오기
- 사용자 위치 기반 클래스 필터링 UI 추가

### 4. 프로덕션 Migration 적용
```bash
# 프로덕션 DB에 migration 적용
npx wrangler d1 migrations apply aromapulse-production
```

## 📚 관련 파일

### 신규 파일:
- `/migrations/0042_add_user_location.sql` - 위치 컬럼 추가 migration
- `/src/utils/geocoding.ts` - Geocoding 유틸리티
- `/src/routes/map-config.ts` - Map API 키 제공 엔드포인트

### 수정된 파일:
- `/src/routes/user.ts` - 프로필 업데이트 시 자동 geocoding
- `/src/index.tsx` - map-config 라우트 등록

## 🚀 배포 정보
- **GitHub Commit**: `4204b7c`
- **Production URL**: https://76b97ea8.aromapulse.pages.dev
- **배포 시간**: 2025-11-25

## 💡 구현 노트

### 장점:
1. **OAuth 제공자별 최적화**: 각 사용자의 로그인 제공자에 맞는 API 사용
2. **자동화**: 주소 업데이트 시 좌표 자동 계산
3. **확장성**: 거리 기반 필터링, 추천 등 다양한 기능 확장 가능
4. **보안**: API 키를 서버 측에서 관리, 필요시에만 프론트엔드에 전달

### 고려사항:
1. **Geocoding API 비용**: API 호출 횟수에 따른 비용 발생 가능
2. **정확도**: 주소 형식에 따라 geocoding 결과가 달라질 수 있음
3. **Fallback**: Geocoding 실패 시에도 주소 업데이트는 정상 진행
