# 프로덕션 데이터베이스 마이그레이션 - 간단 가이드

## ⚠️ 중요: 이 작업을 완료해야 예약 시스템이 작동합니다!

---

## 📋 방법 1: Cloudflare 대시보드 (추천) ✅

### 단계 1: Cloudflare 대시보드 접속
1. 브라우저에서 https://dash.cloudflare.com 접속
2. 로그인
3. 왼쪽 메뉴에서 **"Workers & Pages"** 클릭

### 단계 2: D1 데이터베이스 선택
1. 상단 탭에서 **"D1 SQL Database"** 클릭
2. `aromapulse-production` 데이터베이스 클릭

### 단계 3: Console 탭 열기
1. **"Console"** 탭 클릭
2. SQL 입력 창이 나타남

### 단계 4: SQL 스크립트 실행

**아래 SQL을 복사하여 Console 창에 붙여넣고 "Execute" 버튼 클릭:**

---

## 🔽 여기서부터 복사 시작 🔽

```sql
-- Step 1: Add location columns to workshops table
ALTER TABLE workshops ADD COLUMN latitude REAL;
ALTER TABLE workshops ADD COLUMN longitude REAL;
ALTER TABLE workshops ADD COLUMN detailed_address TEXT;
ALTER TABLE workshops ADD COLUMN postal_code TEXT;
ALTER TABLE workshops ADD COLUMN contact_phone TEXT;
ALTER TABLE workshops ADD COLUMN contact_email TEXT;
```

**실행 후 "Success" 확인** ✅

---

```sql
-- Step 2: Create workshop_schedules table
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
```

**실행 후 "Success" 확인** ✅

---

```sql
-- Step 3: Create workshop_bookings table
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  schedule_id INTEGER,
  user_id INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME,
  num_participants INTEGER DEFAULT 1,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  special_requests TEXT,
  price_per_person INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  cancelled_at DATETIME,
  completed_at DATETIME,
  cancellation_reason TEXT,
  cancelled_by TEXT CHECK(cancelled_by IN ('user', 'provider', 'admin', NULL)),
  icalendar_uid TEXT UNIQUE,
  icalendar_downloaded INTEGER DEFAULT 0,
  icalendar_downloaded_at DATETIME,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES workshop_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**실행 후 "Success" 확인** ✅

---

```sql
-- Step 4: Create booking_reminders table
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
```

**실행 후 "Success" 확인** ✅

---

```sql
-- Step 5: Create indexes
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

**실행 후 "Success" 확인** ✅

---

## 🔼 여기까지 복사 끝 🔼

---

## ✅ 완료 확인

모든 단계가 성공하면 **마이그레이션 완료!** 🎉

---

## 🧪 테스트 (선택사항)

마이그레이션 완료 후 다음 명령어로 API 테스트:

```bash
# 브라우저나 터미널에서:
curl "https://www.aromapulse.kr/api/workshop-bookings/search-by-region?region=서울"
```

**예상 결과**: 
```json
{
  "workshops": [],
  "message": "등록된 공방이 없습니다"
}
```

이 응답이 나오면 API가 정상 작동하는 것입니다! ✅

---

## 🗄️ 샘플 데이터 추가 (선택사항)

테스트를 위해 샘플 공방 데이터를 추가하려면:

### Cloudflare Console에서 실행:

```sql
-- 서울 공방 1개 추가
INSERT INTO workshops (
  id, provider_id, title, description, category, 
  location, address, detailed_address, postal_code,
  latitude, longitude,
  price, duration, max_participants, 
  contact_phone, contact_email, is_active
) VALUES (
  101, 1, '향기로운 하루 공방 (강남점)', 
  '강남역 근처에 위치한 아로마 테라피 전문 공방입니다.',
  '향수 만들기',
  '서울', '서울 강남구 테헤란로 123', '강남빌딩 3층', '06132',
  37.4979, 127.0276,
  50000, 120, 10,
  '02-1234-5678', 'gangnam@aromapulse.kr', 1
);

-- 스케줄 추가
INSERT INTO workshop_schedules (
  workshop_id, available_date, start_time, end_time, max_slots, booked_slots, is_available
) VALUES
  (101, date('now', '+1 day'), '10:00', '12:00', 10, 0, 1),
  (101, date('now', '+3 days'), '14:00', '16:00', 10, 0, 1);
```

**실행 후 다시 API 테스트:**
```bash
curl "https://www.aromapulse.kr/api/workshop-bookings/search-by-region?region=서울"
```

이제 강남점 공방이 검색 결과에 나타납니다! 🎉

---

## ❌ 문제 해결

### "no such column: latitude" 오류

**원인**: Step 1이 완료되지 않았습니다.

**해결**: Step 1의 ALTER TABLE 명령어를 다시 실행하세요.

---

### "table workshop_schedules already exists" 오류

**원인**: 이미 해당 테이블이 생성되었습니다.

**해결**: 정상입니다. 다음 단계로 진행하세요. `CREATE TABLE IF NOT EXISTS`는 중복 실행해도 안전합니다.

---

### API 호출 시 500 오류

**원인**: 모든 마이그레이션 단계가 완료되지 않았습니다.

**해결**: 
1. Console에서 `SELECT name FROM sqlite_master WHERE type='table';` 실행
2. `workshop_schedules`, `workshop_bookings`, `booking_reminders` 테이블이 있는지 확인
3. 없다면 해당 Step을 다시 실행

---

## 📞 추가 도움이 필요하면

1. Cloudflare D1 Console에서 `PRAGMA table_info(workshops);` 실행
2. `latitude`, `longitude` 컬럼이 있는지 확인
3. 없다면 Step 1부터 다시 실행

---

**완료 시간**: 약 5분  
**난이도**: ⭐⭐☆☆☆ (쉬움)  
**중요도**: ⭐⭐⭐⭐⭐ (필수!)
