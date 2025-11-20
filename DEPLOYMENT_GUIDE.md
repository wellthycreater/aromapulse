# 🚀 Cloudflare Pages 배포 가이드

## 📋 배포 전 체크리스트

### ✅ 완료된 작업
- [x] 회원가입 폼 보라-핑크 그라데이션 테마로 리디자인 완료
- [x] 관리자 대시보드 업데이트 (33개 샘플 사용자 데이터)
- [x] 모든 스트레스 카테고리 반영 완료
- [x] SNS/O2O 전환 분석 차트 수정 완료
- [x] 빌드 성공 확인 (`dist/` 디렉토리 생성)
- [x] Git 커밋 완료

### 📦 배포 준비 완료
- 프로젝트 빌드: ✅ 완료 (`npm run build`)
- Git 저장소: ✅ 최신 상태
- 환경 설정: ✅ wrangler.jsonc 확인됨

---

## 🔑 Step 1: Cloudflare API 키 설정

### Deploy 탭에서 API 키 설정
1. 왼쪽 사이드바에서 **Deploy** 탭 클릭
2. Cloudflare API 키 생성 및 입력
3. 저장 후 `setup_cloudflare_api_key` 도구 실행 확인

---

## 🚀 Step 2: 프로덕션 배포

### 배포 명령어
\`\`\`bash
# 1. 프로젝트 디렉토리로 이동
cd /home/user/webapp

# 2. 최종 빌드
npm run build

# 3. Cloudflare Pages에 배포 (main 브랜치)
npx wrangler pages deploy dist --project-name aromapulse --branch main

# 또는 package.json의 스크립트 사용
npm run deploy:prod
\`\`\`

### 배포 후 확인 사항
- ✅ https://www.aromapulse.kr - 메인 사이트
- ✅ https://www.aromapulse.kr/signup - 회원가입 페이지 (새 디자인)
- ✅ https://www.aromapulse.kr/static/admin-dashboard - 관리자 대시보드

---

## 📊 Step 3: 데이터베이스 마이그레이션 (프로덕션)

### 프로덕션 데이터베이스에 샘플 데이터 삽입
\`\`\`bash
# 1. SNS/O2O 데이터 삽입
npx wrangler d1 execute aromapulse-production --remote --file=./seed_sample_data.sql

# 2. 사용자 데이터 삽입
npx wrangler d1 execute aromapulse-production --remote --file=./seed_users_data.sql

# 3. 데이터 확인
npx wrangler d1 execute aromapulse-production --remote --command="SELECT COUNT(*) as count FROM users;"
\`\`\`

---

## 🎨 주요 변경 사항

### 1. 회원가입 페이지 리디자인
- **테마**: 보라-핑크 그라데이션 (www.aromapulse.kr 메인 사이트와 동일)
- **효과**: 글래스모피즘 (glassmorphism) 카드
- **개선점**:
  - 더 세련된 프로그레스 바 (그라데이션 효과)
  - 아이콘 추가로 시각적 가독성 향상
  - 호버 효과 및 애니메이션 추가
  - 모바일 반응형 개선
  - 버튼 그라데이션 효과

### 2. 관리자 대시보드 업데이트
- **샘플 데이터**: 33명의 사용자 (모든 카테고리 포괄)
- **차트 수정**: SNS별 O2O 전환율 차트 정상 작동
- **API 개선**: 테이블 없을 때 에러 처리 강화

### 3. 스트레스 카테고리 반영
- **직무 스트레스 - 직장인 (9개)**: IT·개발자, 디자인·기획, 교육·강사, 의료·복지, 서비스·고객응대, 제조·생산, 공공·행정, 영업·마케팅, 연구·기술
- **직무 스트레스 - 독립 직군 (4개)**: 자영업자, 프리랜서, 창업자/스타트업, 크리에이터/인플루언서
- **일상 스트레스 - 학생 (4개)**: 중학생, 고등학생, 대학생, 대학원생
- **일상 스트레스 - 구직자 (4개)**: 신규 졸업자, 경력 전환자, 장기 구직자, 고시 준비자
- **일상 스트레스 - 양육자 (4개)**: 워킹맘, 워킹대디, 전업 양육자, 한부모

---

## 🔍 배포 후 테스트

### 1. 회원가입 페이지
\`\`\`
URL: https://www.aromapulse.kr/signup
\`\`\`
- [ ] 보라-핑크 그라데이션 배경 확인
- [ ] 글래스모피즘 카드 효과 확인
- [ ] 프로그레스 바 그라데이션 확인
- [ ] Step 1: B2C/B2B 선택 (아이콘 및 호버 효과)
- [ ] Step 2: 기본 정보 입력 (입력 필드 포커스 효과)
- [ ] Step 3: 상세 정보 (모든 카테고리 옵션 표시)
- [ ] 모바일 반응형 확인

### 2. 관리자 대시보드
\`\`\`
URL: https://www.aromapulse.kr/static/admin-dashboard
\`\`\`
- [ ] 전체 개요 탭: 33명 사용자 데이터 표시
- [ ] 세부 분석 탭:
  - [ ] 직무 스트레스 업종별 분포 (13개 카테고리)
  - [ ] 일상 스트레스 상황별 분포 (12개 카테고리)
  - [ ] SNS 채널별 유입 차트
  - [ ] SNS별 O2O 전환율 차트 ✅
  - [ ] 온라인→오프라인 전환 (공방별)
- [ ] 회원 관리 탭: 33명 샘플 사용자 테이블

### 3. API 엔드포인트
\`\`\`bash
# 대시보드 통계
curl https://www.aromapulse.kr/api/admin/dashboard/stats

# 사용자 분석
curl https://www.aromapulse.kr/api/user-analytics/stats

# SNS 통계
curl https://www.aromapulse.kr/api/admin/sns/stats

# O2O 통계
curl https://www.aromapulse.kr/api/admin/o2o/stats
\`\`\`

---

## 📝 주의사항

### 로컬 vs 프로덕션 데이터베이스
- **로컬**: `.wrangler/state/v3/d1/` (개발용)
- **프로덕션**: Cloudflare D1 (실제 운영)
- 프로덕션 배포 후 데이터가 없다면 위의 마이그레이션 명령어로 샘플 데이터 삽입

### 환경 변수
- 로컬 개발: `.dev.vars` 파일 사용
- 프로덕션: Cloudflare Pages 대시보드에서 환경 변수 설정

### 커스텀 도메인
- 현재 도메인: www.aromapulse.kr
- DNS 설정: Cloudflare에서 관리
- SSL/TLS: 자동 적용

---

## 🆘 문제 해결

### 배포 실패 시
\`\`\`bash
# 1. 빌드 디렉토리 확인
ls -la dist/

# 2. wrangler 버전 확인
npx wrangler --version

# 3. 인증 확인
npx wrangler whoami

# 4. 로그 확인
npx wrangler pages deploy dist --project-name aromapulse --verbose
\`\`\`

### API 에러 시
- Cloudflare Pages 대시보드에서 로그 확인
- Functions 탭에서 실시간 로그 모니터링

---

## 📞 지원

문제가 발생하면:
1. Git 이력 확인: `git log --oneline`
2. 최근 변경사항 검토: `git diff HEAD~1`
3. 롤백 필요 시: `git revert HEAD`

---

**배포 준비 완료! ✨**
