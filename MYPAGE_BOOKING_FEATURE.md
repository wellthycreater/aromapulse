# 마이페이지 예약 내역 기능 추가

## 📋 개요

사용자가 자신의 예약 내역을 마이페이지에서 확인할 수 있는 기능을 추가했습니다.

## ✅ 추가된 기능

### 1. **예약 내역 조회**
- 사용자의 모든 원데이 클래스 예약 내역 표시
- 예약 날짜 기준 최신순 정렬
- 예약 상태별 표시 (pending, confirmed, cancelled, completed)

### 2. **예약 필터링**
- **전체**: 모든 예약 표시
- **워크샵**: 워크샵 예약만 필터링 (추후 구현)
- **원데이 클래스**: 원데이 클래스 예약만 표시

### 3. **통계 대시보드**
마이페이지 상단에 사용자 활동 통계 표시:
- 총 주문 횟수
- 총 예약 횟수
- 상담 횟수 (추후 구현)

### 4. **예약 상세 정보**
각 예약 카드에 표시되는 정보:
- 예약 타입 (원데이 클래스/워크샵)
- 클래스명
- 예약 날짜 및 시간
- 참가 인원
- 총 결제 금액
- 예약 상태
- 상세보기 버튼

---

## 🔧 기술적 구현

### 백엔드 API

#### 1. `/api/bookings/my-bookings` (GET)
사용자의 예약 내역을 조회하는 API

**요청**:
```http
GET /api/bookings/my-bookings
Cookie: auth_token=<JWT_TOKEN>
```

**응답**:
```json
{
  "success": true,
  "bookings": [
    {
      "booking_id": "CLASS-123",
      "type": "class",
      "title": "천연 아로마 롤온 만들기",
      "date": "2024년 11월 30일 오후 02:00",
      "participants": 2,
      "amount": 50000,
      "status": "confirmed",
      "location": "서울 강남구 테헤란로",
      "created_at": "2024-11-24T12:00:00.000Z"
    }
  ]
}
```

**구현 위치**: `/src/routes/bookings.ts`

```typescript
bookings.get('/my-bookings', async (c: Context) => {
  // 사용자 인증 확인
  const token = getCookie(c, 'auth_token');
  const payload = await jwtManager.verify(token);
  
  // 예약 조회
  const classBookings = await DB.prepare(`
    SELECT 
      b.id, b.booking_date, b.participants, 
      b.total_price, b.status, b.created_at,
      c.title, c.location, c.address
    FROM oneday_class_bookings b
    JOIN oneday_classes c ON b.class_id = c.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC
  `).bind(payload.userId).all();
  
  // 형식화
  const formattedBookings = classBookings.results.map(booking => ({
    booking_id: `CLASS-${booking.id}`,
    type: 'class',
    title: booking.class_title,
    date: new Date(booking.booking_date).toLocaleDateString('ko-KR', ...),
    // ...
  }));
  
  return c.json({ success: true, bookings: formattedBookings });
});
```

#### 2. `/api/bookings/stats` (GET)
사용자의 활동 통계를 조회하는 API

**요청**:
```http
GET /api/bookings/stats
Cookie: auth_token=<JWT_TOKEN>
```

**응답**:
```json
{
  "success": true,
  "stats": {
    "total_orders": 5,
    "total_bookings": 3,
    "total_consultations": 0
  }
}
```

**구현 위치**: `/src/routes/bookings.ts`

```typescript
bookings.get('/stats', async (c: Context) => {
  // 예약 수 카운트
  const bookingsCount = await DB.prepare(`
    SELECT COUNT(*) as count FROM oneday_class_bookings
    WHERE user_id = ?
  `).bind(payload.userId).first();
  
  // 주문 수 카운트
  const ordersCount = await DB.prepare(`
    SELECT COUNT(*) as count FROM orders
    WHERE user_id = ?
  `).bind(payload.userId).first();
  
  return c.json({
    success: true,
    stats: {
      total_orders: ordersCount?.count || 0,
      total_bookings: bookingsCount?.count || 0,
      total_consultations: 0
    }
  });
});
```

---

### 프론트엔드

#### 1. 예약 내역 로드 함수

**파일**: `/public/static/mypage.js`

```javascript
async function loadBookings(type = 'all') {
    const response = await fetch('/api/bookings/my-bookings', {
        credentials: 'include'
    });
    
    const data = await response.json();
    let bookings = data.bookings || [];
    
    // 타입 필터링
    if (type !== 'all') {
        bookings = bookings.filter(b => b.type === type);
    }
    
    // 예약 카드 렌더링
    bookingsList.innerHTML = bookings.map(booking => `
        <div class="bg-white border rounded-2xl p-6">
            <span class="badge">${booking.type === 'class' ? '원데이 클래스' : '워크샵'}</span>
            <h4>${booking.title}</h4>
            <p>날짜: ${booking.date}</p>
            <p>인원: ${booking.participants}명</p>
            <p>금액: ${booking.amount.toLocaleString()}원</p>
            <button onclick="viewBookingDetail('${booking.booking_id}')">상세보기</button>
        </div>
    `).join('');
}
```

#### 2. 통계 로드 함수

```javascript
async function loadUserStats() {
    const response = await fetch('/api/bookings/stats', {
        credentials: 'include'
    });
    
    const data = await response.json();
    const stats = data.stats || {};
    
    // 통계 카드 업데이트
    document.querySelectorAll('.stat-card .text-2xl')[0].textContent = stats.total_orders;
    document.querySelectorAll('.stat-card .text-2xl')[1].textContent = stats.total_bookings;
    document.querySelectorAll('.stat-card .text-2xl')[2].textContent = stats.total_consultations;
}
```

#### 3. 탭 전환 시 자동 로드

```javascript
function showTab(tabName) {
    // 탭 전환
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // 예약 탭 클릭 시 데이터 로드
    if (tabName === 'bookings') {
        loadBookings();
    }
}
```

---

## 📱 사용자 인터페이스

### 마이페이지 구조

```
┌─────────────────────────────────────────┐
│  프로필 사진 | 이름                      │
│  이메일                                   │
│                                          │
│  📊 통계 카드                             │
│  ┌─────┐  ┌─────┐  ┌─────┐              │
│  │ 0   │  │ 3   │  │ 0   │              │
│  │주문 │  │예약 │  │상담 │              │
│  └─────┘  └─────┘  └─────┘              │
│                                          │
│  [프로필] [주문] [예약] [상담] [보안]    │
│                                          │
│  📅 예약 내역                             │
│  [전체] [워크샵] [원데이 클래스]          │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ 🟢 원데이 클래스                │     │
│  │ 천연 아로마 롤온 만들기         │     │
│  │ 📅 2024년 11월 30일 오후 2:00  │     │
│  │ 👥 2명 | 💰 50,000원           │     │
│  │ [상세보기]                      │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### 예약 상태 표시

- **pending** (대기중): 주황색 배지
- **confirmed** (확정): 초록색 배지
- **cancelled** (취소): 빨간색 배지
- **completed** (완료): 회색 배지

---

## 🧪 테스트 방법

### 1. 예약 생성 후 확인

```bash
# 1. 로그인
https://www.aromapulse.kr/login

# 2. 클래스 예약
https://www.aromapulse.kr/static/classes.html

# 3. 마이페이지 접속
https://www.aromapulse.kr/static/mypage.html

# 4. "예약 내역" 탭 클릭

# 5. 확인 사항:
# - 통계 카드에 "총 예약" 숫자 증가
# - 예약 내역 목록에 새 예약 표시
# - 예약 정보가 올바르게 표시됨
```

### 2. API 직접 테스트

```bash
# 예약 내역 조회
curl -X GET https://www.aromapulse.kr/api/bookings/my-bookings \
  -H "Cookie: auth_token=YOUR_TOKEN"

# 통계 조회
curl -X GET https://www.aromapulse.kr/api/bookings/stats \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

---

## 🚀 배포 정보

- **배포 URL**: https://bf86d8c4.aromapulse.pages.dev
- **메인 도메인**: https://www.aromapulse.kr
- **배포 시간**: 2024-11-24

---

## 📝 향후 개선 사항

### 단기 (1-2주)
- [ ] 예약 상세 보기 모달 구현
- [ ] 예약 취소 기능
- [ ] 워크샵 예약 지원
- [ ] 예약 수정 기능

### 중기 (1-2개월)
- [ ] 예약 히스토리 페이지네이션
- [ ] 예약 검색 및 정렬 기능
- [ ] 예약 알림 기능 (이메일/SMS)
- [ ] 예약 리뷰 작성 기능

### 장기 (3개월+)
- [ ] 예약 결제 통합
- [ ] 예약 환불 관리
- [ ] 예약 포인트 적립
- [ ] 예약 추천 시스템

---

## 🐛 알려진 이슈

1. **워크샵 예약**: 아직 워크샵 예약 시스템이 구현되지 않아 필터링이 작동하지 않음
2. **상담 횟수**: 상담 시스템이 구현되지 않아 항상 0으로 표시
3. **예약 상세보기**: 상세보기 버튼 클릭 시 기능이 구현되지 않음

---

## 📚 관련 문서

- [예약 시스템 API 문서](./src/routes/bookings.ts)
- [마이페이지 UI 가이드](./public/static/mypage.html)
- [Google Calendar 통합](./GOOGLE_CALENDAR_INTEGRATION.md)
