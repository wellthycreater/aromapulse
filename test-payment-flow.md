# 토스페이먼츠 결제 시스템 테스트 가이드

## ✅ 1단계: 제품 API 확인
```bash
curl http://localhost:3000/api/products | jq '.products | length'
```
**예상 결과**: 제품 개수 반환 (예: 1)
**실제 결과**: ✅ 1개 제품 확인됨

---

## ✅ 2단계: 쇼핑몰 페이지 접근
**브라우저에서 접속**:
- 로컬: http://localhost:3000/shop
- 샌드박스: https://3000-ixw6l6ek5pa4nw2e7gi09-c07dda5e.sandbox.novita.ai/shop

**확인 사항**:
- [  ] 제품 목록이 표시되는가?
- [  ] 제품 이미지가 정상 로드되는가?
- [  ] "장바구니 담기" 버튼이 작동하는가?
- [  ] 가격이 정상 표시되는가?

---

## ✅ 3단계: 장바구니 기능 확인
**테스트 방법**:
1. 제품 카드에서 "장바구니 담기" 버튼 클릭
2. 알림 메시지 확인: "장바구니에 추가되었습니다"
3. F12 콘솔에서 확인: `localStorage.getItem('cart')`

**확인 사항**:
- [  ] 장바구니에 제품이 추가되는가?
- [  ] LocalStorage에 저장되는가?
- [  ] 수량 변경이 가능한가?

---

## ✅ 4단계: 주문 페이지 접근
**URL**: http://localhost:3000/static/checkout.html

**확인 사항**:
- [  ] 장바구니 제품이 표시되는가?
- [  ] 총 금액 계산이 정확한가? (제품가격 + 배송비 3,000원)
- [  ] 고객 정보 입력 폼이 표시되는가?
- [  ] 주소 검색 버튼이 작동하는가? (Daum Postcode API)

---

## ✅ 5단계: 토스페이먼츠 위젯 로드 확인
**브라우저 콘솔 (F12)에서 확인**:
```javascript
// 1. SDK 로드 확인
typeof loadPaymentWidget === 'function'  // true여야 함

// 2. 결제 위젯 초기화 확인
console.log('토스페이먼츠 결제 위젯 초기화 완료')  // 콘솔에 표시되어야 함
```

**확인 사항**:
- [  ] 결제 수단 선택 UI가 표시되는가?
- [  ] 이용약관 동의 체크박스가 표시되는가?
- [  ] "결제하기" 버튼이 활성화되는가?

---

## ✅ 6단계: 결제 승인 API 테스트 (수동)
```bash
# 결제 승인 API 엔드포인트 확인
curl -X POST http://localhost:3000/api/orders/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentKey": "test_payment_key_12345",
    "orderId": "ORDER_TEST_12345",
    "amount": 38000,
    "orderData": {
      "customer_name": "홍길동",
      "customer_email": "test@example.com",
      "customer_phone": "010-1234-5678",
      "customer_zipcode": "12345",
      "customer_address": "서울시 강남구",
      "customer_detail_address": "101동 101호",
      "delivery_message": "문 앞에 놓아주세요",
      "items": [
        {
          "product_id": 1,
          "quantity": 1,
          "unit_price": 35000
        }
      ],
      "total_amount": 35000,
      "delivery_fee": 3000,
      "final_amount": 38000
    }
  }'
```

**예상 응답**:
```json
{
  "error": "결제 승인 실패",
  "details": "토스페이먼츠 API 오류 메시지"
}
```
**이유**: 테스트 paymentKey이므로 실제 결제 승인은 실패함 (정상)

---

## ✅ 7단계: 실제 결제 플로우 테스트

### 7-1. 테스트 카드 정보
토스페이먼츠 테스트 환경에서 사용 가능한 카드:
- **카드번호**: 5570-0000-0000-0001
- **유효기간**: 임의의 미래 날짜 (예: 12/25)
- **CVC**: 임의의 3자리 숫자 (예: 123)
- **비밀번호 앞 2자리**: 임의 (예: 12)

### 7-2. 실제 결제 테스트 순서
1. **장바구니에 제품 추가**
2. **결제하기 버튼 클릭**
3. **고객 정보 입력**:
   - 이름: 홍길동
   - 이메일: test@example.com
   - 전화번호: 010-1234-5678
   - 주소: 주소 검색으로 입력
4. **결제 수단 선택**: 카드 결제
5. **테스트 카드 정보 입력**
6. **결제하기 버튼 클릭**
7. **결제 성공 페이지 확인**

---

## ✅ 8단계: 결제 성공/실패 페이지 확인

### 결제 성공 시:
**URL**: `/static/payment-success.html?paymentKey=xxx&orderId=xxx&amount=xxx`

**확인 사항**:
- [  ] "결제 완료!" 메시지가 표시되는가?
- [  ] 주문번호가 표시되는가?
- [  ] 결제 금액이 정확한가?
- [  ] 결제 수단이 표시되는가?
- [  ] "주문 내역 보기" 버튼이 작동하는가?

### 결제 실패 시:
**URL**: `/static/payment-fail.html?code=xxx&message=xxx`

**확인 사항**:
- [  ] "결제 실패" 메시지가 표시되는가?
- [  ] 실패 사유가 표시되는가?
- [  ] "다시 시도" 버튼이 작동하는가?

---

## ✅ 9단계: 관리자 페이지에서 주문 확인
**URL**: http://localhost:3000/static/admin-orders.html

**확인 사항**:
- [  ] 새 주문이 목록에 표시되는가?
- [  ] 결제 상태가 "결제 완료"인가?
- [  ] 주문 상태가 "주문 확인"인가?
- [  ] 고객 정보가 정확한가?
- [  ] 주문 상품이 정확한가?

---

## ✅ 10단계: 재고 차감 확인
```bash
# 주문 전 재고 확인
curl http://localhost:3000/api/products | jq '.products[0].stock'

# 주문 후 재고 확인 (1 감소해야 함)
curl http://localhost:3000/api/products | jq '.products[0].stock'
```

---

## 🔧 트러블슈팅

### 문제 1: 결제 위젯이 로드되지 않음
**원인**: SDK 스크립트 로드 실패
**해결**: 브라우저 콘솔에서 네트워크 오류 확인

### 문제 2: "결제 승인 실패" 오류
**원인**: 토스페이먼츠 API 키 오류
**해결**: `.dev.vars`에서 키 확인:
- `TOSS_CLIENT_KEY=test_ck_eqRGgYO1r56JgBPB9nnW8QnN2Eya`
- `TOSS_SECRET_KEY=test_sk_ma60RZblrq7YNqnEzPKb3wzYWBn1`

### 문제 3: 주문이 생성되지 않음
**원인**: 결제 승인 API 오류
**해결**: PM2 로그 확인:
```bash
pm2 logs aromapulse-webapp --nostream --lines 50
```

### 문제 4: 재고가 차감되지 않음
**원인**: 주문 상품 등록 시 재고 차감 로직 누락
**해결**: API 코드 확인 필요

---

## 📊 테스트 결과 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 제품 API | ✅ | 정상 작동 |
| 쇼핑몰 페이지 | ⏳ | 브라우저 테스트 필요 |
| 장바구니 기능 | ⏳ | 브라우저 테스트 필요 |
| 주문 페이지 | ⏳ | 브라우저 테스트 필요 |
| 토스 위젯 로드 | ⏳ | 브라우저 테스트 필요 |
| 결제 승인 API | ✅ | 엔드포인트 존재 확인 |
| 결제 성공 페이지 | ⏳ | 실제 결제 후 확인 |
| 관리자 페이지 | ⏳ | 주문 생성 후 확인 |
| 재고 차감 | ⏳ | 실제 결제 후 확인 |

---

## 🎯 다음 단계

1. **브라우저에서 실제 테스트**: 위 체크리스트를 따라 브라우저에서 테스트
2. **테스트 카드로 실제 결제**: 토스페이먼츠 테스트 환경에서 결제 진행
3. **로그 모니터링**: `pm2 logs aromapulse-webapp --lines 100` 실시간 확인
4. **문제 발견 시**: 위 트러블슈팅 섹션 참고

---

**마지막 업데이트**: 2025-11-15
**작성자**: AI Assistant
**테스트 환경**: Sandbox (localhost:3000)
