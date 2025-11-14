# 아로마펄스 시장 테스트 플랫폼 (Lean MVP)

## 🏢 회사 정보

**브랜드**: 아로마펄스 (AromaPulse)  
**운영사**: 웰씨코리아 (WellC Korea)  
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

6. **리뷰 시스템**
   - 자체 플랫폼 리뷰 작성
   - 블로그 댓글 수집 준비 완료
   - 수동 태깅 (감정/의도 분류)

4. **Rule 기반 추천 엔진**
   - 사용자 증상 + 지역 + 제품 타입 매칭
   - 추천 로그 자동 저장

8. **패치 신청 시스템**
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

## 🔄 향후 구현 예정

1. **블로그 RSS 자동 수집**
   - 네이버 블로그 (aromapulse) RSS 파싱
   - 주기적 포스트 수집

2. **블로그 댓글 크롤링**
   - 네이버 블로그 댓글 API 연동
   - 자동 댓글 수집 시스템

3. **프론트엔드 UI**
   - 회원가입/로그인 페이지
   - 제품 목록/상세 페이지
   - 리뷰 작성 페이지
   - 패치 신청 페이지
   - 관리자 대시보드

4. **이미지 업로드**
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
**Version**: 1.4.0 (Menu Structure Optimization)
**Status**: ✅ Cloudflare Pages 배포 완료
**Production URL**: https://035a2253.aromapulse.pages.dev
**Domain**: www.aromapulse.kr

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

