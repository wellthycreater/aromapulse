# 예약 테이블 설정 가이드

## 🎯 목적
프로덕션 데이터베이스에 `reservations` 테이블을 생성하여 예약 기능을 활성화합니다.

## ⚠️ 에러 메시지
```
D1_ERROR: no such table: reservations: SQLITE_ERROR
```

이 에러는 `reservations` 테이블이 프로덕션 DB에 없어서 발생합니다.

---

## 🔧 해결 방법

### 1단계: Cloudflare D1 Console 접속

```
https://dash.cloudflare.com/
```

1. **Workers & Pages** 클릭
2. **D1** 선택
3. **aromapulse-production** 데이터베이스 클릭
4. **Console** 탭 클릭

---

### 2단계: 테이블 생성 SQL 실행

**아래 SQL을 복사하여 Console에 붙여넣고 Execute 클릭:**

```sql
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  class_id INTEGER,
  product_id INTEGER,
  reservation_type TEXT NOT NULL CHECK(reservation_type IN ('class', 'product')),
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  special_request TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES oneday_classes(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

✅ **"Success"** 메시지가 표시되면 다음 단계로 진행

---

### 3단계: 인덱스 생성

**아래 SQL을 한 줄씩 실행 (각각 Execute 클릭):**

#### 인덱스 1: 사용자 ID
```sql
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
```

#### 인덱스 2: 클래스 ID
```sql
CREATE INDEX IF NOT EXISTS idx_reservations_class_id ON reservations(class_id);
```

#### 인덱스 3: 상품 ID
```sql
CREATE INDEX IF NOT EXISTS idx_reservations_product_id ON reservations(product_id);
```

#### 인덱스 4: 예약 날짜
```sql
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
```

#### 인덱스 5: 예약 상태
```sql
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
```

---

### 4단계: 확인

**테이블이 생성되었는지 확인:**

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='reservations';
```

**예상 결과:**
```
name
-----------
reservations
```

**테이블 구조 확인:**

```sql
PRAGMA table_info(reservations);
```

**예상 결과:** 15개 컬럼 (id, user_id, class_id, product_id, ...)

---

## ✅ 설정 완료 후 테스트

### 1️⃣ 쇼핑 페이지 예약 테스트
```
https://aromapulse.pages.dev/shop
```
1. 상품의 **🗓️ 예약 버튼** 클릭
2. 예약 정보 입력:
   - 날짜: 내일 이후
   - 시간: 원하는 시간
   - 인원: 1명 이상
   - 연락처 정보
3. **예약 확정** 클릭

**예상 결과:**
```
🎉 예약이 완료되었습니다!

예약번호: 1
일시: 2025-12-01 14:00
인원: 1명
```

### 2️⃣ 힐링 체험 예약 테스트
```
https://aromapulse.pages.dev/static/healing
```
1. 공방 카드의 **예약하기 버튼** 클릭
2. 예약 정보 입력
3. **예약 확정** 클릭

---

## 📊 예약 데이터 확인

### 예약 목록 조회
```sql
SELECT * FROM reservations ORDER BY created_at DESC LIMIT 10;
```

### 사용자별 예약 수
```sql
SELECT user_id, COUNT(*) as reservation_count 
FROM reservations 
GROUP BY user_id;
```

### 오늘 예약 목록
```sql
SELECT * FROM reservations 
WHERE reservation_date = DATE('now') 
ORDER BY reservation_time;
```

---

## 🔍 문제 해결

### 여전히 에러가 발생하는 경우

1. **브라우저 캐시 삭제**: `Ctrl + Shift + R`
2. **로그아웃 후 재로그인**:
   ```
   https://aromapulse.pages.dev/logout
   https://aromapulse.pages.dev/auth/naver
   ```
3. **브라우저 콘솔 확인** (F12 → Console):
   ```
   ✅ [Reservation] Created reservation ID: 1 for user 1
   ```

### 테이블은 있는데 예약이 안 되는 경우

**컬럼 확인:**
```sql
PRAGMA table_info(reservations);
```

모든 컬럼이 있는지 확인하세요:
- id
- user_id
- class_id
- product_id
- reservation_type
- reservation_date
- reservation_time
- participants
- contact_name
- contact_phone
- contact_email
- special_request
- status
- created_at
- updated_at

---

## 📝 참고사항

- **예약 상태**: pending → confirmed → completed (또는 cancelled)
- **네이버 캘린더 연동**: 체크박스 선택 시 자동 연동
- **예약 내역 확인**: 마이페이지에서 확인 가능

---

**작성일:** 2025-11-25  
**버전:** 1.0  
**관련 파일:** 
- `migrations/0003_create_reservations.sql`
- `src/routes/reservations.ts`
- `public/static/reservation-booking.js`
