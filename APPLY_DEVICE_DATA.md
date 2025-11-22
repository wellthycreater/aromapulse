# 기존 사용자 디바이스 정보 업데이트 가이드

## 📋 목적
기존 25명의 사용자에게 임시 디바이스 정보를 할당하여 관리자 대시보드에서 즉시 확인 가능하도록 합니다.

## 🎯 할당 계획

### Desktop (9명)
- **사용자**: ID 1, 2, 13-15, 22-25
- **디바이스**: Windows 10 + Chrome 120
- **대상**: 관리자 및 직장인 (개발자, 디자이너, 금융, 관리직)

### Android (5명)
- **사용자**: ID 5, 8, 9, 17, 18
- **디바이스**: Android 13 + Chrome 120
- **대상**: 학생, 주부, 구직자, 간호사, 의료진

### iOS (7명)
- **사용자**: ID 6, 7, 12, 16, 19, 39, 40
- **디바이스**: iOS 17.2 + Safari 17
- **대상**: 학생, 엄마, 취준생, 서비스직, 선생님, 신규 가입자

### iPad (3명)
- **사용자**: ID 10, 11, 20
- **디바이스**: iPadOS 17.1 + Safari 17
- **대상**: 은퇴자, 돌봄, 교수

### Android Tablet (1명)
- **사용자**: ID 21
- **디바이스**: Android 13 + Chrome 120
- **대상**: 프리랜서

---

## 🚀 적용 방법

### Cloudflare Dashboard에서 적용 (추천)

**1. Cloudflare 접속**
```
https://dash.cloudflare.com
```

**2. D1 데이터베이스 선택**
- Workers & Pages → D1 SQL Database
- `aromapulse-production` 클릭

**3. Console 탭에서 SQL 실행**

**아래 SQL을 복사하여 실행:**

```sql
-- Desktop users (관리자 및 데스크톱 사용자)
UPDATE users SET 
  last_device_type = 'Desktop',
  last_os = 'Windows 10',
  last_browser = 'Chrome 120',
  last_ip = '127.0.0.1'
WHERE id IN (1, 2, 13, 14, 15, 22, 23, 24, 25);

-- Android users (Android 스마트폰 사용자)
UPDATE users SET 
  last_device_type = 'Android',
  last_os = 'Android 13',
  last_browser = 'Chrome 120',
  last_ip = '127.0.0.2'
WHERE id IN (5, 8, 9, 17, 18);

-- iOS users (iPhone 사용자)
UPDATE users SET 
  last_device_type = 'iOS',
  last_os = 'iOS 17.2',
  last_browser = 'Safari 17',
  last_ip = '127.0.0.3'
WHERE id IN (6, 7, 12, 16, 19, 39, 40);

-- iPad users (iPad 사용자)
UPDATE users SET 
  last_device_type = 'iPad',
  last_os = 'iPadOS 17.1',
  last_browser = 'Safari 17',
  last_ip = '127.0.0.4'
WHERE id IN (10, 11, 20);

-- Android Tablet users (Android 태블릿 사용자)
UPDATE users SET 
  last_device_type = 'Android Tablet',
  last_os = 'Android 13',
  last_browser = 'Chrome 120',
  last_ip = '127.0.0.5'
WHERE id IN (21);
```

**4. 검증 쿼리 실행**

```sql
-- 업데이트된 사용자 확인
SELECT 
  id, 
  name, 
  email, 
  last_device_type, 
  last_os, 
  last_browser
FROM users 
WHERE last_device_type IS NOT NULL
ORDER BY id;
```

**기대 결과:** 25명의 사용자 모두 디바이스 정보가 표시됨

---

## ✅ 확인 방법

### 관리자 대시보드에서 확인

**1. 접속**
```
https://www.aromapulse.kr/static/admin-dashboard
```

**2. 회원 관리 탭 클릭**

**3. 결과 확인**
- ✅ 모든 사용자의 "디바이스" 컬럼에 배지 표시
- ✅ "OS/브라우저" 컬럼에 정보 표시
- ✅ 5가지 디바이스 타입이 골고루 분포

---

## 📊 기대 결과

### 디바이스 분포
- 🖥️ Desktop: 9명 (36%)
- 🍎 iOS: 7명 (28%)
- 🤖 Android: 5명 (20%)
- 📱 iPad: 3명 (12%)
- 📱 Android Tablet: 1명 (4%)

### 관리자 대시보드 차트
차트에 5가지 디바이스 타입이 모두 표시되며, 실제 데이터와 일치합니다.

---

## ⚠️ 주의사항

**임시 데이터입니다:**
- 이 데이터는 테스트/시각화 목적입니다
- 사용자가 다시 로그인하면 **실제 디바이스 정보로 자동 업데이트**됩니다
- IP 주소는 로컬호스트(127.0.0.x)로 설정되어 있습니다

**실제 데이터 수집:**
- 다음 로그인부터 자동으로 실제 디바이스 정보가 수집됩니다
- User-Agent 파싱으로 정확한 디바이스/OS/브라우저 감지
- Cloudflare IP 헤더에서 실제 IP 주소 수집

---

## 🔧 관리자 로그인 문제 해결

**현재 문제:**
> "관리자는 계속 데스크톱으로 접속 시도해보고 있는데 표시가 안됨"

**원인 가능성:**
1. 프로덕션 DB에 마이그레이션 미적용
2. 로그인 라우트에서 디바이스 로깅 실패
3. 브라우저 캐시 문제

**해결 방법:**

### 1. DB 마이그레이션 확인
```sql
PRAGMA table_info(users);
```
- `last_device_type`, `last_os`, `last_browser`, `last_ip`, `last_user_agent` 컬럼이 있는지 확인
- 없다면 `MIGRATION_GUIDE.md` 참고하여 마이그레이션 0036 적용

### 2. 관리자 로그인 테스트
1. 완전히 로그아웃
2. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)
3. 새 시크릿/프라이빗 창에서 로그인
4. 회원 관리 페이지에서 본인 디바이스 정보 확인

### 3. 로그 확인
Cloudflare Pages 로그에서 `logUserLogin` 함수 실행 여부 확인

---

## 📝 완료 후

**SQL 실행 완료 후:**
1. ✅ 관리자 대시보드 새로고침
2. ✅ 회원 관리 탭에서 25명 모두 디바이스 정보 확인
3. ✅ 디바이스 통계 차트에 5가지 타입 표시 확인

**관리자 본인 디바이스 표시 안 될 경우:**
1. 위의 "관리자 로그인 문제 해결" 섹션 참고
2. 로그아웃 → 캐시 삭제 → 재로그인
3. 여전히 안 되면 DB 마이그레이션 확인 필요

---

**작성일**: 2025-11-21  
**파일**: `/home/user/webapp/update_device_data.sql`  
**가이드**: `/home/user/webapp/APPLY_DEVICE_DATA.md`
