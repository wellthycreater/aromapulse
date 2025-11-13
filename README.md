# 아로마펄스 시장 테스트 플랫폼 (Lean MVP)

## 🎯 프로젝트 개요

**목적**: 불면, 우울, 불안 등 스트레스 관련 증상에 관심이 있는 B2C 사용자와 오프라인 중심 로컬 향기 공방·소규모 업체(B2B)를 온라인으로 연결하는 시장 테스트 플랫폼

**특징**:
- 텍스트 중심 데이터 수집 및 분석
- Rule 기반 추천 시스템 (AI 없이 운영)
- 자사 블로그 중심 유입 및 리뷰 수집
- 증상케어 제품 vs 리프레시 제품 구분

## 🌐 접속 URL

### 개발 환경 (Sandbox)
- **Frontend**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai
- **API Health Check**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/api/health
- **관리자 대시보드**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/api/admin/dashboard/stats

### 프로덕션 (배포 후)
- **Production URL**: (Cloudflare Pages 배포 후 생성됨)

## 📋 현재 완료된 기능

### ✅ 핵심 기능
1. **회원 시스템**
   - B2C 사용자 (일반 스트레스형 / 직무 스트레스형)
   - B2B 사용자 (조향사 / 기업 / 가게)
   - 회원가입/로그인 API 완성

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
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me/:id` - 사용자 정보 조회

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

### Cloudflare Pages 배포

```bash
# 1. Cloudflare API 키 설정
# (Deploy 탭에서 API 키 설정 필요)

# 2. D1 Database 생성 (프로덕션)
npx wrangler d1 create webapp-production
# database_id를 wrangler.jsonc에 추가

# 3. 마이그레이션 적용 (프로덕션)
npm run db:migrate:prod

# 4. 배포
npm run deploy:prod
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

**Last Updated**: 2025-11-13
**Version**: 1.0.0 (Lean MVP)
**Status**: ✅ 개발 완료, 테스트 중
