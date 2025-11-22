# 🔧 DB 오류 해결: workshop_quotes 테이블 없음

## ❌ 오류 메시지
```
no such table: workshop_quotes: SQLITE_ERROR
```

## ✅ 해결 방법

### 1단계: 프로덕션 DB 상태 확인

**Cloudflare Dashboard Console에서 실행:**
```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

**workshop_quotes 테이블이 목록에 있나요?**

---

### 2단계-A: 테이블이 **없는** 경우 (오류 발생)

**workshop_quotes 테이블을 생성해야 합니다.**

#### 최소한의 테이블 생성 (간단 버전)

**Cloudflare Console에서 하나씩 실행:**

```sql
CREATE TABLE IF NOT EXISTS workshop_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  company_name TEXT,
  company_contact_name TEXT NOT NULL,
  company_contact_phone TEXT NOT NULL,
  company_contact_email TEXT NOT NULL,
  company_department TEXT,
  company_industry TEXT,
  company_contact_position TEXT,
  participant_count INTEGER NOT NULL,
  preferred_date TEXT,
  requested_instructors TEXT,
  special_requests TEXT,
  is_workation INTEGER DEFAULT 0,
  is_gift_wrapping INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  quoted_price INTEGER,
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Execute 클릭 → ✅ Success 확인**

---

**인덱스 생성:**

```sql
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_workshop ON workshop_quotes(workshop_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_user ON workshop_quotes(user_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_status ON workshop_quotes(status);
```

```sql
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_options ON workshop_quotes(is_workation, is_gift_wrapping);
```

**각 쿼리마다 Execute 클릭 → ✅ Success 확인**

---

### 2단계-B: 테이블이 **있는** 경우

**is_gift_wrapping 컬럼만 추가하면 됩니다.**

```sql
ALTER TABLE workshop_quotes ADD COLUMN is_gift_wrapping INTEGER DEFAULT 0;
```

**Execute 클릭 → ✅ Success 확인**

---

**인덱스 생성:**

```sql
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_options ON workshop_quotes(is_workation, is_gift_wrapping);
```

**Execute 클릭 → ✅ Success 확인**

---

## 3단계: 검증

**테이블 구조 확인:**
```sql
PRAGMA table_info(workshop_quotes);
```

**확인 사항:**
- ✅ `is_workation` 컬럼 존재
- ✅ `is_gift_wrapping` 컬럼 존재

**인덱스 확인:**
```sql
PRAGMA index_list(workshop_quotes);
```

**확인 사항:**
- ✅ `idx_workshop_quotes_options` 인덱스 존재

---

## 4단계: 배포 확인

**프론트엔드 테스트:**
1. 원데이 클래스 페이지 접속
2. 견적 문의 제출 테스트
3. 데이터베이스 확인:
   ```sql
   SELECT * FROM workshop_quotes ORDER BY created_at DESC LIMIT 1;
   ```

---

## 🎯 빠른 요약

### Case 1: workshop_quotes 테이블 없음
```sql
-- 1. 테이블 생성 (위의 CREATE TABLE 쿼리 실행)
-- 2. 인덱스 4개 생성
-- 3. 검증
```

### Case 2: workshop_quotes 테이블 있음
```sql
-- 1. is_gift_wrapping 컬럼 추가
ALTER TABLE workshop_quotes ADD COLUMN is_gift_wrapping INTEGER DEFAULT 0;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_options ON workshop_quotes(is_workation, is_gift_wrapping);

-- 3. 검증
PRAGMA table_info(workshop_quotes);
```

---

## ⚠️ 주의사항

1. **각 쿼리를 하나씩 실행**하세요
2. **Execute 버튼**을 클릭하여 실행하세요
3. **Success 메시지**를 확인하세요
4. **여러 줄을 동시에 실행하지 마세요**

---

## 🆘 추가 도움말

### 더 자세한 가이드
- `MIGRATION_0003_CREATE_TABLES.txt` - 전체 테이블 생성
- `DB_MIGRATION_0037_STEP_BY_STEP.txt` - 컬럼 추가만
- `CHECK_PRODUCTION_DB.txt` - DB 상태 확인

### 문제가 계속되면
1. 모든 테이블 목록 확인:
   ```sql
   SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
   ```

2. workshops 테이블 확인:
   ```sql
   SELECT * FROM workshops LIMIT 1;
   ```

3. users 테이블 확인:
   ```sql
   SELECT COUNT(*) FROM users;
   ```

---

**작성일**: 2025-11-21  
**문제**: workshop_quotes 테이블 없음  
**해결**: 테이블 생성 또는 컬럼 추가
