# Workshop Booking System - 프로덕션 배포 가이드

## 📋 개요

범용 예약 시스템이 구현되었습니다. 모든 소셜 로그인 사용자(네이버, 카카오, 구글)가 동일한 예약 경험을 받으며, iCalendar 파일로 모든 캘린더 앱과 호환됩니다.

## ✅ 완료된 작업

- ✅ 데이터베이스 스키마 설계 및 로컬 적용
- ✅ 위치 기반 공방 검색 API
- ✅ 예약 시스템 API
- ✅ iCalendar (.ics) 파일 생성
- ✅ 샘플 데이터 생성
- ✅ 로컬 테스트 완료
- ✅ 프로덕션 배포 완료

## ⚠️ 필수 작업: 프로덕션 데이터베이스 마이그레이션

### 방법 1: Cloudflare 대시보드 (추천)

1. **Cloudflare 대시보드 접속**
   - URL: https://dash.cloudflare.com
   - 로그인 후 Workers & Pages 선택

2. **D1 데이터베이스 선택**
   - D1 탭 클릭
   - `aromapulse-production` 데이터베이스 선택

3. **Console 탭에서 SQL 실행**
   - Console 탭 클릭
   - 아래 SQL 스크립트를 복사하여 실행

```sql
-- Add location coordinates to workshops table
ALTER TABLE workshops ADD COLUMN latitude REAL;
ALTER TABLE workshops ADD COLUMN longitude REAL;
ALTER TABLE workshops ADD COLUMN detailed_address TEXT;
ALTER TABLE workshops ADD COLUMN postal_code TEXT;
ALTER TABLE workshops ADD COLUMN contact_phone TEXT;
ALTER TABLE workshops ADD COLUMN contact_email TEXT;

-- Create workshop_schedules table for available booking slots
CREATE TABLE IF NOT EXISTS workshop_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 1,
  booked_slots INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
);

-- Create workshop_bookings table (enhanced version)
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  schedule_id INTEGER,
  user_id INTEGER NOT NULL,
  
  -- Booking details
  booking_date DATE NOT NULL,
  booking_time TIME,
  num_participants INTEGER DEFAULT 1,
  
  -- Customer information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  
  -- Special requests
  special_requests TEXT,
  
  -- Pricing
  price_per_person INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  
  -- Status management
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
  )),
  
  -- Payment info
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN (
    'pending',
    'paid',
    'refunded'
  )),
  payment_method TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  cancelled_at DATETIME,
  completed_at DATETIME,
  
  -- Cancellation info
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK(cancelled_by IN ('user', 'provider', 'admin', NULL)),
  
  -- iCalendar tracking
  icalendar_uid TEXT UNIQUE,
  icalendar_downloaded INTEGER DEFAULT 0,
  icalendar_downloaded_at DATETIME,
  
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES workshop_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create booking_reminders table
CREATE TABLE IF NOT EXISTS booking_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  reminder_type TEXT NOT NULL CHECK(reminder_type IN ('email', 'sms', 'push')),
  reminder_time DATETIME NOT NULL,
  sent INTEGER DEFAULT 0,
  sent_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES workshop_bookings(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workshops_location ON workshops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_workshops_region ON workshops(location);
CREATE INDEX IF NOT EXISTS idx_workshop_schedules_workshop ON workshop_schedules(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_schedules_date ON workshop_schedules(available_date);
CREATE INDEX IF NOT EXISTS idx_workshop_schedules_available ON workshop_schedules(is_available);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_workshop ON workshop_bookings(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_user ON workshop_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_status ON workshop_bookings(status);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_date ON workshop_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_schedule ON workshop_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking ON booking_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent ON booking_reminders(sent);
```

4. **실행 확인**
   - 모든 명령이 성공적으로 실행되었는지 확인
   - 오류 메시지가 있다면 해당 명령만 재실행

### 방법 2: Wrangler CLI (로컬 터미널)

**Cloudflare API 인증 설정이 완료된 경우:**

```bash
# 프로덕션 데이터베이스에 마이그레이션 적용
cd /home/user/webapp
npx wrangler d1 migrations apply aromapulse-production --remote
```

**인증 오류 발생 시:**
- `setup_cloudflare_api_key` 도구 실행
- 또는 Deploy 탭에서 Cloudflare API 키 설정 확인

## 📊 샘플 데이터 삽입 (선택사항)

프로덕션 환경에서 테스트를 위해 샘플 공방 데이터를 추가하려면:

### Cloudflare 대시보드에서:

1. D1 Console 탭에서 아래 SQL 실행
2. 또는 `seed_workshops.sql` 파일 내용 복사/실행

### Wrangler CLI로:

```bash
cd /home/user/webapp
npx wrangler d1 execute aromapulse-production --remote --file=./seed_workshops.sql
```

**샘플 데이터 포함:**
- 서울 3개 공방 (강남, 홍대, 이태원)
- 부산 2개 공방 (해운대, 센텀시티)
- 경기 2개 공방 (분당, 수원)
- 총 20+ 예약 가능 일정

## 🧪 프로덕션 API 테스트

마이그레이션 완료 후 다음 명령어로 API가 정상 작동하는지 확인:

```bash
# 1. 서울 지역 공방 검색
curl "https://www.aromapulse.kr/api/workshop-bookings/search-by-region?region=서울&radius=20"

# 2. 좌표 기반 검색
curl "https://www.aromapulse.kr/api/workshop-bookings/search-nearby?lat=37.5665&lng=126.9780&radius=10"

# 3. 공방 스케줄 조회
curl "https://www.aromapulse.kr/api/workshop-bookings/schedules/101"
```

**기대 결과:**
- 서울 검색: 3개 공방 반환 (거리순 정렬)
- 좌표 검색: 동일한 결과
- 스케줄 조회: 예약 가능한 날짜/시간 목록

## 📋 API 엔드포인트 전체 목록

| 엔드포인트 | 메소드 | 파라미터 | 설명 |
|-----------|--------|----------|------|
| `/api/workshop-bookings/search-nearby` | GET | `lat`, `lng`, `radius` | 위도/경도 기반 검색 |
| `/api/workshop-bookings/search-by-region` | GET | `region`, `radius` | 지역명 기반 검색 |
| `/api/workshop-bookings/schedules/:id` | GET | `from_date`, `to_date` | 예약 가능 일정 |
| `/api/workshop-bookings/create` | POST | JSON body | 새 예약 생성 |
| `/api/workshop-bookings/:id/icalendar` | GET | - | .ics 파일 다운로드 |
| `/api/workshop-bookings/user/:userId` | GET | - | 사용자 예약 목록 |
| `/api/workshop-bookings/:id/cancel` | PUT | JSON body | 예약 취소 |

## 🎯 다음 단계

### 프론트엔드 구현 필요:

1. **공방 검색 페이지**
   - 지역 선택 또는 현재 위치 사용
   - 지도에 공방 마커 표시
   - 거리순 목록 표시

2. **공방 상세 페이지**
   - 공방 정보 표시
   - 예약 가능 일정 캘린더
   - 예약 폼

3. **예약 완료 페이지**
   - 예약 정보 요약
   - "캘린더에 추가" 버튼 (iCalendar 다운로드)
   - 예약 확인 이메일 발송 안내

4. **내 예약 페이지**
   - 예약 목록 표시
   - 예약 상세 정보
   - 예약 취소 기능

### 지도 API 통합 (선택):

**범용 지도 (추천):**
- Kakao Map API (무료, 한국 지도 최적화)
- 또는 OpenStreetMap (무료, 오픈소스)

**플랫폼별 지도 (고급):**
- 네이버 지도 API (네이버 로그인 사용자)
- 카카오맵 API (카카오 로그인 사용자)
- Google Maps API (구글 로그인 사용자)

## 🔧 문제 해결

### "Table workshops has no column named latitude" 오류

**원인:** 마이그레이션이 적용되지 않았습니다.

**해결:** 위의 "방법 1: Cloudflare 대시보드" 가이드를 따라 마이그레이션 적용

### API 호출 시 404 오류

**원인:** 프로덕션 배포가 완료되지 않았거나 라우트가 등록되지 않았습니다.

**해결:**
```bash
# 재배포
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name aromapulse
```

### iCalendar 파일이 열리지 않음

**원인:** 일부 캘린더 앱은 HTTP 다운로드를 차단합니다.

**해결:** HTTPS URL 사용 확인 (https://www.aromapulse.kr)

## 📞 지원

문제가 발생하거나 추가 도움이 필요한 경우:
1. 로그 확인: `pm2 logs aromapulse-webapp --nostream`
2. 데이터베이스 상태 확인: Cloudflare D1 Console
3. API 테스트: `curl` 명령어로 직접 테스트

---

**Last Updated**: 2025-11-20  
**Version**: 1.8.0 - Universal Workshop Booking System  
**Status**: ✅ Backend Complete, Frontend Pending  
**Deployment**: https://www.aromapulse.kr
