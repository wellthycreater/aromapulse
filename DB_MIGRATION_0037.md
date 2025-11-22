# DB 마이그레이션 0037 적용 가이드

## 📋 마이그레이션 정보

**마이그레이션 파일**: `migrations/0037_add_gift_wrapping_option.sql`  
**목적**: 원데이 클래스 선물 포장 옵션 추가  
**적용 대상**: `workshop_quotes` 테이블

---

## 🎯 변경 사항

### 추가되는 컬럼
- `is_gift_wrapping`: INTEGER, DEFAULT 0
  - 0: 선물 포장 미선택
  - 1: 선물 포장 선택

### 추가되는 인덱스
- `idx_workshop_quotes_options`: (is_workation, is_gift_wrapping)
  - 옵션 조합별 빠른 조회를 위한 복합 인덱스

---

## 🚀 Cloudflare Dashboard에서 적용

### 1단계: Cloudflare Dashboard 접속

```
https://dash.cloudflare.com
```

1. **Workers & Pages** 클릭
2. **D1 SQL Database** 클릭
3. **aromapulse-production** 데이터베이스 선택
4. **Console** 탭 클릭

---

### 2단계: SQL 실행

#### 쿼리 1: is_gift_wrapping 컬럼 추가

**Console에 복사하여 실행:**
```sql
ALTER TABLE workshop_quotes ADD COLUMN is_gift_wrapping INTEGER DEFAULT 0;
```

**기대 결과:**
```
✅ Success
```

---

#### 쿼리 2: 인덱스 생성

**Console에 복사하여 실행:**
```sql
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_options ON workshop_quotes(is_workation, is_gift_wrapping);
```

**기대 결과:**
```
✅ Success
```

---

### 3단계: 검증

#### 검증 쿼리 1: 테이블 구조 확인

```sql
PRAGMA table_info(workshop_quotes);
```

**확인 사항:**
- `is_gift_wrapping` 컬럼이 목록에 표시되어야 함
- type: `INTEGER`
- dflt_value: `0`

#### 검증 쿼리 2: 인덱스 확인

```sql
PRAGMA index_list(workshop_quotes);
```

**확인 사항:**
- `idx_workshop_quotes_options` 인덱스가 목록에 표시되어야 함

#### 검증 쿼리 3: 기존 데이터 확인

```sql
SELECT COUNT(*) as total_quotes, 
       SUM(CASE WHEN is_gift_wrapping = 0 THEN 1 ELSE 0 END) as without_gift_wrapping,
       SUM(CASE WHEN is_gift_wrapping = 1 THEN 1 ELSE 0 END) as with_gift_wrapping
FROM workshop_quotes;
```

**기대 결과:**
- `total_quotes`: 기존 견적 수
- `without_gift_wrapping`: 전체 (모두 0으로 초기화)
- `with_gift_wrapping`: 0

---

## 🔄 Wrangler CLI로 적용 (대안)

### 로컬에서 테스트

```bash
# 로컬 D1 데이터베이스에 적용 (테스트)
npx wrangler d1 execute aromapulse-production --local --file=migrations/0037_add_gift_wrapping_option.sql
```

### 프로덕션 적용

```bash
# 프로덕션 D1 데이터베이스에 적용
npx wrangler d1 execute aromapulse-production --file=migrations/0037_add_gift_wrapping_option.sql
```

**주의**: 프로덕션 적용 전 반드시 로컬에서 테스트하세요!

---

## ✅ 마이그레이션 완료 체크리스트

- [ ] `is_gift_wrapping` 컬럼 추가 완료
- [ ] `idx_workshop_quotes_options` 인덱스 생성 완료
- [ ] PRAGMA table_info로 컬럼 확인
- [ ] PRAGMA index_list로 인덱스 확인
- [ ] 기존 데이터 모두 is_gift_wrapping=0으로 초기화 확인

---

## 🧪 마이그레이션 후 테스트

### 1. 원데이 클래스 견적 제출 테스트

**페이지 접속:**
```
https://www.aromapulse.kr/static/class-detail.html?id=1
```

**테스트 시나리오:**
1. 선물 포장 서비스 체크박스 선택
2. 필수 정보 입력
3. 견적 문의 제출
4. 데이터베이스 확인:
   ```sql
   SELECT * FROM workshop_quotes ORDER BY created_at DESC LIMIT 1;
   ```
5. `is_gift_wrapping = 1` 확인

### 2. 워크샵 견적 제출 테스트

**페이지 접속:**
```
https://www.aromapulse.kr/static/workshop-detail.html?id=1
```

**테스트 시나리오:**
1. 향기 테마 워케이션 체크박스 선택
2. 필수 정보 입력
3. 견적 문의 제출
4. 데이터베이스 확인:
   ```sql
   SELECT * FROM workshop_quotes ORDER BY created_at DESC LIMIT 1;
   ```
5. `is_workation = 1`, `is_gift_wrapping = 0` 확인

### 3. 옵션 조합 쿼리 테스트

```sql
-- 선물 포장만 선택한 견적
SELECT * FROM workshop_quotes 
WHERE is_gift_wrapping = 1 AND is_workation = 0;

-- 워케이션만 선택한 견적
SELECT * FROM workshop_quotes 
WHERE is_gift_wrapping = 0 AND is_workation = 1;

-- 옵션 없는 견적
SELECT * FROM workshop_quotes 
WHERE is_gift_wrapping = 0 AND is_workation = 0;
```

---

## ⚠️ 롤백 방법 (필요시)

### 컬럼 삭제
```sql
-- SQLite는 컬럼 삭제를 직접 지원하지 않음
-- 테이블 재생성 필요

-- 1. 백업 테이블 생성
CREATE TABLE workshop_quotes_backup AS 
SELECT id, workshop_id, company_name, company_industry, company_department,
       company_contact_position, company_contact_name, company_contact_phone,
       company_contact_email, participant_count, preferred_date,
       requested_instructors, special_requests, is_workation,
       status, quoted_price, admin_notes, created_at, updated_at
FROM workshop_quotes;

-- 2. 원본 테이블 삭제
DROP TABLE workshop_quotes;

-- 3. 백업에서 복원
ALTER TABLE workshop_quotes_backup RENAME TO workshop_quotes;

-- 4. 인덱스 재생성 (필요시)
-- 기존 인덱스들 재생성
```

**주의**: 롤백은 데이터 손실 위험이 있으므로 신중하게 수행하세요!

---

## 📝 마이그레이션 히스토리

| 번호 | 날짜 | 설명 | 상태 |
|------|------|------|------|
| 0036 | 2025-11-21 | 디바이스 추적 컬럼 추가 | ✅ 완료 |
| **0037** | **2025-11-21** | **선물 포장 옵션 추가** | **⏳ 대기** |

---

## 🆘 문제 해결

### 오류: "duplicate column name"
```
이미 is_gift_wrapping 컬럼이 존재합니다.
→ 마이그레이션이 이미 적용되었습니다. 검증 쿼리로 확인하세요.
```

### 오류: "no such table: workshop_quotes"
```
테이블이 존재하지 않습니다.
→ 이전 마이그레이션(0034)이 적용되지 않았을 수 있습니다.
→ migrations/0034_workshop_location_and_bookings.sql 먼저 적용하세요.
```

### 오류: "index already exists"
```
인덱스가 이미 존재합니다.
→ 정상입니다. IF NOT EXISTS 구문으로 중복 생성을 방지합니다.
```

---

**작성일**: 2025-11-21  
**마이그레이션 파일**: `migrations/0037_add_gift_wrapping_option.sql`  
**적용 대상**: aromapulse-production (Cloudflare D1)
