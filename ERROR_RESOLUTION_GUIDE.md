# 🚨 500 Internal Server Error 해결 가이드

## 에러 상황
```
POST https://www.aromapulse.kr/api/bookings/oneday-classes/18 500 (Internal Server Error)
submitBooking @ classes.js:460
```

## 원인 분석

### 주요 원인: 데이터베이스 테이블 누락 ⭐
- **문제**: `oneday_class_bookings` 테이블이 프로덕션 데이터베이스에 존재하지 않음
- **근거**: 마이그레이션 파일 `0002_oneday_classes.sql`은 존재하지만, 프로덕션 DB에 적용되지 않은 것으로 추정
- **영향**: 예약 API가 테이블을 찾지 못해 500 에러 발생

### 관련 코드
**백엔드**: `/src/routes/bookings.ts` (라인 15-119)
```typescript
bookings.post('/oneday-classes/:classId', async (c: Context) => {
  // ... 예약 생성 로직
  const result = await DB.prepare(`
    INSERT INTO oneday_class_bookings (
      class_id, user_id, booking_date, participants, total_price,
      booker_name, booker_phone, booker_email, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
  `).bind(...).run();
});
```

**프론트엔드**: `/public/static/classes.js` (라인 460-474)
```javascript
const response = await fetch(`/api/bookings/oneday-classes/${classId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        booking_date: bookingDatetime,
        participants: parseInt(participants),
        booker_name: bookerName,
        booker_phone: bookerPhone,
        booker_email: bookerEmail,
        special_requests: notes || null
    })
});
```

## 해결 방법

### ✅ STEP 1: Cloudflare API 키 설정

1. **왼쪽 사이드바의 'Deploy' 탭 클릭**
2. Cloudflare API 키 설정 가이드를 따라 진행
3. API 키 저장 완료 확인

### ✅ STEP 2: 데이터베이스 마이그레이션 적용

```bash
cd /home/user/webapp

# 방법 A: 전체 마이그레이션 재적용 (권장)
npx wrangler d1 migrations apply aromapulse-production --remote

# 방법 B: 특정 테이블만 수동 생성 (마이그레이션 실패 시)
npx wrangler d1 execute aromapulse-production --remote --file=./fix_bookings_table.sql
```

### ✅ STEP 3: 테이블 생성 확인

```bash
# oneday_class_bookings 테이블 존재 확인
npx wrangler d1 execute aromapulse-production --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='oneday_class_bookings';"

# 테이블 스키마 확인 (선택사항)
npx wrangler d1 execute aromapulse-production --remote --command="PRAGMA table_info(oneday_class_bookings);"
```

**예상 결과**:
```
┌──────────────────────────┐
│ name                     │
├──────────────────────────┤
│ oneday_class_bookings    │
└──────────────────────────┘
```

### ✅ STEP 4: 프로덕션 재배포

테이블 생성이 확인되면 재배포 (코드는 이미 올바르므로 재배포만 하면 됨):

```bash
# 빌드
npm run build

# 프로덕션 배포
npx wrangler pages deploy dist --project-name aromapulse
```

### ✅ STEP 5: 프로덕션 테스트

1. **브라우저에서 테스트**:
   - https://www.aromapulse.kr/static/classes.html 접속
   - 클래스 상세 페이지 진입
   - 예약 정보 입력 후 "예약하기" 클릭

2. **성공 확인**:
   - ✅ 예약 완료 모달이 표시됨
   - ✅ 콘솔 에러 없음
   - ✅ 데이터베이스에 예약 레코드 생성됨

3. **데이터베이스 확인** (선택사항):
   ```bash
   npx wrangler d1 execute aromapulse-production --remote --command="SELECT * FROM oneday_class_bookings ORDER BY created_at DESC LIMIT 5;"
   ```

## 기타 에러 (중요도 낮음)

### 1. alialert.net/words.xml - ERR_NAME_NOT_RESOLVED
- **원인**: 외부 광고/알림 서비스
- **영향**: 사이트 기능에 영향 없음
- **조치**: 무시 가능

### 2. Google Photos API - 403 Forbidden
- **원인**: Google Places API 키의 Places Photo 권한 부족
- **영향**: 클래스 이미지 일부가 표시되지 않을 수 있음
- **조치** (선택사항):
  1. Google Cloud Console 접속
  2. Places API 사용 설정 확인
  3. API 키에 Places Photo 권한 추가
  4. 프론트엔드 환경 변수에 API 키 설정

### 3. Tailwind CDN 경고
```
cdn.tailwindcss.com should not be used in production
```
- **원인**: 개발용 CDN 사용
- **영향**: 성능에 미세한 영향 (현재는 무시 가능)
- **조치** (추후 최적화):
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init
  ```

## 트러블슈팅

### 마이그레이션이 실패하는 경우

```bash
# 현재 적용된 마이그레이션 확인
npx wrangler d1 migrations list aromapulse-production --remote

# 특정 마이그레이션만 다시 실행
npx wrangler d1 execute aromapulse-production --remote --file=./migrations/0002_oneday_classes.sql
```

### 테이블이 생성되지 않는 경우

`fix_bookings_table.sql` 파일을 직접 실행:

```bash
npx wrangler d1 execute aromapulse-production --remote --file=./fix_bookings_table.sql
```

### 여전히 500 에러가 발생하는 경우

1. **JWT 토큰 확인**:
   - 브라우저에서 로그인 되어 있는지 확인
   - 개발자 도구 > Application > Cookies > auth_token 확인

2. **D1 바인딩 확인**:
   ```bash
   # wrangler.jsonc 확인
   cat wrangler.jsonc
   # d1_databases.binding이 "DB"인지 확인
   ```

3. **프로덕션 로그 확인**:
   ```bash
   npx wrangler pages deployment tail --project-name aromapulse
   ```

## 완료 체크리스트

- [ ] Cloudflare API 키 설정 완료
- [ ] 마이그레이션 적용 완료
- [ ] `oneday_class_bookings` 테이블 생성 확인
- [ ] 프로덕션 재배포 완료
- [ ] 예약 기능 테스트 성공
- [ ] 500 에러 해결 확인

## 참고 파일

- **마이그레이션**: `/migrations/0002_oneday_classes.sql`
- **수동 생성 스크립트**: `/fix_bookings_table.sql`
- **백엔드 라우트**: `/src/routes/bookings.ts`
- **프론트엔드**: `/public/static/classes.js`
- **데이터베이스 설정**: `/wrangler.jsonc`

## 추가 문의

문제가 지속되면 다음 정보를 제공해주세요:

1. 마이그레이션 적용 결과
2. 테이블 생성 확인 결과
3. 브라우저 콘솔의 전체 에러 로그
4. 프로덕션 로그 (wrangler pages deployment tail)
