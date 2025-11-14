# 블로그 댓글 → AI 챗봇 연동 테스트 가이드

## 🎯 테스트 개요

네이버 블로그 댓글을 수집하여 AI 챗봇 상담으로 자동 연결하는 시스템 테스트

**테스트 블로그 포스트**: https://blog.naver.com/aromapulse/223921529276

---

## 📋 테스트 절차

### Step 1: 블로그 포스트 등록

```bash
curl -X POST https://www.aromapulse.kr/api/blog-reviews/posts \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "223921529276",
    "title": "아로마테라피로 불면증 극복하기",
    "content": "불면증으로 고민하시는 분들을 위한 아로마 제품 추천",
    "category": "증상케어",
    "url": "https://blog.naver.com/aromapulse/223921529276",
    "published_at": "2024-11-14T00:00:00Z"
  }'
```

**예상 응답**:
```json
{
  "message": "블로그 포스트가 등록되었습니다",
  "id": 1
}
```

---

### Step 2: B2C 댓글 테스트 (구매 의도)

```bash
curl -X POST https://www.aromapulse.kr/api/blog-reviews/comments \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "223921529276",
    "author_name": "김영희",
    "author_id": "user123",
    "content": "안녕하세요. 불면증이 심해서 고민이에요. 라벤더 제품 구매하고 싶은데 어떤 게 좋을까요?"
  }'
```

**예상 응답**:
```json
{
  "message": "댓글이 등록되었습니다",
  "id": 2,
  "analysis": {
    "sentiment": "neutral",
    "user_type_prediction": null,
    "intent": "구매의도",
    "keywords": ["불면증", "라벤더"]
  },
  "chatbot_session_id": 1,
  "chatbot_url": "/chatbot?session=1"
}
```

**AI 자동 응답**:
```
안녕하세요! 블로그 댓글 감사합니다. 😊

구매에 관심 가져주셔서 감사합니다!
불면증, 라벤더 관련 제품을 추천해드릴 수 있습니다.

🎁 첫 구매 고객님께 특별 혜택을 드립니다:
• 첫 구매 10% 할인
• 적립금 5%
• 무료 배송

제품 상담이나 주문을 원하시면 말씀해주세요!
```

---

### Step 3: B2B 댓글 테스트 (대량 납품)

```bash
curl -X POST https://www.aromapulse.kr/api/blog-reviews/comments \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "223921529276",
    "author_name": "박사장",
    "author_id": "business456",
    "content": "저희 미용실에서 아로마 제품 대량 납품받고 싶습니다. 견적 문의 드립니다."
  }'
```

**예상 응답**:
```json
{
  "message": "댓글이 등록되었습니다",
  "id": 3,
  "analysis": {
    "sentiment": "neutral",
    "user_type_prediction": "B2B",
    "intent": "문의",
    "keywords": []
  },
  "chatbot_session_id": 2,
  "chatbot_url": "/chatbot?session=2"
}
```

**AI 자동 응답**:
```
안녕하세요! 블로그 댓글 감사합니다. 😊

궁금하신 점이 있으신가요? 무엇이든 물어보세요!
```

---

### Step 4: 챗봇 대화 확인

**방법 1: 브라우저에서 직접 확인**
```
https://www.aromapulse.kr/chatbot?session=1
```

**방법 2: API로 대화 내역 조회**
```bash
curl https://www.aromapulse.kr/api/chatbot/session/1/messages
```

---

## 🔍 자동 챗봇 세션 생성 조건

다음 의도가 감지되면 자동으로 챗봇 세션 생성:

| 의도 | 키워드 | 예시 |
|------|--------|------|
| **구매의도** | 구매, 주문, 살, 사고 | "제품 구매하고 싶어요" |
| **문의** | 문의, 궁금, 질문 | "제품 문의 드립니다" |
| **B2B문의** | 납품, 대량, 기업 | "대량 납품 문의드립니다" |
| **가격문의** | 가격, 얼마, 비용 | "가격이 얼마인가요?" |

---

## 📊 테스트 결과 확인

### 1. 댓글 목록 조회
```bash
curl https://www.aromapulse.kr/api/blog-reviews/posts/223921529276
```

### 2. 댓글 분석 통계
```bash
curl https://www.aromapulse.kr/api/blog-reviews/stats/comments
```

### 3. 리드 발굴 (B2B/B2C)
```bash
# B2C 리드
curl "https://www.aromapulse.kr/api/blog-reviews/leads?user_type=B2C&intent=구매의도"

# B2B 리드
curl "https://www.aromapulse.kr/api/blog-reviews/leads?user_type=B2B&intent=문의"
```

### 4. 챗봇 전환율 통계
```bash
curl https://www.aromapulse.kr/api/chatbot/conversion-stats
```

---

## ✅ 성공 기준

1. ✅ 댓글 등록 시 AI 분석 정상 작동
2. ✅ 구매 의도 감지 시 챗봇 세션 자동 생성
3. ✅ B2C/B2B 자동 분류
4. ✅ 맞춤형 AI 응답 생성
5. ✅ 챗봇 URL 제공

---

## 🌐 테스트 환경

- **샌드박스**: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai
- **프로덕션**: https://www.aromapulse.kr

---

## 📝 테스트 시나리오

### 시나리오 1: 일반 고객 (B2C)
```
1. 사용자: "불면증이 심해서 라벤더 제품 구매하고 싶어요"
2. AI 분석: 의도=구매의도, 키워드=[불면증, 라벤더], 타입=B2C
3. 챗봇 세션 생성 ✅
4. AI 응답: "첫 구매 10% 할인 혜택..."
```

### 시나리오 2: 기업 고객 (B2B)
```
1. 사용자: "미용실에서 대량 납품 문의드립니다"
2. AI 분석: 의도=문의, 타입=B2B
3. 챗봇 세션 생성 ✅
4. AI 응답: "워크샵, 대량 납품 서비스 안내..."
```

### 시나리오 3: 일반 문의 (챗봇 X)
```
1. 사용자: "좋은 정보 감사합니다"
2. AI 분석: 의도=일반댓글, 감정=긍정
3. 챗봇 세션 생성 안 함 ❌
4. 댓글만 저장
```

---

## 🎯 핵심 기능

1. **실시간 AI 분석**: 댓글 작성 즉시 의도/감정/키워드 분석
2. **자동 세션 생성**: 구매 의도 감지 시 챗봇 자동 연결
3. **맞춤형 응답**: B2C/B2B 자동 감지 후 차별화된 혜택 안내
4. **컨텍스트 유지**: 블로그 포스트 정보 + 댓글 내용 챗봇에 전달
5. **전환 추적**: 댓글 → 챗봇 → 회원가입 경로 추적

---

**마지막 업데이트**: 2024-11-14  
**버전**: 1.5.0
