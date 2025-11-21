# 프로덕션 데이터베이스 마이그레이션 가이드 (v1.7.5)

## 🎯 목적
회원 관리 패널에 디바이스 트래킹 기능을 추가하기 위해 `users` 테이블에 5개의 새로운 컬럼을 추가합니다.

## 📋 마이그레이션 내용

### 추가할 컬럼
1. `last_device_type` - 최근 접속 디바이스 타입 (mobile, tablet, desktop)
2. `last_os` - 최근 접속 운영체제 (iOS, Android, Windows, macOS 등)
3. `last_browser` - 최근 접속 브라우저 (Chrome, Safari, Firefox 등)
4. `last_ip` - 최근 접속 IP 주소
5. `last_user_agent` - 최근 User Agent 전체 문자열

## 🚀 적용 방법

### 방법 1: Cloudflare Dashboard (추천) ⭐

**가장 안전하고 빠른 방법입니다.**

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com 로그인
   - Workers & Pages → D1 메뉴 선택

2. **데이터베이스 선택**
   - `aromapulse-production` 데이터베이스 클릭

3. **Console 탭 이동**
   - 상단 탭에서 "Console" 선택

4. **SQL 실행**
   - 아래 SQL을 복사하여 붙여넣기
   - "Execute" 버튼 클릭

```sql
-- Migration 0036: Add device tracking columns to users table
ALTER TABLE users ADD COLUMN last_device_type TEXT;
ALTER TABLE users ADD COLUMN last_os TEXT;
ALTER TABLE users ADD COLUMN last_browser TEXT;
ALTER TABLE users ADD COLUMN last_ip TEXT;
ALTER TABLE users ADD COLUMN last_user_agent TEXT;
```

5. **실행 결과 확인**
   - 5개의 ALTER TABLE 명령이 모두 성공했는지 확인
   - 에러가 있다면 이미 컬럼이 존재하는 것일 수 있음 (정상)

6. **검증**
   - 다음 쿼리로 컬럼이 정상적으로 추가되었는지 확인:
```sql
PRAGMA table_info(users);
```

---

### 방법 2: Wrangler CLI (API 키 필요)

**Cloudflare API 키가 설정되어 있어야 합니다.**

1. **API 키 확인**
   ```bash
   npx wrangler whoami
   ```
   - 로그인되어 있지 않다면 API 키를 먼저 설정하세요

2. **마이그레이션 적용**
   ```bash
   cd /home/user/webapp
   npx wrangler d1 migrations apply aromapulse-production
   ```

3. **검증**
   ```bash
   npx wrangler d1 execute aromapulse-production --command="PRAGMA table_info(users);"
   ```

---

## ✅ 검증 방법

마이그레이션 적용 후 다음을 확인하세요:

### 1. 컬럼 추가 확인
```sql
PRAGMA table_info(users);
```

다음 컬럼들이 목록에 나타나야 합니다:
- `last_device_type`
- `last_os`
- `last_browser`
- `last_ip`
- `last_user_agent`

### 2. 데이터 확인
```sql
SELECT id, email, last_device_type, last_os, last_browser 
FROM users 
LIMIT 5;
```

기존 사용자들은 모두 `NULL` 값으로 표시됩니다 (정상).
다음 로그인 시 자동으로 값이 업데이트됩니다.

### 3. 프로덕션 웹사이트 확인
- https://www.aromapulse.kr/admin-users 접속
- 관리자 로그인
- 회원 목록에서 "디바이스" 및 "OS/브라우저" 컬럼 확인

---

## 🔧 문제 해결

### 에러: "duplicate column name"
- **원인**: 컬럼이 이미 존재함
- **해결**: 정상 상태입니다. 마이그레이션이 이미 적용되었습니다.

### 에러: "no such table: users"
- **원인**: 잘못된 데이터베이스에 접속
- **해결**: `aromapulse-production` 데이터베이스인지 확인

### API 키 에러
- **원인**: Cloudflare API 인증 실패
- **해결**: 방법 1 (Dashboard 사용) 추천

---

## 📊 적용 후 기대 효과

**즉시 확인 가능**:
- ✅ 관리자 페이지에 디바이스/OS/브라우저 컬럼 표시
- ✅ 사용자 로그인 시 자동으로 정보 수집 시작
- ✅ 기존 사용자는 다음 로그인 시부터 데이터 표시

**데이터 수집 시작**:
- 로그인할 때마다 최신 디바이스 정보 업데이트
- 모바일/태블릿/데스크톱 사용 패턴 분석 가능
- OS 및 브라우저 통계 확인 가능

---

## 📞 지원

마이그레이션 중 문제가 발생하면:
1. 에러 메시지 전체 복사
2. 실행한 방법 명시 (Dashboard or CLI)
3. 개발자에게 문의

---

**마지막 업데이트**: 2025-11-21  
**마이그레이션 버전**: 0036  
**파일 위치**: `/home/user/webapp/migrations/0036_add_device_tracking.sql`
