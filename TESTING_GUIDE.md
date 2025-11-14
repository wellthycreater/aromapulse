# 블로그 댓글 수집 시스템 테스트 가이드

## 🎯 테스트 목적
Admin 페이지를 통해 네이버 블로그 댓글을 수집하고, B2B 리드를 자동으로 발굴하는 기능을 테스트합니다.

## 📋 사전 준비

### 1. Admin 페이지 접속
**URL**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/admin-products

### 2. 로그인 (필요 시)
- Admin 계정으로 로그인
- 또는 public 접근 가능 (인증 없이 테스트 가능)

## 🧪 테스트 시나리오

### 시나리오 1: 새 블로그 포스트 댓글 수집

#### 1단계: 블로그 관리 탭 이동
1. Admin 페이지에서 **"블로그 관리"** 탭 클릭
2. "블로그 게시물 등록" 카드 확인

#### 2단계: URL 입력 및 수집
1. 입력 필드에 다음 URL 입력:
   ```
   https://blog.naver.com/aromapulse/223879507099
   ```
2. **"댓글 수집 및 분석"** 버튼 클릭

#### 3단계: 결과 확인
**예상 결과** (알림창):
```
댓글 수집 완료!

- 총 댓글: 4개
- 구매 의도: 1개
- B2C: 0개
- B2B: 1개
- 생성된 챗봇 세션: 1개
```

#### 4단계: 포스트 카드 확인
- "등록된 블로그 게시물" 섹션에 새 카드 표시
- 카드 내용:
  - 제목: "블로그 게시물 223879507099"
  - URL 링크
  - 통계: 댓글 4개, B2C 0개, B2B 1개, 챗봇 1개

---

### 시나리오 2: 중복 수집 테스트

#### 1단계: 같은 URL 재입력
```
https://blog.naver.com/aromapulse/223879507099
```

#### 2단계: 결과 확인
**예상 결과**:
```
댓글 수집 완료!

- 총 댓글: 0개
- 구매 의도: 0개
- B2C: 0개
- B2B: 0개
- 생성된 챗봇 세션: 0개
```

**설명**: 이미 수집된 댓글은 자동으로 스킵되어 중복 저장되지 않습니다.

---

### 시나리오 3: 다른 포스트 수집

#### 1단계: 다른 URL 입력
```
https://blog.naver.com/aromapulse/223921529276
```

#### 2단계: 결과 확인
- 새로운 4개 댓글 수집
- 포스트별로 독립적인 댓글 관리

---

### 시나리오 4: B2B 챗봇 세션 확인

#### 1단계: 챗봇 페이지 접속
**URL**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/chatbot

#### 2단계: B2B 세션 찾기
- 세션 목록에서 "B2B" 태그가 있는 세션 확인
- "여행에 힐링을 더하다" 작성자 찾기

#### 3단계: 대화 내용 확인
**예상 메시지**:
1. **시스템 메시지**: 
   ```
   [시스템] 블로그 댓글에서 시작된 대화입니다. 
   사용자: 여행에 힐링을 더하다, 의도: B2B문의, 감정: positive, 
   키워드: 라벤더, 베르가못, 에센셜오일, 캐리어오일
   ```

2. **사용자 메시지**:
   ```
   캐리어오일에 에센셜오일(베르가못, 라벤더)을 섞어서 
   목과 데콜테 마사지 해주고 있는데 손님 반응이 좋아요. 
   제품문의는 어디로 드리면 될까요
   ```

3. **AI 응답**:
   ```
   🏢 마사지/스파 비즈니스 고객님을 위한 맞춤 상담

   보다 정확한 상담을 위해 몇 가지 여쭤봐도 될까요?

   📋 추가 질문:
   1️⃣ 지역: 어느 지역에서 운영하고 계신가요?
   2️⃣ 필요하신 제품 형태:
      • 원료용 오일 (직접 블렌딩용)
      • 즉시 사용 가능한 완제품
      • 특정 제품
   3️⃣ 사용 목적: 직접 사용? 손님 서비스용? 판매용?
   4️⃣ 선호 향: 라벤더, 베르가못 외 다른 향도 필요하신가요?
   5️⃣ 월 사용량: 대략적인 월 사용량을 알려주시면 도움이 됩니다
   ```

---

## 🔍 데이터 검증

### 데이터베이스 직접 확인 (개발자용)

#### 수집된 댓글 확인
```bash
cd /home/user/webapp
npx wrangler d1 execute aromapulse-production --local \
  --command="SELECT author_name, intent, user_type_prediction FROM blog_comments LIMIT 10"
```

#### B2B 리드 확인
```bash
npx wrangler d1 execute aromapulse-production --local \
  --command="SELECT author_name, SUBSTR(content, 1, 50) as preview FROM blog_comments WHERE user_type_prediction = 'B2B'"
```

#### 챗봇 세션 확인
```bash
npx wrangler d1 execute aromapulse-production --local \
  --command="SELECT COUNT(*) as total FROM chatbot_sessions WHERE detected_user_type = 'B2B'"
```

---

## ✅ 테스트 체크리스트

### 기능 테스트
- [ ] 블로그 URL 입력 후 댓글 수집 성공
- [ ] 알림창에 통계 정보 표시
- [ ] 포스트 카드가 목록에 추가됨
- [ ] 중복 수집 시 스킵 처리
- [ ] 다른 포스트 독립적으로 수집

### AI 분석 테스트
- [ ] B2B 댓글 올바르게 분류 (여행에 힐링을 더하다)
- [ ] B2B문의 의도 정확히 감지
- [ ] 키워드 정상 추출 (라벤더, 베르가못, 에센셜오일, 캐리어오일)

### 챗봇 테스트
- [ ] B2B문의 댓글에 챗봇 세션 자동 생성
- [ ] 시스템 메시지에 메타데이터 포함
- [ ] AI 응답에 추가 질문 5개 포함
- [ ] 마사지/스파 비즈니스 맞춤 응답

### UI/UX 테스트
- [ ] 탭 전환 정상 작동
- [ ] 버튼 클릭 즉각 반응
- [ ] 로딩 상태 표시 (필요 시)
- [ ] 에러 메시지 명확하게 표시

---

## 🐛 알려진 이슈

### 1. 네이버 댓글 API 제한
**증상**: 실제 네이버 댓글 API 접근 실패 시 시뮬레이션 모드 사용

**원인**: 네이버 댓글 API가 공개적으로 제공되지 않거나 인증 필요

**대응**: 
- 시뮬레이션 모드: 실제 댓글 기반 더미 데이터 생성
- 각 포스트별 고유한 comment_id 사용

### 2. 시뮬레이션 데이터
**현재 동작**:
- 모든 블로그 URL에 대해 동일한 4개 댓글 생성
- 포스트별로 다른 comment_id 사용

**향후 개선**:
- 실제 네이버 댓글 API 연동
- 또는 Puppeteer/Playwright를 통한 실제 크롤링

---

## 📞 문제 발생 시

### 에러 메시지 확인
1. 브라우저 콘솔 (F12 → Console 탭)
2. PM2 로그: `pm2 logs aromapulse-webapp --nostream`

### 일반적인 해결 방법
1. **페이지 새로고침** (Ctrl+F5)
2. **서버 재시작**: `pm2 restart aromapulse-webapp`
3. **데이터베이스 확인**: wrangler d1 명령어로 데이터 확인

---

## 🎓 추가 리소스

- [BLOG_COMMENT_SYSTEM.md](./BLOG_COMMENT_SYSTEM.md) - 시스템 상세 문서
- [README.md](./README.md) - 프로젝트 전체 개요
- [Hono Framework 문서](https://hono.dev/)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
