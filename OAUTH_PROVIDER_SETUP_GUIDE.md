# OAuth 제공자별 공방 분리 설정 가이드

## 📋 개요

이 가이드는 Cloudflare D1 데이터베이스에서 원데이 클래스를 OAuth 제공자별로 분리하는 SQL을 실행하는 방법을 안내합니다.

## 🎯 목적

- **Google 로그인** 사용자: ID 104, 105, 106 공방만 표시
- **Naver 로그인** 사용자: ID 15, 16, 17 공방만 표시  
- **Kakao 로그인** 사용자: ID 18, 101, 103 공방만 표시

## 📍 현재 데이터베이스 상태

```sql
-- 현재 모든 공방의 provider_id가 1로 설정되어 있음
SELECT id, title, location, provider_id FROM oneday_classes ORDER BY id;
```

| ID  | Title | Location | provider_id |
|-----|-------|----------|-------------|
| 15  | 향기로운 힐링 체험 | 서울 강남구 | 1 |
| 16  | 천연 디퓨저 만들기 | 서울 서초구 | 1 |
| 17  | 캔들 & 왁스타블렛 클래스 | 서울 마포구 | 1 |
| 18  | 프리미엄 향수 조향 클래스 | 서울 용산구 | 1 |
| 101 | 힐링 아로마 원데이 클래스 | 서울 강남구 | 1 |
| 103 | 향수공방 캔들공방 천연비누공방 로이베어 | 서울 송파구 | 1 |
| 104 | 계양 힐링 공방 | 인천 계양구 | 1 |
| 105 | 부평 향기 공방 | 인천 부평구 | 1 |
| 106 | 서구 아로마 클래스 | 인천 서구 | 1 |

## 🔧 설정 방법

### 1단계: Cloudflare D1 Console 접속

```
https://dash.cloudflare.com/
```

1. **Workers & Pages** 메뉴 선택
2. **D1** 선택
3. **aromapulse-production** 데이터베이스 선택
4. **Console** 탭 클릭

### 2단계: SQL 명령어 실행

**⚠️ 중요: 아래 SQL 명령어를 한 줄씩 실행하세요**

#### Google 전용 공방 설정 (provider_id = 2)
```sql
UPDATE oneday_classes SET provider_id = 2 WHERE id = 104;
```
```sql
UPDATE oneday_classes SET provider_id = 2 WHERE id = 105;
```
```sql
UPDATE oneday_classes SET provider_id = 2 WHERE id = 106;
```

#### Naver 전용 공방 설정 (provider_id = 3)
```sql
UPDATE oneday_classes SET provider_id = 3 WHERE id = 15;
```
```sql
UPDATE oneday_classes SET provider_id = 3 WHERE id = 16;
```
```sql
UPDATE oneday_classes SET provider_id = 3 WHERE id = 17;
```

#### Kakao 전용 공방 설정 (provider_id = 4)
```sql
UPDATE oneday_classes SET provider_id = 4 WHERE id = 18;
```
```sql
UPDATE oneday_classes SET provider_id = 4 WHERE id = 101;
```
```sql
UPDATE oneday_classes SET provider_id = 4 WHERE id = 103;
```

### 3단계: 업데이트 확인

```sql
SELECT id, title, location, provider_id, 
  CASE 
    WHEN provider_id = 2 THEN 'Google'
    WHEN provider_id = 3 THEN 'Naver'
    WHEN provider_id = 4 THEN 'Kakao'
    ELSE 'Unknown'
  END as oauth_provider
FROM oneday_classes 
WHERE is_active = 1
ORDER BY provider_id, id;
```

**예상 결과:**

| ID  | Title | Location | provider_id | oauth_provider |
|-----|-------|----------|-------------|----------------|
| 104 | 계양 힐링 공방 | 인천 계양구 | 2 | Google |
| 105 | 부평 향기 공방 | 인천 부평구 | 2 | Google |
| 106 | 서구 아로마 클래스 | 인천 서구 | 2 | Google |
| 15  | 향기로운 힐링 체험 | 서울 강남구 | 3 | Naver |
| 16  | 천연 디퓨저 만들기 | 서울 서초구 | 3 | Naver |
| 17  | 캔들 & 왁스타블렛 클래스 | 서울 마포구 | 3 | Naver |
| 18  | 프리미엄 향수 조향 클래스 | 서울 용산구 | 4 | Kakao |
| 101 | 힐링 아로마 원데이 클래스 | 서울 강남구 | 4 | Kakao |
| 103 | 향수공방 캔들공방 천연비누공방 로이베어 | 서울 송파구 | 4 | Kakao |

## ✅ 테스트 방법

### Google 로그인 테스트
```
1. https://aromapulse.pages.dev/logout
2. https://aromapulse.pages.dev/auth/google
3. https://aromapulse.pages.dev/static/healing
```
**예상 결과:** 3개 공방 (계양, 부평, 서구)

### Naver 로그인 테스트
```
1. https://aromapulse.pages.dev/logout
2. https://aromapulse.pages.dev/auth/naver
3. https://aromapulse.pages.dev/static/healing
```
**예상 결과:** 3개 공방 (강남, 서초, 마포)

### Kakao 로그인 테스트
```
1. https://aromapulse.pages.dev/logout
2. https://aromapulse.pages.dev/auth/kakao
3. https://aromapulse.pages.dev/static/healing
```
**예상 결과:** 3개 공방 (용산, 강남, 송파)

## 🔍 문제 해결

### 모든 공방이 보이는 경우
- 브라우저 캐시 삭제: `Ctrl + Shift + R`
- 로그아웃 후 재로그인
- 네트워크 탭에서 `/api/oneday-classes?provider=google` 응답 확인

### 공방이 하나도 안 보이는 경우
- SQL UPDATE가 제대로 실행되었는지 확인
- provider 파라미터가 올바르게 전달되는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

## 📊 Provider ID 매핑

| Provider | provider_id | 담당 공방 ID |
|----------|-------------|--------------|
| Google   | 2           | 104, 105, 106 |
| Naver    | 3           | 15, 16, 17    |
| Kakao    | 4           | 18, 101, 103  |

## 📝 참고사항

- **위치 기반 검색**: GPS 위치 검색 시에는 OAuth 필터링이 적용되어 해당 제공자의 공방만 표시됩니다
- **일반 목록**: `/static/healing` 페이지 접속 시 자동으로 현재 로그인 제공자에 맞는 공방만 필터링됩니다
- **관리자 기능**: 추후 관리자 대시보드에서 공방의 provider_id를 변경할 수 있습니다

## 🚀 배포 후 확인사항

1. ✅ SQL 업데이트 완료
2. ✅ 3개 제공자별 로그인 테스트
3. ✅ GPS 위치 검색 테스트
4. ✅ 예약 시스템 작동 확인
5. ✅ 네이버 캘린더 연동 확인

---

**작성일:** 2025-11-25  
**버전:** 1.0
