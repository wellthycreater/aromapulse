# 아로마펄스 시장 테스트 플랫폼 (Lean MVP)

## 🏢 회사 정보

**브랜드**: 아로마펄스 (AromaPulse)  
**운영사**: 웰씨코리아 (Wellthy Korea)  
**향후 법인**: (주)센펄스 (Senpulse Co., Ltd.) - 법인 설립 예정

## 🎯 프로젝트 개요

**목적**: 불면, 우울, 불안 등 스트레스 관련 증상에 관심이 있는 B2C 사용자와 오프라인 중심 로컬 향기 공방·소규모 업체(B2B)를 온라인으로 연결하는 시장 테스트 플랫폼

**특징**:
- 텍스트 중심 데이터 수집 및 분석
- Rule 기반 추천 시스템 (AI 없이 운영)
- 자사 블로그 중심 유입 및 리뷰 수집
- 증상케어 제품 vs 리프레시 제품 구분

## 🌐 접속 URL

### 프로덕션 (Cloudflare Pages) ✅
- **메인 URL**: https://aromapulse.pages.dev
- **로그인**: https://aromapulse.pages.dev/login
- **회원가입**: https://aromapulse.pages.dev/signup
- **예정 도메인**: https://aromapulse.kr (연결 예정)

### 개발 환경 (Sandbox)
- **Frontend**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai
- **API Health Check**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/api/health

## 📋 현재 완료된 기능

### ✅ 핵심 기능
1. **회원 시스템 & OAuth 소셜 로그인**
   - B2C 사용자 (일반 스트레스형 / 직무 스트레스형)
   - B2B 사용자 (조향사 / 기업 / 가게)
   - 이메일/비밀번호 로그인
   - 네이버 소셜 로그인 ✅
   - 카카오 소셜 로그인 ✅
   - 구글 소셜 로그인 ✅
   - JWT 토큰 기반 인증
   - 다단계 회원가입 폼 (사용자 유형별 상세 정보 수집)

2. **제품 관리 시스템**
   - 증상케어 제품 (타사 공방)
     - 맞춤제작형 (상담 후 제작)
     - 완제품형 (즉시 구매 가능)
   - 리프레시 제품 (아로마펄스 자체 브랜드)
   - 상품 등록/수정/삭제 API
   - 재고 관리
   - 이미지 업로드 지원

3. **리뷰 시스템**
   - 자체 플랫폼 리뷰 작성
   - 블로그 댓글 수집 준비 완료
   - 수동 태깅 (감정/의도 분류)

4. **Rule 기반 추천 엔진**
   - 사용자 증상 + 지역 + 제품 타입 매칭
   - 추천 로그 자동 저장

5. **패치 신청 시스템**
   - 간단한 신청 폼
   - 상태 관리 (pending → approved → shipped → completed)

6. **BEFORE/AFTER 설문**
   - 스트레스 수준 측정 (1-10)
   - 수면 품질, 불안, 우울 레벨 추적

7. **관리자 기능**
   - 리뷰/댓글 수동 태깅
   - 상품 관리 (CRUD)
   - 패치 신청 관리
   - 대시보드 통계

8. **블로그 관리 시스템 (NEW v1.6.0)** ✅
   - 네이버 블로그 URL 입력을 통한 댓글 자동 수집
   - 실시간 댓글 크롤링 (시뮬레이션 모드 with fallback)
   - AI 댓글 분석 (감정, 사용자 타입, 의도, 키워드)
   - 구매 의도 댓글 자동 감지 및 챗봇 세션 생성
   - B2C/B2B 고객 자동 분류
   - **컨텍스트 기반 AI 응답**: 오일 사용 고객에게 추가 질문으로 정확한 니즈 파악
   - 블로그 포스트별 통계 대시보드
   - Admin 페이지 "블로그 관리" 탭 UI

## 🚀 블로그 댓글 수집 시스템 (v1.6.0)

### 기능 설명
- **실시간 댓글 크롤링**: 네이버 블로그 URL 입력 시 해당 포스트의 모든 댓글 자동 수집
- **네이버 댓글 API 활용 + 시뮬레이션 폴백**: 
  - 1차: 네이버 댓글 API 시도 (`apis.naver.com/commentBox`)
  - 2차: API 실패 시 실제 댓글 기반 시뮬레이션 데이터 생성
- **AI 자동 분석**:
  - 감정 분석 (positive, negative, neutral)
  - 사용자 유형 예측 (B2C, B2B) - 마사지/스파/고객 키워드 감지
  - 의도 파악 (구매의도, B2B문의, 가격문의, 문의, 긍정리뷰, 부정리뷰, 일반댓글)
  - 키워드 추출 (증상, 제품, 향료, 오일 종류 등)
- **인텔리전트 챗봇 자동 생성**: 
  - 구매 의도/B2B 문의 댓글 자동 감지
  - 맥락 기반 추가 질문 생성 (지역, 제품 형태, 사용 목적, 월 사용량 등)
  - B2B 고객: 마사지/스파 비즈니스 맞춤 응답
  - 지역 기반 공방 매칭 안내
- **통계 대시보드**: 블로그 포스트별 댓글 수, B2C/B2B 비율, 챗봇 세션 수 확인

### API 엔드포인트
```
POST /api/blog-reviews/crawl-from-url
{
  "url": "https://blog.naver.com/aromapulse/223879507099"
}

GET /api/blog-reviews/posts
- 블로그 포스트 목록 조회 (통계 포함)

GET /api/blog-reviews/posts/:post_id/comments
- 특정 포스트의 댓글 조회
```

### 테스트 방법
1. Admin 페이지 접속: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/admin-products
2. "블로그 관리" 탭 클릭
3. 네이버 블로그 URL 입력 (예: https://blog.naver.com/aromapulse/223879507099)
4. "댓글 수집 및 분석" 버튼 클릭
5. 수집 완료 후 통계 확인

### B2B 리드 응대 프로세스

**실제 댓글 예시**:
> "캐리어오일에 에센셜오일(베르가못, 라벤더)을 섞어서 목과 데콜테 마사지 해주고 있는데 손님 반응이 좋아요. 제품문의는 어디로 드리면 될까요"

**1단계: 자동 분석**
- 사용자 유형: `B2B` (키워드: "손님", "마사지")
- 의도: `B2B문의` (키워드: "제품문의")
- 키워드: `라벤더`, `베르가못`, `에센셜오일`, `캐리어오일`

**2단계: 챗봇 자동 생성 및 응답**
```
🏢 마사지/스파 비즈니스 고객님을 위한 맞춤 상담

보다 정확한 상담을 위해 몇 가지 여쭤봐도 될까요?

📋 추가 질문:
1️⃣ 지역: 어느 지역에서 운영하고 계신가요?
2️⃣ 필요하신 제품 형태:
   • 원료용 오일 (직접 블렌딩용)
   • 즉시 사용 가능한 완제품 (마사지 오일, 룸스프레이, 디퓨저)
   • 특정 제품 (어떤 제품인지 알려주세요)
3️⃣ 사용 목적: 직접 사용? 손님 서비스용? 판매용?
4️⃣ 선호 향: 라벤더, 베르가못 외 다른 향도 필요하신가요?
5️⃣ 월 사용량: 대략적인 월 사용량을 알려주시면 도움이 됩니다
```

**3단계: 운영자 액션**
1. 고객 응답 확인 후 지역 정보 파악
2. 니즈 분석:
   - **원료 오일 필요**: 해당 지역 근방 공방에서 원료 오일 공급
   - **완제품 필요**: 추가 질의를 통해 제품 형태 확인 후 공방 매칭
3. 지역 기반 공방 연결 및 납품 중개
4. 유사 제품 자사몰 등록 (향후 직접 판매)

### 비즈니스 가치
- **고객 인사이트**: 블로그 댓글을 통한 실제 고객 니즈 파악
- **리드 발굴**: 구매 의도가 있는 댓글 자동 감지 및 챗봇 연결
- **B2B/B2C 분류**: 비즈니스 고객(마사지/스파/미용실)과 개인 고객 자동 구분
- **인텔리전트 컨텍스트 인식**: 
  - 마사지/스파 비즈니스 고객 자동 감지
  - 지역, 제품 형태, 사용 목적, 월 사용량 등 필수 정보 수집
  - 지역 기반 공방 매칭 준비
- **효율적 응대**: 초기 정보 수집 자동화로 매니저 상담 시간 단축

### 실제 사용 예시

**입력 댓글:**
> "캐리어오일에 에센셜오일(베르가못, 라벤더)을 섞어서 목과 데콜테 마사지 해주고 있는데 손님 반응이 좋아요. 제품문의는 어디로 드리면 될까요"

**AI 분석 결과:**
- 사용자 유형: **B2B** (키워드: "손님", "마사지")
- 의도: **B2B문의** (키워드: "제품문의")
- 감정: **positive**
- 키워드: 라벤더, 베르가못, 에센셜오일, 캐리어오일

**생성된 챗봇 응답 (맥락 기반 추가 질문):**
```
🏢 마사지/스파 비즈니스 고객님을 위한 맞춤 상담

보다 정확한 상담을 위해 몇 가지 여쭤봐도 될까요?

📋 추가 질문:
1️⃣ 지역: 어느 지역에서 운영하고 계신가요? (제휴 공방 매칭을 위해 필요)
2️⃣ 필요하신 제품 형태:
   • 원료용 오일 (직접 블렌딩용)
   • 즉시 사용 가능한 완제품 (마사지 오일, 룸스프레이, 디퓨저)
   • 특정 제품 (어떤 제품인지 알려주세요)
3️⃣ 사용 목적: 직접 사용? 손님 서비스용? 판매용?
4️⃣ 선호 향: 라벤더, 베르가못
5️⃣ 월 사용량: 대략적인 월 사용량을 알려주시면 도움이 됩니다

→ 지역 기반 공방 매칭 및 맞춤 제안 제공 준비
```

## 🔄 향후 구현 예정

1. **블로그 RSS 자동 수집**
   - 네이버 블로그 (aromapulse) RSS 파싱
   - 주기적 포스트 수집

2. **프론트엔드 UI**
   - 회원가입/로그인 페이지
   - 제품 목록/상세 페이지
   - 리뷰 작성 페이지
   - 패치 신청 페이지
   - 관리자 대시보드

3. **이미지 업로드**
   - Cloudflare R2 연동 또는
   - 외부 이미지 스토리지 연동

## 🗄️ 데이터 아키텍처

### Database: Cloudflare D1 (SQLite)

**주요 테이블**:
- `users` - 회원 (B2C/B2B 구분, 증상, 지역)
- `products` - 제품 (증상케어/리프레시 구분, 맞춤/완제품)
- `workshops` - 공방/워크숍
- `reviews` - 자체 리뷰
- `blog_posts` - 블로그 포스트
- `blog_comments` - 블로그 댓글
- `patch_applications` - 패치 신청
- `surveys` - BEFORE/AFTER 설문
- `recommendation_logs` - 추천 로그

## 🚀 API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/signup` - 회원가입 (이메일/비밀번호)
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me/:id` - 사용자 정보 조회
- `GET /api/auth/naver` - 네이버 OAuth 시작
- `GET /api/auth/naver/callback` - 네이버 OAuth 콜백
- `GET /api/auth/kakao` - 카카오 OAuth 시작
- `GET /api/auth/kakao/callback` - 카카오 OAuth 콜백
- `GET /api/auth/google` - 구글 OAuth 시작
- `GET /api/auth/google/callback` - 구글 OAuth 콜백
- `POST /api/auth/create-admin` - 관리자 계정 생성 (비밀 키 필요)
- `GET /api/auth/admins` - 관리자 목록 조회

### 제품 (Products)
- `GET /api/products` - 제품 목록 (필터링 가능)
- `GET /api/products/:id` - 제품 상세
- `GET /api/products/recommend/:userId` - Rule 기반 추천

### 리뷰 (Reviews)
- `POST /api/reviews` - 리뷰 작성
- `GET /api/reviews` - 리뷰 목록
- `GET /api/reviews/:id` - 리뷰 상세
- `GET /api/reviews/blog-comments` - 블로그 댓글 목록

### 패치 (Patch)
- `POST /api/patch/apply` - 패치 신청
- `GET /api/patch/applications` - 신청 목록
- `GET /api/patch/applications/:id` - 신청 상세
- `POST /api/patch/survey` - 설문 제출
- `GET /api/patch/surveys` - 설문 조회

### 블로그 (Blog)
- `GET /api/blog/posts` - 블로그 포스트 목록
- `GET /api/blog/posts/:id` - 포스트 상세
- `POST /api/blog/collect-rss` - RSS 수집 (관리자)
- `POST /api/blog/collect-comments` - 댓글 수집 (관리자)

### 관리자 (Admin)
- `POST /api/admin/tag-review` - 리뷰 태깅
- `POST /api/admin/tag-comment` - 댓글 태깅
- `POST /api/admin/products` - 상품 등록
- `PUT /api/admin/products/:id` - 상품 수정
- `DELETE /api/admin/products/:id` - 상품 삭제
- `PUT /api/admin/patch-applications/:id/status` - 패치 신청 상태 변경
- `GET /api/admin/dashboard/stats` - 대시보드 통계

## 💾 샘플 데이터

데이터베이스에는 다음 샘플 데이터가 포함되어 있습니다:
- 테스트 사용자 4명 (B2C 2명, B2B 2명)
- 공방/워크숍 3곳
- 증상케어 제품 5개 (맞춤제작 2개, 완제품 3개)
- 리프레시 제품 6개 (현재 제조 중 2개, 준비 중 4개)
- 블로그 포스트 3개
- 블로그 댓글 4개
- 자체 리뷰 2개
- 패치 신청 2개
- 설문 2개

## 🛠️ 기술 스택

- **Framework**: Hono (Cloudflare Workers)
- **Runtime**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Process Manager**: PM2 (개발 환경)
- **Deployment**: Wrangler CLI

## 📦 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm
- wrangler CLI

### 로컬 개발

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run db:migrate:local

# 시드 데이터 삽입
npm run db:seed

# 빌드
npm run build

# 개발 서버 시작 (PM2)
npm run clean-port
pm2 start ecosystem.config.cjs

# 서버 상태 확인
pm2 list
pm2 logs aromapulse-webapp --nostream

# API 테스트
curl http://localhost:3000/api/health
```

### 데이터베이스 관리

```bash
# 로컬 데이터베이스 초기화
npm run db:reset

# 마이그레이션 적용 (로컬)
npm run db:migrate:local

# 마이그레이션 적용 (프로덕션)
npm run db:migrate:prod

# 데이터베이스 콘솔 (로컬)
npm run db:console:local

# 데이터베이스 콘솔 (프로덕션)
npm run db:console:prod
```

## 🚢 배포

### Cloudflare Pages 배포 ✅ 완료

**현재 배포 상태**: https://aromapulse.pages.dev

```bash
# 1. 프로젝트 빌드
npm run build

# 2. Cloudflare Pages 배포
export CLOUDFLARE_API_TOKEN="your-api-token"
npx wrangler pages deploy dist --project-name aromapulse

# 3. 환경 변수 설정 (이미 완료)
# - JWT_SECRET
# - NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, NAVER_CALLBACK_URL
# - KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET, KAKAO_CALLBACK_URL
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL

# 4. 환경 변수 추가 (필요시)
echo "your-secret" | npx wrangler pages secret put SECRET_NAME --project-name aromapulse
```

### OAuth Callback URL 설정 필요

배포 후 각 OAuth 플랫폼에서 프로덕션 Callback URL을 등록해야 합니다:

**네이버 개발자센터**: https://developers.naver.com/apps
- Callback URL: `https://aromapulse.pages.dev/api/auth/naver/callback`
- 향후 도메인: `https://aromapulse.kr/api/auth/naver/callback`

**카카오 개발자센터**: https://developers.kakao.com/console
- Redirect URI: `https://aromapulse.pages.dev/api/auth/kakao/callback`
- 향후 도메인: `https://aromapulse.kr/api/auth/kakao/callback`
- 카카오 로그인 활성화 필요

**구글 클라우드 콘솔**: https://console.cloud.google.com/apis/credentials
- 승인된 리디렉션 URI: `https://aromapulse.pages.dev/api/auth/google/callback`
- 향후 도메인: `https://aromapulse.kr/api/auth/google/callback`

### D1 Database (향후 추가 예정)

현재는 D1 Database 없이 배포되었습니다. 데이터 저장이 필요한 경우:

```bash
# D1 Database 생성
npx wrangler d1 create aromapulse-production

# wrangler.jsonc에 database_id 추가 후
npm run db:migrate:prod
```

## 📊 비즈니스 모델

### B2C (개인 고객)
1. **일상 스트레스형**
   - 불면, 우울, 불안 증상 개선
   - 증상 기반 제품 추천
   - 지역 기반 공방 매칭

2. **직무 스트레스형**
   - 업무 관련 스트레스 관리
   - 집중력 향상
   - 번아웃 예방

### B2B (비즈니스)
1. **조향사 (파트너 제휴)**
   - 공동 제품 개발
   - 클래스 협업

2. **기업 (대량 납품/클래스)**
   - 직원 힐링 프로그램
   - 대량 납품
   - 기업 맞춤 클래스

3. **가게 (제품 문의)**
   - 매장 입점
   - 제품 공급

## 🎨 제품 컨셉

### 증상케어 제품 (타사 공방)
- **컨셉**: 전문성·신뢰 기반 폐쇄형
- **판매**: 자사 사이트에서만 (중개)
- **특징**: 
  - 맞춤제작형: 상담 설계 → 별도 제작 (고가)
  - 완제품형: 기존 보유 제품 (저가)

### 리프레시 제품 (아로마펄스 자체 브랜드)
- **컨셉**: 감성·취향 기반 공개형
- **판매**: 오픈 마켓 진출 가능
- **특징**:
  - 현재 제조 중: 섬유향수, 룸스프레이 (30ml)
  - 준비 중: 섬유탈취제, 디퓨저, 캔들, 향수

## 📈 데이터 수집 전략

1. **블로그 중심 유입**
   - 네이버 블로그 (aromapulse) 콘텐츠 양산
   - RSS 자동 수집

2. **댓글/리뷰 수집**
   - 블로그 댓글 크롤링
   - 자체 플랫폼 리뷰 작성

3. **텍스트 패턴 분석**
   - 키워드 추출 ("납품", "워크숍" 등)
   - B2C/B2B 자동 분류

4. **수동 태깅**
   - 감정 (긍정/부정/중립)
   - 의도 (관심/문의/체험후기/구매의향)

5. **행동 추적**
   - 유입 경로 (블로그, 인스타, 카페 등)
   - 전환율 측정 (리뷰 → 설문 → 패치 신청)

## 🔮 AI 확장 계획 (향후)

현재는 **AI 없이** Rule 기반으로 운영하지만, 데이터가 충분히 쌓이면:
1. GPT API로 텍스트 감정/의도 자동 태깅
2. Embedding 기반 제품 추천
3. 사용자 군집화 (K-means)
4. 다음 행동 예측 모델

## 📝 운영 방침

- **초기 3개월**: 수동 운영 + 데이터 수집
- **AI 도입**: 데이터 검증 후
- **비용 최소화**: Cloudflare 무료 플랜 활용
- **점진적 확장**: 시장 반응 확인 후

## 🔒 보안 및 개인정보

- HTTPS 통신
- 개인정보보호법 준수
- 건강정보 암호화 저장 (향후)
- 접근 권한 관리

## 📞 연락처

- **블로그**: https://blog.naver.com/aromapulse
- **이메일**: admin@aromapulse.co.kr (예정)

---

**Last Updated**: 2025-11-14
**Version**: 1.5.0 (Blog Management System)
**Status**: ✅ Cloudflare Pages 배포 완료
**Production URL**: https://035a2253.aromapulse.pages.dev
**Domain**: www.aromapulse.kr
**Dev URL**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai

## 🔄 사이트 구조 재정의 (v1.4.0)

### 🌐 **웹사이트** (www.aromapulse.kr)
**목적**: 로컬 공방 제품 쇼핑몰 전용

#### B2C (일반 개인 고객)
- ✅ 쇼핑 (로컬 공방 제품 구매)
- ✅ 대시보드
- ❌ 워크샵 메뉴 제거 → AI 챗봇으로 통합
- ❌ AI 상담 메뉴 제거 → 블로그 임베드로 통합

#### B2B (기업 고객)
- ✅ 쇼핑 (로컬 공방 제품 - 대량/소량 모두 가능)
- ✅ 워크샵 메뉴 표시 (B2B 전용)
- ✅ 대시보드
- ❌ AI 상담 메뉴 제거 → 블로그 임베드로 통합

### 🤖 **AI 챗봇** (블로그 임베드)
**위치**: https://blog.naver.com/aromapulse

#### B2C 문의
- 제품 상담
- 증상별 추천
- 구매 안내

#### B2B 문의
- 원데이 클래스/워크샵 문의
- 파트너사 제휴 (공방)
- 오프라인 매장 (에스테틱, 미용실, 웰니스 가게 등) 제품 문의
- 대량 납품 문의
- 기능성/효능성 제품 문의
- 비즈니스 협업 문의

### 🆕 최신 업데이트 (v1.4.0)

**메뉴 구조 최적화** ✅
1. **워크샵 메뉴 가시성 제어**
   - B2C 사용자: 워크샵 메뉴 숨김
   - B2B 사용자: 워크샵 메뉴 표시
   - 비로그인: 워크샵 메뉴 숨김

2. **AI 상담 메뉴 제거**
   - 사이트 메뉴에서 완전 제거
   - 블로그 임베드 챗봇으로 통합
   - `/chatbot` URL은 직접 접속 시 유지

3. **대시보드 개선**
   - B2C: 제품 상담 안내만 표시
   - B2B: 비즈니스 파트너십 안내 표시
   - 워크샵 관련 함수 제거

4. **사용자용 쇼핑 페이지 추가** ✅
   - `/shop` - 공개 제품 목록
   - 증상케어/리프레시 탭 구분
   - 장바구니 기능 준비
   - 공방 정보 및 제품 정보 표시

**이전 업데이트 (v1.3.0)** - 리프레시 제품 유형 시스템
**이전 업데이트 (v1.2.0)** - 로컬 공방 정보 시스템

## 🔮 AI 확장 계획 (향후)

현재는 **AI 없이** Rule 기반으로 운영하지만, 데이터가 충분히 쌓이면:
1. GPT API로 텍스트 감정/의도 자동 태깅
2. Embedding 기반 제품 추천
3. 사용자 군집화 (K-means)
4. 다음 행동 예측 모델

## 📝 운영 방침

- **초기 3개월**: 수동 운영 + 데이터 수집
- **AI 도입**: 데이터 검증 후
- **비용 최소화**: Cloudflare 무료 플랜 활용
- **점진적 확장**: 시장 반응 확인 후

## 🔒 보안 및 개인정보

- HTTPS 통신
- 개인정보보호법 준수
- 건강정보 암호화 저장 (향후)
- 접근 권한 관리

## 📞 연락처

- **블로그**: https://blog.naver.com/aromapulse
- **이메일**: admin@aromapulse.co.kr (예정)

### 챗봇 (Chatbot) 🤖
- `POST /api/chatbot/session/start` - 새 챗봇 세션 시작
- `POST /api/chatbot/message` - 메시지 전송 및 AI 응답
- `GET /api/chatbot/session/:id/messages` - 대화 내역 조회
- `POST /api/chatbot/predict-behavior` - 사용자 행동 예측
- `POST /api/chatbot/update-interest-profile` - 관심사 프로필 업데이트
- `POST /api/chatbot/track-conversion` - 회원가입 전환 추적 (클릭 시점)
- `POST /api/chatbot/track-signup-conversion` - 회원가입 완료 추적
- `GET /api/chatbot/conversion-stats` - 전환율 통계 조회

### 블로그 리뷰 분석 (Blog Reviews) 📊
- `POST /api/blog-reviews/posts` - 블로그 포스트 등록
- `GET /api/blog-reviews/posts` - 포스트 목록 조회
- `POST /api/blog-reviews/comments` - 댓글 등록 및 AI 분석
- `GET /api/blog-reviews/comments` - 댓글 목록 조회
- `GET /api/blog-reviews/leads` - 리드 발견 (B2B/B2C)
- `GET /api/blog-reviews/analysis/sentiment` - 감정 분석 통계
- `GET /api/blog-reviews/analysis/keywords` - 키워드 추출

### 관리자 제품 관리 (Admin Products) 🛒
- `POST /api/admin-products` - 제품 등록 (이미지 업로드 + **로컬 공방 정보** 포함)
- `GET /api/admin-products` - 제품 목록 조회
- `PUT /api/admin-products/:id` - 제품 수정
- `DELETE /api/admin-products/:id` - 제품 삭제

**제품 등록/수정 시 포함 가능한 로컬 공방 정보**:
- `workshop_name` - 공방명 (예: 향기로운 하루 공방)
- `workshop_location` - 지역 (서울, 경기, 부산 등 17개 선택)
- `workshop_address` - 상세 주소
- `workshop_contact` - 연락처 (전화번호)

## 🎯 최근 업데이트 (2025-11-13)

### ✅ 완료된 작업
1. **AI 챗봇 시스템 구축**
   - B2B/B2C 자동 감지 알고리즘
   - Intent/Sentiment/Entity 분석
   - 행동 예측 및 제품 추천
   - 프로덕션 도메인 연동 (www.aromapulse.kr)
   - **회원가입 유도 플로우 추가** ✅
   - **상담 종료 기능** ✅

2. **블로그 리뷰 분석 시스템**
   - 네이버 블로그 댓글 수집 및 AI 분석
   - 키워드 추출 및 리드 발견
   - 관리자 대시보드

3. **관리자 제품 관리**
   - 대표 이미지 + 상세 이미지 업로드
   - Cloudflare R2 스토리지 연동
   - 제품 CRUD 완성
   - **로컬 공방 정보 등록** ✅
     - 공방명, 지역, 상세 주소, 연락처
     - 제품 카드에 공방 정보 표시
   - **리프레시 제품 유형 및 용량 관리** ✅
     - 제품 유형: 섬유 향수 ✅, 룸 스프레이 ✅, 섬유 탈취제 ⏳, 디퓨저 ⏳, 캔들 ⏳, 향수 ⏳
     - 용량: 30ml ✅, 50ml ⏳, 100ml ⏳
     - 현재 등록 가능: 섬유 향수 30ml, 룸 스프레이 30ml

4. **블로그 임베드 도구**
   - 버튼 생성기: https://www.aromapulse.kr/static/blog-button-generator
   - 실제 예시: https://www.aromapulse.kr/static/blog-example
   - 임베드 가이드: https://www.aromapulse.kr/static/blog-embed-guide

### 🎉 프로덕션 도메인 설정 완료
- **메인 도메인**: www.aromapulse.kr
- **챗봇 회원가입 유도**: B2B → www.aromapulse.kr/signup?type=B2B
- **챗봇 회원가입 유도**: B2C → www.aromapulse.kr/signup?type=B2C
- **모든 블로그 버튼 링크**: 프로덕션 도메인으로 업데이트 완료 ✅

### 🤖 AI 챗봇 회원가입 플로우

**사용자 여정**:
1. 블로그 또는 사이트에서 챗봇 시작
2. AI가 대화를 통해 사용자 타입 자동 감지 (B2B/B2C)
3. 구매/서비스 의도 감지 시 **회원가입 혜택 자동 안내**:
   - **B2C**: 첫 구매 10% 할인 + 적립금 5% + 무료 배송
   - **B2B**: 대량 구매 20% 할인 + 전담 매니저 + 샘플 무료 제공
4. 사용자 선택:
   - **서비스 이용 원함** → 회원가입 페이지로 이동 (전환 추적)
   - **이용 안 함** → 상담 종료 버튼 클릭하여 나가기

**전환 추적**:
- 회원가입 버튼 클릭 시 `is_converted` 플래그 자동 업데이트
- B2B/B2C별 전환율 통계 제공
- 대시보드에서 실시간 전환율 모니터링 가능

**구현 위치**:
- 챗봇 페이지: `/chatbot` (https://www.aromapulse.kr/chatbot)
- 위젯 임베드: `/static/chatbot-widget.html`
- 블로그 버튼: `/static/blog-button-generator`

### 👤 관리자 계정 시스템

**관리자 역할**:
- `user` - 일반 사용자 (기본값)
- `admin` - 관리자 (제품 관리, 주문 관리, 통계 조회)
- `super_admin` - 최고 관리자 (향후 확장)

**관리자 계정 생성 방법**:
1. `/create-admin` 페이지 접속
2. 이메일, 비밀번호, 이름, 연락처 입력
3. **관리자 비밀 키** 입력: `aromapulse-admin-2025`
4. 계정 생성 완료

**API로 관리자 생성**:
```bash
curl -X POST https://your-domain/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aromapulse.kr",
    "password": "your-secure-password",
    "name": "관리자 이름",
    "phone": "010-1234-5678",
    "secret_key": "aromapulse-admin-2025"
  }'
```

**기본 관리자 계정**:
- 이메일: `admin@aromapulse.kr`
- 비밀번호: (초기 설정 시 지정)
- 역할: `admin`

**관리자 페이지 접근**:
- 제품 관리: `/admin-products`
- 블로그 리뷰 분석: `/admin/blog-reviews`

리: `/admin-products`
- 블로그 리뷰 분석: `/admin/blog-reviews`


## 🆕 최신 업데이트 (v1.5.0) - 블로그 관리 시스템

### ✅ 완료된 작업 (2025-11-14)

**블로그 관리 탭 추가** (관리자 페이지에 통합)
1. **관리자 페이지 개선**
   - `/admin-products`에 "블로그 관리" 탭 추가
   - 제품 관리와 블로그 관리를 한 페이지에서 처리
   - 탭 전환으로 간편한 관리 UI

2. **블로그 URL 입력 기반 댓글 수집**
   - 네이버 블로그 게시물 URL 입력
   - 자동 댓글 크롤링 (현재 시뮬레이션 모드)
   - 실시간 댓글 분석 및 통계

3. **자동 AI 분석**
   - **감정 분석**: positive, negative, neutral
   - **사용자 타입 예측**: B2C (개인), B2B (기업)
   - **의도 분석**: 구매의도, 문의, B2B문의, 가격문의, 긍정리뷰, 부정리뷰, 일반댓글
   - **키워드 추출**: 증상, 제품, 향, 용도 자동 추출

4. **구매 의도 댓글 → 챗봇 세션 자동 생성**
   - 구매의도, 문의, B2B문의, 가격문의 댓글 자동 감지
   - 챗봇 세션 자동 생성 및 AI 응답 생성
   - 댓글 작성자를 위한 맞춤형 상담 준비

5. **블로그 게시물 통계 대시보드**
   - 등록된 게시물 목록
   - 게시물별 댓글 수, 구매 의도 댓글 수
   - B2C/B2B 고객 분포
   - 생성된 챗봇 세션 수

### 📋 블로그 관리 API 엔드포인트

**블로그 댓글 수집 및 분석**:
- `POST /api/blog-reviews/crawl-from-url` - 블로그 URL에서 댓글 자동 수집 및 분석
- `GET /api/blog-reviews/posts` - 등록된 블로그 게시물 목록 (통계 포함)
- `GET /api/blog-reviews/posts/:post_id/comments` - 특정 게시물의 댓글 목록

**현재 응답 예시** (시뮬레이션 모드):
```json
{
  "message": "댓글 수집 및 분석 완료",
  "post_id": "223921529276",
  "total_comments": 5,
  "purchase_intent_count": 3,
  "b2c_count": 3,
  "b2b_count": 2,
  "chatbot_sessions_created": 3,
  "note": "현재는 시뮬레이션 모드입니다."
}
```

### 🎯 블로그 관리 사용 방법

**관리자 페이지 접속**:
1. `/admin-products`로 이동 (관리자 로그인 필요)
2. "블로그 관리" 탭 클릭

**블로그 댓글 수집**:
1. 네이버 블로그 게시물 URL 입력
   - 예: `https://blog.naver.com/aromapulse/223921529276`
2. "댓글 수집 및 분석" 버튼 클릭
3. 자동 분석 완료 알림 확인:
   - 총 댓글 수
   - 구매 의도 댓글 수
   - B2C/B2B 고객 분포
   - 생성된 챗봇 세션 수

**등록된 게시물 확인**:
- 게시물 목록에서 각 게시물의 통계 확인
- "게시물 보기" 버튼으로 네이버 블로그 이동
- "댓글 보기" 버튼으로 수집된 댓글 상세 보기

### 🔮 향후 개선 계획

1. **네이버 블로그 API 연동**
   - 현재: 시뮬레이션 더미 데이터 생성
   - 향후: 실제 네이버 블로그 댓글 크롤링
   - 네이버 오픈 API 또는 웹 크롤링 기술 적용

2. **자동 주기적 수집**
   - 일일 자동 댓글 수집
   - 새 댓글 알림 시스템
   - 실시간 댓글 모니터링

3. **고급 분석 기능**
   - 트렌드 분석 (시간대별, 키워드별)
   - 고객 여정 추적
   - ROI 분석 (블로그 → 댓글 → 챗봇 → 회원가입)

### 💡 비즈니스 가치

**자동화된 리드 발굴**:
- 블로그 댓글에서 잠재 고객 자동 감지
- 구매 의도 고객에게 즉시 챗봇 상담 제공
- B2C/B2B 구분으로 맞춤형 마케팅

**데이터 기반 의사결정**:
- 고객 관심사 파악 (키워드 분석)
- 제품 피드백 자동 수집
- 시장 반응 실시간 모니터링

**운영 효율화**:
- 수동 댓글 관리 → 자동 수집 및 분석
- 잠재 고객 놓치지 않고 자동 응대
- 관리자 대시보드에서 모든 정보 통합 관리

---

## 🆕 최신 업데이트 (v1.6.0) - 수동 댓글 입력 시스템 (하이브리드 전략)

### ✅ 완료된 작업 (2025-11-15)

**수동 댓글 입력 기능 추가** (하이브리드 접근: 수동 + 크롤링)
1. **UI 개선**
   - 블로그 포스트 카드에 "댓글 추가" 버튼 추가
   - 수동 댓글 입력 모달 (작성자명, 내용, 날짜 선택)
   - AI 분석 결과 실시간 표시 (이모지 포함)
   - 자동 폼 리셋 기능

2. **백엔드 API** (`/api/blog-reviews/comments/manual`)
   - 수동 댓글 입력 및 저장
   - AI 자동 분석 (감정, 사용자 타입, 의도, 키워드)
   - B2B/구매의도 댓글 → 챗봇 세션 자동 생성
   - 통계 실시간 업데이트

3. **중복 제거 로직 개선**
   - B2B 리드 목록 중복 제거 시 최신 항목 우선 표시
   - `ORDER BY created_at DESC, id DESC` 정렬로 정확도 향상

### 🎯 하이브리드 전략 (Manual + Crawling)

**현재 단계**: 수동 입력 중심 운영
- 블로그 댓글을 관리자가 직접 입력
- 법적 안전성 보장 (크롤링 리스크 없음)
- 초기 데이터 수집 및 시스템 검증

**향후 확장**: 크롤링 서버 추가
- 사업 규모 확대 시 별도 크롤링 서버 구축
- Puppeteer + Proxy 활용
- 수동/자동 병행 운영

### 📋 수동 댓글 입력 사용 방법

1. **관리자 페이지 접속**
   - `/admin-products`로 이동
   - "블로그 관리" 탭 클릭

2. **댓글 추가**
   - 블로그 포스트 카드에서 "댓글 추가" 버튼 클릭
   - 작성자명, 댓글 내용 입력
   - (선택) 작성 날짜 지정
   - "댓글 추가" 버튼 클릭
   - 여러 개의 댓글을 추가할 수 있습니다

3. **AI 분석 결과 확인**
   - 감정: 긍정😊/부정😔/중립😐
   - 사용자 타입: B2B/B2C/일반 고객
   - 의도: 구매의도, B2B문의, 가격문의, 일반댓글 등
   - 키워드: 자동 추출된 주요 키워드
   - 챗봇 세션 자동 생성 여부

4. **리드 확인**
   - B2B 문의 댓글의 경우 "B2B 리드 보기" 버튼으로 즉시 확인
   - 챗봇 페이지에서 자동 생성된 상담 세션 확인

### 💡 실제 사용 예시

**입력 댓글**:
```
작성자: 여행에 힐링을 더하다
내용: 캐리어오일에 에센셜오일(베르가못, 라벤더)을 섞어서 목과 데콜테 마사지 해주고 있는데 손님 반응이 좋아요. 제품문의는 어디로 드리면 될까요
```

**AI 분석 결과**:
```
✅ 댓글 추가 완료!

📝 작성자: 여행에 힐링을 더하다
📊 AI 분석 결과:
  - 감정: 긍정😊
  - 사용자 타입: B2B
  - 의도: B2B문의
  - 키워드: 라벤더, 베르가못, 에센셜오일, 캐리어오일

🤖 챗봇 세션이 자동으로 생성되었습니다!
```

**자동 생성된 챗봇 응답**:
```
🏢 마사지/스파 비즈니스 고객님을 위한 맞춤 상담

댓글 내용을 보니 손님께 마사지/케어 서비스를 제공하시는 비즈니스를 운영하고 계신 것 같습니다.

📋 추가 질문:
1️⃣ 지역: 어느 지역에서 운영하고 계신가요?
2️⃣ 필요하신 제품 형태:
   • 원료용 오일 (직접 블렌딩용)
   • 즉시 사용 가능한 완제품
3️⃣ 사용 목적: 직접 사용? 손님 서비스용? 판매용?
4️⃣ 선호 향: 라벤더, 베르가못 외 다른 향도 필요하신가요?
5️⃣ 월 사용량: 대략적인 월 사용량을 알려주시면 도움이 됩니다
```

### 🔧 기술적 개선사항

1. **API 응답 구조 개선**
   - `analysis` 객체로 분석 결과 구조화
   - 키워드 배열 형식으로 반환
   - 챗봇 세션 생성 여부 명확히 표시

2. **UI/UX 개선**
   - 이모지를 활용한 직관적인 결과 표시
   - 모달 닫을 때 자동 폼 리셋
   - 더 명확한 성공 메시지

3. **데이터 정확도 개선**
   - 중복 제거 시 최신 항목 우선 표시
   - `ORDER BY created_at DESC, id DESC` 정렬
   - 시뮬레이션 댓글의 동일 timestamp 문제 해결

### 📊 테스트 결과

**테스트 시나리오 1: B2B 문의 댓글**
- ✅ 댓글 추가 성공
- ✅ AI 분석 정확 (B2B, 긍정, B2B문의)
- ✅ 챗봇 세션 자동 생성
- ✅ B2B 리드 목록에 정확히 표시
- ✅ 통계 업데이트 (댓글 수 4→6)

**테스트 시나리오 2: 일반 댓글**
- ✅ 댓글 추가 성공
- ✅ AI 분석 정확 (일반 고객, 긍정, 일반댓글)
- ✅ 챗봇 세션 미생성 (의도대로)
- ✅ 키워드 없음 (일반 인사 댓글)

**테스트 시나리오 3: 구매의도 댓글**
- ✅ 댓글 추가 성공
- ✅ AI 분석 정확 (B2C, 긍정, 구매의도)
- ✅ 챗봇 세션 자동 생성
- ✅ 라벤더 키워드 추출

### 🎯 비즈니스 가치

**법적 안전성**:
- 네이버 블로그 API "Wrong ticket" 오류 회피
- 크롤링 법적 리스크 없음
- 자사 블로그 댓글만 수동 입력

**데이터 품질**:
- 관리자가 검증한 실제 댓글만 입력
- 스팸/광고 댓글 자동 필터링
- AI 분석 정확도 향상

**확장성**:
- 현재: 수동 입력으로 시스템 검증
- 향후: 크롤링 서버 추가 시 병행 운영 가능
- 점진적 자동화 확장 전략

### 🔮 로드맵

**Phase 1: 수동 입력 (현재)** ✅
- 블로그 댓글 수동 입력
- AI 분석 자동화
- 챗봇 자동 생성
- 데이터 수집 및 검증

**Phase 2: 하이브리드 (3개월 후)**
- 수동 입력 유지
- 크롤링 서버 추가 (선택적 사용)
- 수동/자동 병행 운영

**Phase 3: 완전 자동화 (6개월 후)**
- 크롤링 서버 메인 운영
- 수동 입력은 예외 케이스만
- 실시간 댓글 모니터링

---

---

## 🆕 최신 업데이트 (v1.6.2) - 다중 댓글 지원 (2025-11-15)

### ✅ 변경사항

**게시물당 여러 댓글 추가 가능**
1. **제한 해제**
   - 이전 버전(v1.6.1)의 "게시물당 1개 제한" 기능 제거
   - 한 게시물에 여러 개의 댓글을 자유롭게 추가 가능
   - 실제 네이버 블로그 댓글 수와 동일하게 관리 가능

2. **데이터베이스 정리**
   - 기존 중복 댓글 정리 완료
   - 각 게시물의 `comment_count` 정확성 확보
   - 깔끔한 상태에서 다시 시작

3. **사용 방법**
   - 동일 게시물에 여러 댓글 연속 추가 가능
   - 날짜 지정 가능 (시간순 정렬)
   - AI 분석은 각 댓글마다 독립적으로 수행

### 🎯 사용 시나리오

**정상 케이스**:
```
1. 게시물 A 선택 → 댓글 1 입력 → 성공 ✅
2. 게시물 A 선택 → 댓글 2 입력 → 성공 ✅
3. 게시물 A 선택 → 댓글 3 입력 → 성공 ✅
```

### 💡 비즈니스 가치

- **유연성**: 실제 블로그 댓글 수만큼 자유롭게 추가
- **정확성**: 네이버 블로그와 동일한 댓글 수 관리
- **분석 품질**: 더 많은 데이터로 정확한 AI 분석

---

---

## 📊 현재 데이터 현황 (2025-11-15)

### ✅ 등록된 블로그 게시물 (5개)

| 게시물 ID | 제목 | 댓글 수 |
|---------|------|---------|
| 223858923513 | 아로마테라피 효과, 어떤 오일이 감정 회복에 좋을까? | 0 |
| 223846281454 | 스트레스 해소 방법 찾는다면? 향기로 힐링하세요. | 2 |
| 223879463761 | 유칼립투스 오일 사용법 가이드, 천연 항균 효과로 일상에 건강 더하기 | 2 |
| 223871221945 | 페퍼민트 오일 사용법 총정리! 두통부터 집중력 향상까지 활용법 공개 | 3 |
| 223879507099 | 에센셜 오일 종류별 효능 총정리! 수면, 스트레스, 면역력까지 한눈에 | 4 |

### 📈 댓글 통계

- **총 댓글 수**: 11개
- **댓글 있는 게시물**: 4개
- **B2C 고객 댓글**: 0개
- **B2B 고객 댓글**: 1개
- **일반 댓글**: 10개

### 💡 AI 분류 정확도

- **단순 인사말**: 일반(null)로 정확히 분류
- **구매 의도 있는 댓글**: B2C/B2B로 자동 분류
- **감정 분석**: positive/negative/neutral 자동 태깅

---

---

## 🆕 최신 업데이트 (v1.7.0) - E-Commerce & Order Management (2025-11-15)

### ✅ 완료된 작업

**1. 사용자용 쇼핑몰 구축** ✅
- `/shop` - 고객용 제품 쇼핑 페이지
- `/checkout` - 주문/결제 페이지
- `/order-complete.html` - 주문 완료 페이지
- **장바구니 기능**:
  - LocalStorage 기반 장바구니 저장
  - 수량 변경 및 삭제
  - 실시간 금액 계산
- **Daum Postcode API 연동**:
  - 우편번호 및 주소 검색
  - 상세주소 입력

**2. 주문 관리 시스템** ✅
- **데이터베이스 스키마**:
  - `orders` 테이블: 주문 정보, 배송 정보, 결제 정보
  - `order_items` 테이블: 주문 상품 상세
- **주문 상태 관리**:
  - `payment_status`: pending → paid → refunded
  - `order_status`: pending → confirmed → preparing → shipped → delivered → cancelled
- **API 엔드포인트**:
  - `POST /api/orders/create` - 주문 생성
  - `GET /api/orders/:order_number` - 주문 조회
  - `GET /api/orders/admin/list` - 관리자 주문 목록
  - `GET /api/orders/admin/stats` - 주문 통계
  - `GET /api/orders/admin/:id` - 주문 상세 조회
  - `PUT /api/orders/admin/:id/payment-status` - 결제 상태 변경
  - `PUT /api/orders/admin/:id/order-status` - 주문 상태 변경
  - `PUT /api/orders/admin/:id/shipping` - 배송 정보 업데이트
  - `PUT /api/orders/admin/:id/memo` - 관리자 메모 저장

**3. 관리자 주문 관리 페이지** ✅
- `/static/admin-orders.html` - 주문 관리 대시보드
- **기능**:
  - 주문 목록 조회 (필터링, 검색, 정렬)
  - 주문 상세 보기 (고객 정보, 주문 상품, 결제 정보)
  - 결제 상태 변경 (결제 대기 → 결제 완료 → 환불)
  - 주문 상태 변경 (주문 접수 → 주문 확인 → 상품 준비중 → 배송중 → 배송 완료)
  - 배송 정보 입력 (택배사, 운송장 번호)
  - 관리자 메모 작성
  - 통계 대시보드 (전체 주문, 결제 대기, 결제 완료, 배송중, 배송 완료)

**4. 토스페이먼츠(Toss Payments) 결제 시스템** ✅
- **결제 위젯 SDK 연동**:
  - 토스페이먼츠 SDK v2 적용
  - 실시간 결제 수단 선택 (카드, 계좌이체, 가상계좌, 휴대폰)
  - 이용약관 동의 UI 자동 렌더링
- **결제 프로세스**:
  1. 고객이 체크아웃 페이지에서 주문 정보 입력
  2. 토스 결제 위젯으로 결제 수단 선택 및 결제 진행
  3. 토스에서 결제 완료 후 success URL로 리다이렉트
  4. 백엔드에서 토스 API로 결제 승인 요청 및 검증
  5. 주문 생성 및 결제 정보 저장 (`payment_status='paid'`, `order_status='confirmed'`)
  6. 재고 자동 차감
  7. 주문 완료 페이지 표시
- **결제 실패 처리**:
  - 결제 취소 시 fail URL로 리다이렉트
  - 실패 사유 자동 표시 및 재시도 안내
- **보안**:
  - HTTPS 통신
  - 결제 승인 시 서버 측 검증 (Amount 위변조 방지)
  - 토스페이먼츠 시크릿 키 환경 변수 관리

**5. 제품 검색 및 필터링** ✅
- 관리자 제품 관리 페이지에 검색/필터 기능 추가
- **기능**:
  - 제품명 검색
  - 가격 범위 필터 (3만원 이하, 3~5만원, 5~10만원, 10만원 이상)
  - 정렬 옵션 (최신순, 오래된순, 가격 낮은순/높은순, 이름순)

**6. 대시보드 통계 기간 필터** ✅
- 관리자 대시보드에 기간별 필터 추가
- **기간 옵션**:
  - 오늘
  - 이번 주
  - 이번 달
  - 전체

### 📋 주문 관리 워크플로우

**고객 주문 프로세스** (완전 자동화):
1. 쇼핑몰에서 제품 선택 → 장바구니 추가
2. 결제하기 버튼 클릭 → 주문/결제 페이지 이동
3. 고객 정보 입력 (이름, 이메일, 전화번호, 주소, 배송 메시지)
4. 토스 결제 위젯에서 결제 수단 선택 (카드, 계좌이체, 가상계좌 등)
5. 결제하기 버튼 클릭 → 토스페이먼츠 결제 진행
6. 결제 완료 시:
   - 백엔드에서 토스 API로 결제 승인 및 검증
   - 주문 자동 생성 (`payment_status='paid'`, `order_status='confirmed'`)
   - 재고 자동 차감
   - 주문 완료 페이지 표시 (주문번호, 결제 금액, 결제 방법)
7. 결제 실패 시:
   - 결제 실패 페이지로 리다이렉트
   - 실패 사유 자동 표시 (카드 한도 초과, 잔액 부족 등)
   - 재시도 버튼 제공

**관리자 주문 처리 프로세스**:
1. 관리자 주문 관리 페이지 접속 (`/static/admin-orders.html`)
2. 새 주문 확인 (결제 완료 상태 - 자동)
3. 주문 상세 보기 → 고객 정보 및 주문 내역 확인
4. 상품 준비 → "상품 준비중" 버튼 클릭
5. 배송 시작 → "배송 시작" 버튼 클릭
   - 택배사 선택 (CJ대한통운, 우체국택배, 한진택배 등)
   - 운송장 번호 입력
   - `order_status='shipped'`로 변경
6. 배송 완료 확인 → "배송 완료" 버튼 클릭

### 🎯 토스페이먼츠 결제 시스템

**선택 이유**:
- 페이업(Payup)은 일반적인 결제 API를 제공하지 않음 (수동 링크 생성 방식)
- 토스페이먼츠는 완전한 API 및 SDK 제공
- 국내 대표 결제 게이트웨이로 안정성과 신뢰성 보장

**기술 스택**:
- **Frontend**: 토스페이먼츠 SDK v2 (결제 위젯)
- **Backend**: 토스페이먼츠 Payments API (결제 승인)
- **개발 환경**: 테스트 키 사용
- **운영 환경**: 라이브 키로 교체 필요

**지원 결제 수단**:
- 신용카드
- 계좌이체
- 가상계좌
- 휴대폰 결제
- 간편결제 (토스페이, 네이버페이, 카카오페이 등)

**장점**:
- 완전 자동화된 결제 프로세스
- 실시간 결제 승인 및 검증
- 결제 실패 시 자동 재시도 안내
- 보안 강화 (서버 측 검증)
- 다양한 결제 수단 지원

**테스트 방법**:
1. 테스트 카드 정보:
   - 카드번호: 5570-0000-0000-0001
   - 유효기간: 임의의 미래 날짜
   - CVC: 임의의 3자리 숫자
2. 테스트 환경에서 실제 결제 없이 승인 가능
3. 운영 전환 시 라이브 키로 교체

### 🛠️ 기술 스택 업데이트

- **Frontend**: Vanilla JavaScript (장바구니, 주문 폼)
- **Backend**: Hono (TypeScript)
- **Database**: Cloudflare D1 (orders, order_items 테이블)
- **External APIs**:
  - Daum Postcode API (주소 검색)
  - 토스페이먼츠 SDK v2 (결제 위젯)
  - 토스페이먼츠 Payments API (결제 승인)

### 📊 주문 데이터베이스 스키마

**orders 테이블**:
- `order_number` - 주문번호 (ORDYYYYMMDDXXXXXX)
- `customer_*` - 고객 정보 (이름, 이메일, 전화번호, 주소)
- `*_amount` - 금액 정보 (상품 금액, 배송비, 할인, 최종 금액)
- `payment_status` - 결제 상태 (pending, paid, failed, cancelled, refunded)
- `order_status` - 주문 상태 (pending, confirmed, preparing, shipped, delivered, cancelled)
- `delivery_*` - 배송 정보 (택배사, 운송장 번호, 배송 메시지)
- `admin_memo` - 관리자 메모
- `*_at` - 타임스탬프 (주문일시, 결제일시, 배송일시, 배송완료일시, 취소일시)

**order_items 테이블**:
- `order_id` - 주문 ID (FK)
- `product_id` - 제품 ID (FK)
- `product_*` - 제품 정보 스냅샷 (이름, 컨셉, 카테고리, 용량)
- `quantity` - 수량
- `unit_price` - 단가
- `total_price` - 총액

### 🔮 향후 개선 계획

1. **이메일 자동 발송**
   - SendGrid, Mailgun, Resend 등 이메일 서비스 연동
   - 주문 확인 이메일 (주문번호, 주문 내역)
   - 배송 시작 알림 이메일 (운송장 번호, 배송 추적 링크)
   - 배송 완료 알림 이메일

2. **SMS 자동 발송**
   - Twilio, Aligo 등 SMS 서비스 연동
   - 주문 확인 SMS
   - 배송 시작 알림 SMS
   - 배송 완료 SMS

3. **결제 고도화**
   - 토스페이먼츠 라이브 키 적용 (운영 전환)
   - 간편결제 수단 추가 활성화
   - 정기결제 지원 (구독 서비스)
   - 환불 자동화 API 연동

4. **재고 관리 고도화**
   - 재고 부족 알림
   - 자동 재고 조정
   - 재고 히스토리 추적
   - 품절 상품 자동 숨김

5. **고객 주문 조회**
   - 고객이 주문번호로 주문 상태 조회
   - 배송 추적 링크 제공
   - 주문 취소 요청 기능
   - 반품/환불 신청 기능

---

**마지막 업데이트**: 2025-11-17  
**버전**: 1.8.5 (Product Detail Page)  
**상태**: ✅ 제품 상세 페이지 추가 완료  
**회사명**: 웰씨코리아 (Wellthy Korea)  
**결제 방식**: 토스페이먼츠 라이브 키 (실제 결제 가능)  
**배포 상태**: ✅ 프로덕션 배포 완료  
**프로덕션 URL**: https://www.aromapulse.kr  
**최신 배포**: https://08d4974b.aromapulse.pages.dev

### 💳 결제 시스템 (v1.8.4) - 실제 결제 활성화

**토스페이먼츠 라이브 키 적용** ⭐ 실제 결제 가능
- **상태**: ✅ 실제 결제 시스템 활성화 완료
- **적용 날짜**: 2025-11-16
- **클라이언트 키**: `live_ck_ZLKGPx4M3Mn5J0ye7mj2VBaWypv1` (프론트엔드)
- **시크릿 키**: Cloudflare Pages Secrets에 안전하게 저장 (백엔드)
- **지원 결제 수단**:
  - 신용/체크카드
  - 계좌이체
  - 가상계좌
  - 간편결제 (토스페이, 카카오페이, 네이버페이 등)

**주문 프로세스** (완전 자동화):
1. 장바구니 → 주문서 작성
2. 토스페이먼츠 결제 위젯에서 결제 수단 선택
3. 결제하기 버튼 클릭 → 실제 결제 진행
4. 결제 승인 후 주문 자동 생성
5. 재고 자동 차감
6. 주문 완료 페이지 표시

**보안**:
- ✅ HTTPS 통신
- ✅ 서버 측 결제 승인 검증
- ✅ Amount 위변조 방지
- ✅ 환경 변수로 시크릿 키 관리

### 🔧 최신 수정 사항 (v1.8.4)
1. ✅ **실제 결제 시스템 활성화**: 토스페이먼츠 라이브 키 적용 (2025-11-16)
2. ✅ **프로덕션 배포**: https://www.aromapulse.kr에서 실제 결제 가능
3. ✅ **Cloudflare Pages Secrets 설정**: TOSS_SECRET_KEY, TOSS_CLIENT_KEY 등록
4. ✅ **프론트엔드 라이브 키 업데이트**: checkout.js에 라이브 클라이언트 키 적용
5. ✅ **백엔드 환경 변수 설정**: .dev.vars에 라이브 키 설정
6. ✅ **결제 SDK 로딩 개선**: waitForTossPayments() 함수로 SDK 로드 대기
7. ✅ **CORS/CSP 설정**: _headers 파일로 토스페이먼츠 SDK 허용
8. ✅ **Git 커밋 완료**: "Enable live payment with Toss Payments"

### 🎯 토스페이먼츠 SDK v2 주요 특징

**결제 위젯 SDK v2의 장점**:
- ✅ **간편한 연동**: 복잡한 설정 없이 간단한 초기화로 결제 UI 렌더링
- ✅ **자동 UI 관리**: 토스페이먼츠가 결제 수단 UI를 자동으로 관리 및 업데이트
- ✅ **다양한 결제 수단**: 카드, 계좌이체, 가상계좌, 간편결제 등 자동 지원
- ✅ **반응형 디자인**: 모바일/데스크톱 환경에 자동 최적화
- ✅ **보안 강화**: PCI-DSS 인증, 3D Secure 자동 처리
- ✅ **실시간 업데이트**: 토스페이먼츠에서 새로운 결제 수단 추가 시 자동 반영

**구현 완료 사항**:
1. ✅ 결제 위젯 SDK v2 연동 (`https://js.tosspayments.com/v2/payment-widget`)
2. ✅ 결제 UI 자동 렌더링 (결제 수단 선택, 이용약관 동의)
3. ✅ 결제 승인 API (`POST /api/orders/confirm-payment`)
4. ✅ 재고 자동 차감 (결제 성공 시)
5. ✅ 주문 상태 자동 업데이트 (`payment_status='paid'`, `order_status='confirmed'`)
6. ✅ 결제 성공/실패 페이지
7. ✅ 장바구니 자동 비우기 (결제 완료 후)
