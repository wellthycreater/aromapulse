# 프로덕션 배포 가이드

## 📋 배포 체크리스트

### ✅ 완료된 작업
- [x] 디바이스 추적 기능 구현
- [x] 원데이 클래스 vs 워크샵 기능 구분
- [x] 선물 포장 옵션 추가
- [x] 데이터베이스 마이그레이션 파일 생성 (0037)
- [x] 프로덕션 빌드 완료

### ⏳ 배포 필요 작업
- [ ] GitHub에 코드 푸시
- [ ] Cloudflare Pages 배포
- [ ] 프로덕션 DB 마이그레이션 적용
- [ ] 배포 확인

---

## 🔄 1단계: GitHub 푸시

### 방법 1: GitHub CLI 사용 (추천)
```bash
# 1. GitHub 환경 설정 (Deploy 탭에서 설정 필요)
# setup_github_environment 실행

# 2. 원격 저장소 확인
cd /home/user/webapp
git remote -v

# 3. 메인 브랜치에 푸시
git push origin main
```

### 방법 2: 수동 푸시
```bash
# 1. GitHub Personal Access Token 생성
# https://github.com/settings/tokens

# 2. 원격 저장소 추가 (없는 경우)
cd /home/user/webapp
git remote add origin https://github.com/YOUR_USERNAME/aromapulse.git

# 3. 푸시
git push -u origin main
```

---

## 🚀 2단계: Cloudflare Pages 배포

### 준비사항
1. **Cloudflare API Token 설정** (Deploy 탭)
2. **cloudflare_project_name 확인**

### 배포 명령어
```bash
# 1. Cloudflare 인증 확인
npx wrangler whoami

# 2. 프로젝트 이름 확인 (meta_info에서)
# cloudflare_project_name: aromapulse

# 3. 빌드 (이미 완료됨)
npm run build

# 4. 배포
npx wrangler pages deploy dist --project-name aromapulse

# 또는 npm script 사용
npm run deploy:prod
```

### 배포 결과
```
✨ Success! Uploaded X files

🌍 Production URL: https://aromapulse.pages.dev
📝 Branch URL: https://main.aromapulse.pages.dev
```

---

## 💾 3단계: 프로덕션 DB 마이그레이션

### 마이그레이션 파일: `migrations/0037_add_gift_wrapping_option.sql`

### Cloudflare Dashboard에서 적용

**1. Cloudflare Dashboard 접속**
```
https://dash.cloudflare.com
```

**2. D1 Database 선택**
- Workers & Pages → D1 SQL Database
- `aromapulse-production` 선택
- **Console** 탭 클릭

**3. 마이그레이션 SQL 실행**

#### 쿼리 1: 컬럼 추가
```sql
ALTER TABLE workshop_quotes ADD COLUMN is_gift_wrapping INTEGER DEFAULT 0;
```
**✅ Execute 클릭 → 성공 확인**

#### 쿼리 2: 인덱스 생성
```sql
CREATE INDEX IF NOT EXISTS idx_workshop_quotes_options ON workshop_quotes(is_workation, is_gift_wrapping);
```
**✅ Execute 클릭 → 성공 확인**

**4. 검증 쿼리**
```sql
PRAGMA table_info(workshop_quotes);
```
**✅ is_gift_wrapping 컬럼 확인**

---

## ✅ 4단계: 배포 확인

### 프론트엔드 확인

**1. 원데이 클래스 페이지**
```
https://www.aromapulse.kr/static/class-detail.html?id=1
```
**확인 사항:**
- ✅ 조향사만 표시 (선택 불가)
- ✅ 선물 포장 서비스 체크박스 표시
- ✅ 향기 테마 워케이션 없음

**2. 워크샵 페이지**
```
https://www.aromapulse.kr/static/workshop-detail.html?id=1
```
**확인 사항:**
- ✅ 강사 선택 드롭다운 표시
- ✅ 향기 테마 워케이션 체크박스 표시
- ✅ 선물 포장 없음

### 백엔드 확인

**1. 원데이 클래스 견적 테스트**
```bash
# 테스트 데이터
{
  "workshop_id": 1,
  "contact_name": "테스트",
  "contact_phone": "010-1234-5678",
  "contact_email": "test@example.com",
  "participant_count": 2,
  "requested_instructors": "[{\"type\":\"perfumer\",\"count\":1}]",
  "is_gift_wrapping": 1,
  "is_workation": 0
}
```

**2. 데이터베이스 확인**
```sql
SELECT 
  id,
  workshop_id,
  participant_count,
  is_gift_wrapping,
  is_workation
FROM workshop_quotes 
ORDER BY created_at DESC 
LIMIT 5;
```

### 디바이스 추적 확인

**1. 회원가입 테스트**
- 새 계정 회원가입
- 디바이스 정보 저장 확인

**2. 관리자 대시보드 확인**
```
https://www.aromapulse.kr/static/admin-dashboard
```
- 회원 관리 탭
- 디바이스 배지 표시 확인

---

## 🔧 Wrangler 명령어 참조

### 프로젝트 확인
```bash
# 인증 상태 확인
npx wrangler whoami

# 프로젝트 목록
npx wrangler pages project list

# 프로젝트 정보
npx wrangler pages project get aromapulse
```

### 배포 관련
```bash
# 현재 배포 상태
npx wrangler pages deployment list --project-name aromapulse

# 배포 롤백 (필요시)
npx wrangler pages deployment tail --project-name aromapulse
```

### D1 데이터베이스
```bash
# 데이터베이스 목록
npx wrangler d1 list

# 마이그레이션 적용
npx wrangler d1 migrations apply aromapulse-production

# 데이터베이스 쿼리
npx wrangler d1 execute aromapulse-production --command="SELECT * FROM workshop_quotes LIMIT 5"
```

---

## 📊 배포 후 모니터링

### Cloudflare Pages 로그
```
https://dash.cloudflare.com
→ Workers & Pages
→ aromapulse
→ Logs
```

### 주요 확인 사항
1. **빌드 성공**: Build log에서 에러 없는지 확인
2. **배포 성공**: Deployment status가 "Success"인지 확인
3. **페이지 로딩**: 모든 페이지가 정상 로드되는지 확인
4. **API 작동**: 견적 문의 등 API가 정상 작동하는지 확인

---

## ⚠️ 문제 해결

### 배포 실패 시
```bash
# 로그 확인
npx wrangler pages deployment tail --project-name aromapulse

# 캐시 정리 후 재배포
rm -rf dist .wrangler
npm run build
npm run deploy:prod
```

### 마이그레이션 실패 시
```bash
# 로컬에서 테스트
npx wrangler d1 execute aromapulse-production --local --file=migrations/0037_add_gift_wrapping_option.sql

# 프로덕션 적용
npx wrangler d1 execute aromapulse-production --file=migrations/0037_add_gift_wrapping_option.sql
```

### 디바이스 추적 안 될 시
```sql
-- 컬럼 확인
PRAGMA table_info(users);

-- 누락된 컬럼 추가 (필요시)
ALTER TABLE users ADD COLUMN last_device_type TEXT;
ALTER TABLE users ADD COLUMN last_os TEXT;
ALTER TABLE users ADD COLUMN last_browser TEXT;
ALTER TABLE users ADD COLUMN last_ip TEXT;
ALTER TABLE users ADD COLUMN last_user_agent TEXT;
```

---

## 📝 배포 완료 체크리스트

### 코드 배포
- [ ] GitHub에 최신 코드 푸시 완료
- [ ] Cloudflare Pages 배포 성공
- [ ] 배포 URL 확인 (https://aromapulse.pages.dev)

### 데이터베이스
- [ ] 마이그레이션 0037 적용 완료
- [ ] is_gift_wrapping 컬럼 추가 확인
- [ ] 인덱스 생성 확인

### 기능 테스트
- [ ] 원데이 클래스: 조향사만 + 선물 포장
- [ ] 워크샵: 강사 선택 + 워케이션
- [ ] 디바이스 추적 작동 확인
- [ ] 회원가입 시 디바이스 정보 저장 확인

### 관리자 대시보드
- [ ] 회원 디바이스 정보 표시 확인
- [ ] 5가지 디바이스 타입 배지 확인

---

## 🎉 배포 완료 후

### 사용자에게 안내
```
✨ 새로운 기능이 추가되었습니다!

🎨 원데이 클래스:
- 조향사와 함께하는 특별한 시간
- 선물 포장 서비스 선택 가능

🏢 워크샵:
- 전문가 선택 가능 (조향사 + 심리상담사/멘탈케어)
- 향기 테마 워케이션 옵션

📱 회원 관리:
- 모든 회원의 접속 디바이스 정보 확인 가능
```

---

**작성일**: 2025-11-21  
**배포 버전**: v1.2.0  
**주요 변경사항**: 
- 디바이스 추적 기능
- 원데이 클래스 vs 워크샵 구분
- 선물 포장 옵션 추가
