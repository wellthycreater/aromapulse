# 쇼핑 예약 통합 완료

## 📦 개요

마이페이지 예약 내역에 **쇼핑(제품) 예약**을 추가하여, 사용자가 원데이 클래스와 쇼핑 예약을 한 곳에서 볼 수 있도록 통합했습니다.

## ✅ 완료된 작업

### 1. **백엔드 API 수정**

#### `/api/bookings/my-bookings` 수정
- 원데이 클래스 예약 + 제품 예약 통합 조회
- 두 타입의 예약을 `created_at` 기준 최신순 정렬
- 통일된 형식으로 응답

**수정 전**:
```typescript
// 원데이 클래스 예약만 조회
const classBookings = await DB.prepare(`...`).all();
return c.json({ bookings: formattedClassBookings });
```

**수정 후**:
```typescript
// 원데이 클래스 예약 조회
const classBookings = await DB.prepare(`...`).all();

// 제품 예약 조회
const productBookings = await DB.prepare(`
  SELECT 
    b.id, b.booking_date, b.quantity as participants,
    b.total_price, b.status, b.created_at,
    p.name as product_name
  FROM product_bookings b
  JOIN products p ON b.product_id = p.id
  WHERE b.user_id = ?
`).all();

// 통합 및 정렬
const allBookings = [...formattedClassBookings, ...formattedProductBookings]
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

return c.json({ success: true, bookings: allBookings });
```

#### `/api/bookings/stats` 수정
- 제품 예약 수를 예약 통계에 포함

**수정 전**:
```typescript
const bookingsCount = await DB.prepare(`
  SELECT COUNT(*) FROM oneday_class_bookings WHERE user_id = ?
`);
```

**수정 후**:
```typescript
const classBookingsCount = await DB.prepare(`
  SELECT COUNT(*) FROM oneday_class_bookings WHERE user_id = ?
`);

const productBookingsCount = await DB.prepare(`
  SELECT COUNT(*) FROM product_bookings WHERE user_id = ?
`);

const totalBookings = (classBookingsCount?.count || 0) + (productBookingsCount?.count || 0);
```

---

### 2. **프론트엔드 UI 수정**

#### 예약 타입 배지 추가
- **원데이 클래스**: 초록색 배지 🟢
- **쇼핑 예약**: 파란색 배지 🔵
- **워크샵**: 보라색 배지 🟣

**수정된 코드**:
```javascript
<span class="inline-block px-3 py-1.5 rounded-full text-xs font-medium mb-2 ${
    booking.type === 'workshop' ? 'bg-purple-50 text-purple-600' : 
    booking.type === 'product' ? 'bg-blue-50 text-blue-600' : 
    'bg-green-50 text-green-600'
}">
    ${
        booking.type === 'workshop' ? '워크샵' : 
        booking.type === 'product' ? '쇼핑 예약' : 
        '원데이 클래스'
    }
</span>
```

#### 필터 버튼 추가
마이페이지 예약 내역 탭에 "쇼핑 예약" 필터 추가

**HTML 변경**:
```html
<button onclick="filterBookings('all')">전체</button>
<button onclick="filterBookings('class')">원데이 클래스</button>
<button onclick="filterBookings('product')">쇼핑 예약</button>
<button onclick="filterBookings('workshop')">워크샵</button>
```

---

## 📊 예약 데이터 구조

### API 응답 형식

```json
{
  "success": true,
  "bookings": [
    {
      "booking_id": "PRODUCT-123",
      "type": "product",
      "title": "라벤더 릴렉스 디퓨저",
      "date": "2024년 11월 25일 오전 07:14",
      "participants": 4,
      "amount": 89000,
      "status": "pending",
      "location": "",
      "created_at": "2024-11-24T22:14:00.000Z"
    },
    {
      "booking_id": "CLASS-9",
      "type": "class",
      "title": "향기로운 힐링 체험",
      "date": "2024년 11월 25일 오전 10:00",
      "participants": 1,
      "amount": 50000,
      "status": "confirmed",
      "location": "서울시 강남구 테헤란로 123",
      "created_at": "2024-11-24T22:10:00.000Z"
    }
  ]
}
```

### 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `booking_id` | string | 예약 고유 ID (CLASS-*, PRODUCT-*) |
| `type` | string | 예약 타입 (class, product, workshop) |
| `title` | string | 클래스명 또는 제품명 |
| `date` | string | 예약 날짜/시간 (한글 형식) |
| `participants` | number | 참가 인원 또는 수량 |
| `amount` | number | 총 결제 금액 |
| `status` | string | 예약 상태 (pending, confirmed, etc) |
| `location` | string | 장소 (클래스만 해당) |
| `created_at` | string | 예약 생성 시간 (ISO 8601) |

---

## 🎨 사용자 인터페이스

### 마이페이지 예약 내역 화면

```
┌─────────────────────────────────────────┐
│  📅 예약 내역                            │
│  [전체] [원데이 클래스] [쇼핑 예약] [워크샵] │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ 🔵 쇼핑 예약                    │     │
│  │ 예약일: 2024. 11. 24.           │     │
│  │                                 │     │
│  │ 라벤더 릴렉스 디퓨저             │     │
│  │ 📅 2024년 11월 25일 오전 7:14   │     │
│  │ 📦 4개 | 💰 89,000원            │     │
│  │ 🟡 대기중         [상세보기]     │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ 🟢 원데이 클래스                │     │
│  │ 예약일: 2024. 11. 24.           │     │
│  │                                 │     │
│  │ 향기로운 힐링 체험              │     │
│  │ 📅 2024년 11월 25일 오전 10:00  │     │
│  │ 👥 1명 | 💰 50,000원            │     │
│  │ 🟢 확정됨         [상세보기]     │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### 통계 카드 업데이트

```
┌─────────┬─────────┬─────────┐
│   5개   │   2개   │   0회   │
│  주문   │  예약   │  상담   │
└─────────┴─────────┴─────────┘
```

"총 예약" 숫자가 **원데이 클래스 예약 + 쇼핑 예약** 합계로 표시됩니다.

---

## 🧪 테스트 시나리오

### 시나리오 1: 예약 내역 전체 보기

1. 마이페이지 접속: https://www.aromapulse.kr/static/mypage.html
2. "예약 내역" 탭 클릭
3. "전체" 필터 선택 (기본값)
4. **확인 사항**:
   - ✅ 두 개의 예약이 모두 표시됨
   - ✅ 쇼핑 예약 (파란 배지)
   - ✅ 원데이 클래스 (초록 배지)
   - ✅ 최신 예약이 위에 표시됨

### 시나리오 2: 필터링 테스트

1. **"원데이 클래스" 필터 클릭**
   - ✅ 원데이 클래스 예약만 표시
   - ✅ 쇼핑 예약은 숨김

2. **"쇼핑 예약" 필터 클릭**
   - ✅ 쇼핑 예약만 표시
   - ✅ 원데이 클래스는 숨김

3. **"전체" 필터 클릭**
   - ✅ 모든 예약 다시 표시

### 시나리오 3: 통계 확인

1. 마이페이지 접속
2. 상단 통계 카드 확인
3. **확인 사항**:
   - ✅ "총 예약" = 2개 (클래스 1개 + 제품 1개)
   - ✅ 예약 추가 시 숫자 증가
   - ✅ 실시간 업데이트

---

## 🚀 배포 정보

- **배포 URL**: https://b6fcc7d5.aromapulse.pages.dev
- **메인 도메인**: https://www.aromapulse.kr
- **배포 시간**: 2024-11-24

---

## 📝 실제 사용자 예약 데이터

귀하의 예약 내역:

### 1. 쇼핑 예약
```
제품명: 라벤더 릴렉스 디퓨저
날짜: 11월 25일 (화요일) 오전 7:14~ 8:44
수량: 4개
예약자: 정하민
설명: 편안한 휴식을 위한 프리미엄 라벤더 디퓨저
```

### 2. 원데이 클래스 예약
```
클래스명: 향기로운 힐링 체험
날짜: 11월 25일 (화요일) 오전 10:00~오후 12:00
장소: 서울시 강남구 테헤란로 123
예약 번호: 9
참가 인원: 1명
예약자: 정하민
연락처: 01030045183
```

---

## 🎯 예상 결과

마이페이지에서 예약 내역 탭을 클릭하면:

1. **통계 카드**:
   - 총 주문: (주문 데이터가 있다면 표시)
   - **총 예약: 2개** ✅
   - 상담 횟수: 0회

2. **예약 목록**:
   - 🔵 **쇼핑 예약**: 라벤더 릴렉스 디퓨저 (4개, 89,000원)
   - 🟢 **원데이 클래스**: 향기로운 힐링 체험 (1명, 50,000원)

3. **필터 기능**:
   - [전체] - 2개 표시
   - [원데이 클래스] - 1개 표시
   - [쇼핑 예약] - 1개 표시
   - [워크샵] - 0개 표시

---

## 🔗 관련 파일

- **백엔드**: `/src/routes/bookings.ts`
- **프론트엔드 JS**: `/public/static/mypage.js`
- **프론트엔드 HTML**: `/public/static/mypage.html`

---

## ✨ 완료된 기능 요약

1. ✅ 원데이 클래스 예약 표시
2. ✅ 쇼핑(제품) 예약 표시
3. ✅ 두 타입 통합 및 정렬
4. ✅ 타입별 색상 구분 (배지)
5. ✅ 필터링 기능
6. ✅ 통계에 제품 예약 포함
7. ✅ 프로덕션 배포 완료

이제 사용자는 **모든 예약을 한 곳에서** 확인할 수 있습니다! 🎉
