# 공방 좌표 업데이트 가이드

## 📍 개요
기존 공방 데이터에 좌표가 없어서 정확한 거리 계산이 불가능했습니다.
Google Geocoding API를 사용하여 모든 공방의 좌표를 자동으로 추출했습니다.

## ✅ 업데이트 결과

### 인천 계양구 작전동 기준 거리:

| 거리 | ID | 공방명 | 위치 | 좌표 |
|------|-----|--------|------|------|
| 🚶 15.78km | 17 | 캔들 & 왁스타블렛 | 서울 마포구 | (37.5638, 126.8997) |
| 🚗 21.62km | 18 | 프리미엄 향수 조향 | 서울 용산구 | (37.5288, 126.9686) |
| 🚗 27.48km | 15 | 향기로운 힐링 체험 | 서울 강남구 | (37.4996, 127.0315) |
| 🚗 27.48km | 101 | 힐링 아로마 클래스 | 서울 강남구 | (37.4996, 127.0315) |
| 🚗 27.57km | 16 | 천연 디퓨저 만들기 | 서울 서초구 | (37.4905, 127.0305) |
| 🚗 33.15km | 103 | 로이베어 | 서울 송파구 | (37.5007, 127.0967) |

### 통계:
- ✅ **50km 이내: 6개 (전체)**
- ✅ **20km 이내: 1개**
- ✅ **20-50km: 5개**

## 🔧 프로덕션 DB 업데이트 방법

### 방법 1: Cloudflare Dashboard (권장)

1. **Cloudflare Dashboard 접속**:
   https://dash.cloudflare.com/

2. **D1 데이터베이스 Console 열기**:
   - Workers & Pages 메뉴
   - D1 선택
   - `aromapulse-production` 선택
   - Console 탭 클릭

3. **SQL 문 실행** (한 줄씩 또는 전체):
   ```sql
   UPDATE oneday_classes SET latitude = 37.5288369, longitude = 126.9686467 WHERE id = 18;
   UPDATE oneday_classes SET latitude = 37.5638012, longitude = 126.8997262 WHERE id = 17;
   UPDATE oneday_classes SET latitude = 37.4904509, longitude = 127.0305252 WHERE id = 16;
   UPDATE oneday_classes SET latitude = 37.499564, longitude = 127.0315094 WHERE id = 15;
   UPDATE oneday_classes SET latitude = 37.499564, longitude = 127.0315094 WHERE id = 101;
   ```

4. **확인**:
   ```sql
   SELECT id, title, latitude, longitude FROM oneday_classes;
   ```

### 방법 2: Wrangler CLI (Cloudflare API Key 필요)

```bash
# API Key 설정 후
npx wrangler d1 execute aromapulse-production --remote --file=./update_coordinates.sql
```

## 📊 업데이트 전후 비교

| 항목 | 업데이트 전 | 업데이트 후 |
|------|-------------|-------------|
| **좌표 있는 공방** | 1개 (17%) | **6개 (100%)** ✅ |
| **정확한 거리 계산** | 1개만 가능 | **전체 가능** ✅ |
| **50km 필터링 정확도** | 낮음 (키워드 기반) | **높음 (좌표 기반)** ✅ |
| **지도 표시** | 1개만 | **전체 표시** ✅ |

## 🎯 기대 효과

1. ✅ **정확한 거리 계산**: 모든 공방까지의 실제 거리 표시
2. ✅ **지도 마커**: 6개 공방 모두 지도에 정확히 표시
3. ✅ **거리순 정렬**: 가까운 순서대로 정확하게 정렬
4. ✅ **사용자 경험 향상**: "거리 미확인" 공방 제거

## 📁 관련 파일

- `update_coordinates.sql`: 실행할 SQL 문
- `COORDINATE_UPDATE_GUIDE.md`: 이 문서

## 📅 생성일

2025-11-25
