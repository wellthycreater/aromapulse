# 구글 캘린더 통합 완료

## 📅 구현 내용

### ✅ 완료된 기능
예약 완료 시 **구글 캘린더에 직접 추가** 버튼 구현

### 🔧 작동 방식

1. **예약 완료 후**:
   - 예약 성공 모달에 "Google Calendar에 추가" 버튼 표시
   
2. **버튼 클릭 시**:
   - 구글 캘린더 웹 인터페이스가 새 탭에서 열림
   - 예약 정보가 자동으로 채워진 이벤트 생성 화면 표시
   
3. **포함되는 정보**:
   - 📌 **제목**: 클래스명 (예: "천연 아로마 롤온 만들기")
   - 📅 **날짜/시간**: 예약한 날짜와 시간
   - ⏱️ **종료 시간**: 시작 시간 + duration (기본 90분)
   - 📍 **위치**: 공방 주소
   - 📝 **설명**: 
     - 예약 번호
     - 참가 인원
     - 예약자 정보 (이름, 연락처)
     - 클래스 설명

### 💻 기술적 구현

#### 1. JavaScript 함수 (`classes.js`)

```javascript
function createGoogleCalendarLink(booking) {
    const startDate = new Date(booking.booking_date);
    const duration = booking.duration || 90; // 기본 90분
    const endDate = new Date(startDate.getTime() + duration * 60000);
    
    // 구글 캘린더 URL 형식: YYYYMMDDTHHMMSSZ
    const formatGoogleDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const title = encodeURIComponent(booking.class_title || '아로마펄스 원데이 클래스');
    const location = encodeURIComponent(booking.address || booking.location || '');
    const description = encodeURIComponent(
        `예약 번호: ${booking.id}\n` +
        `참가 인원: ${booking.participants}명\n` +
        `예약자: ${booking.booker_name}\n` +
        `연락처: ${booking.booker_phone}\n\n` +
        `${booking.class_description || ''}`
    );
    
    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${description}&location=${location}`;
}
```

#### 2. HTML 버튼 (`classes.html`)

```html
<!-- Google Calendar Button -->
<a id="google-calendar-link" href="#" target="_blank" rel="noopener noreferrer"
   class="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold mb-3 hover:shadow-lg transition">
    <i class="fab fa-google mr-2"></i>
    Google Calendar에 추가
</a>
```

#### 3. 예약 성공 시 링크 설정

```javascript
function showBookingSuccess(booking) {
    // ... 기존 코드 ...
    
    // 구글 캘린더 추가 링크 생성
    const googleCalendarLink = createGoogleCalendarLink(booking);
    const calendarButton = document.getElementById('google-calendar-link');
    calendarButton.href = googleCalendarLink;
    
    // 성공 모달 표시
    document.getElementById('success-modal').classList.remove('hidden');
}
```

### 🌐 구글 캘린더 URL API

구글 캘린더는 URL 파라미터를 통해 이벤트 생성을 지원합니다:

```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text={이벤트_제목}
  &dates={시작시간}/{종료시간}
  &details={설명}
  &location={위치}
```

**날짜 형식**: `YYYYMMDDTHHMMSSZ` (UTC 시간)
- 예: `20241124T050000Z` = 2024년 11월 24일 05:00:00 UTC

### 🚀 사용자 경험

1. **예약 완료** → 성공 모달 표시
2. **"Google Calendar에 추가" 버튼 클릭** → 새 탭에서 구글 캘린더 열림
3. **이벤트 미리보기** → 모든 정보가 자동으로 채워짐
4. **"저장" 클릭** → 구글 캘린더에 이벤트 추가 완료

### ✅ 장점

1. **간편함**: 한 번의 클릭으로 캘린더에 추가
2. **파일 다운로드 불필요**: iCalendar 파일을 다운로드하고 업로드할 필요 없음
3. **크로스 플랫폼**: 모든 기기에서 작동 (웹 기반)
4. **자동 동기화**: 구글 계정에 연결된 모든 기기에서 자동 동기화

### 🔗 배포 정보

- **최신 배포 URL**: https://89eb337b.aromapulse.pages.dev
- **메인 도메인**: https://www.aromapulse.kr
- **배포 일시**: 2024-11-24

### 📝 테스트 방법

1. 웹사이트 접속: https://www.aromapulse.kr/static/classes.html
2. 로그인 (필수)
3. 클래스 선택 및 예약
4. 예약 완료 후 "Google Calendar에 추가" 버튼 클릭
5. 구글 캘린더에서 이벤트 확인 및 저장

### 🎯 향후 개선 가능 사항

- [ ] Apple Calendar 지원 (iOS/macOS)
- [ ] Outlook Calendar 지원
- [ ] 캘린더 미리 알림 설정 옵션
- [ ] 예약 변경 시 자동 캘린더 업데이트

## 📚 참고 문서

- [Google Calendar URL Schemes](https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md)
- [iCalendar (RFC 5545)](https://datatracker.ietf.org/doc/html/rfc5545)
