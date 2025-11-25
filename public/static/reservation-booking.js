// 예약 모달 및 캘린더 파일 다운로드 (ICS)
// 원데이 클래스 및 상품 예약 기능

class ReservationBooking {
  constructor() {
    this.currentUser = null;
    this.reservationType = null; // 'class' or 'product'
    this.itemId = null;
    this.itemTitle = null;
    this.itemPrice = null;
    this.initModal();
    this.loadCurrentUser();
  }

  async loadCurrentUser() {
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('🔍 [Reservation] User check response:', response.status);
      
      if (response.ok) {
        this.currentUser = await response.json();
        console.log('✅ [Reservation] Current user loaded:', this.currentUser);
      } else if (response.status === 401) {
        console.warn('⚠️ [Reservation] User not logged in (401)');
        this.currentUser = null;
      } else {
        console.error('❌ [Reservation] Failed to load user:', response.status);
        this.currentUser = null;
      }
    } catch (error) {
      console.error('❌ [Reservation] Failed to load user:', error);
      this.currentUser = null;
    }
  }

  initModal() {
    // 모달 HTML 생성
    const modalHTML = `
      <div id="reservationModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-white flex items-center">
                <i class="fas fa-calendar-check mr-3"></i>
                <span id="modalTitle">예약하기</span>
              </h2>
              <button onclick="window.reservationBooking.closeModal()" class="text-white hover:text-gray-200 transition">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <form id="reservationForm" class="p-6 space-y-4">
            <!-- 예약 상품/클래스 정보 -->
            <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p class="text-sm text-gray-600 mb-1">예약 항목</p>
              <p id="reservationItemTitle" class="text-lg font-bold text-gray-800"></p>
              <p id="reservationItemPrice" class="text-purple-600 font-semibold mt-1"></p>
            </div>

            <!-- 예약 날짜 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-calendar mr-2 text-purple-600"></i>예약 날짜 *
              </label>
              <input type="date" id="reservationDate" name="reservation_date" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>

            <!-- 예약 시간 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-clock mr-2 text-purple-600"></i>예약 시간 *
              </label>
              <select id="reservationTime" name="reservation_time" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">시간을 선택하세요</option>
                <option value="10:00">오전 10:00</option>
                <option value="11:00">오전 11:00</option>
                <option value="12:00">오후 12:00</option>
                <option value="13:00">오후 1:00</option>
                <option value="14:00">오후 2:00</option>
                <option value="15:00">오후 3:00</option>
                <option value="16:00">오후 4:00</option>
                <option value="17:00">오후 5:00</option>
                <option value="18:00">오후 6:00</option>
                <option value="19:00">오후 7:00</option>
              </select>
            </div>

            <!-- 인원 수 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-users mr-2 text-purple-600"></i>예약 인원 *
              </label>
              <input type="number" id="participants" name="participants" value="1" min="1" max="10" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            </div>

            <!-- 연락처 정보 -->
            <div class="border-t pt-4">
              <h3 class="text-lg font-bold text-gray-800 mb-3">연락처 정보</h3>
              
              <div class="mb-3">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-user mr-2 text-purple-600"></i>예약자 이름 *
                </label>
                <input type="text" id="contactName" name="contact_name" required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              </div>

              <div class="mb-3">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-phone mr-2 text-purple-600"></i>연락처 *
                </label>
                <input type="tel" id="contactPhone" name="contact_phone" placeholder="010-1234-5678" required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-envelope mr-2 text-purple-600"></i>이메일
                </label>
                <input type="email" id="contactEmail" name="contact_email" 
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              </div>
            </div>

            <!-- 특별 요청사항 -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-comment mr-2 text-purple-600"></i>특별 요청사항
              </label>
              <textarea id="specialRequest" name="special_request" rows="3" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="추가로 전달하실 내용이 있으시면 작성해주세요"></textarea>
            </div>

            <!-- 캘린더 파일 다운로드 옵션 -->
            <div class="bg-green-50 rounded-lg p-4 border border-green-200">
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" id="addToNaverCalendar" class="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500">
                <span class="ml-3 text-sm font-medium text-gray-700">
                  <i class="fas fa-calendar-plus mr-2 text-green-600"></i>
                  캘린더 파일 다운로드 (.ics)
                </span>
              </label>
              <p class="text-xs text-gray-500 mt-2 ml-8">예약 완료 후 캘린더 파일을 다운로드합니다 (네이버/구글/아웃룩 캘린더에서 사용 가능)</p>
            </div>

            <!-- 제출 버튼 -->
            <div class="flex space-x-3 pt-4">
              <button type="button" onclick="window.reservationBooking.closeModal()"
                class="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                취소
              </button>
              <button type="submit" id="submitReservationBtn"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg">
                <i class="fas fa-check mr-2"></i>예약 확정
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 폼 제출 이벤트 리스너
    document.getElementById('reservationForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitReservation();
    });

    // 오늘 날짜 이전은 선택 불가
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservationDate').setAttribute('min', today);
  }

  // 예약 모달 열기
  async openModal(type, itemId, itemTitle, itemPrice) {
    // 최신 로그인 상태 다시 확인
    await this.loadCurrentUser();
    
    // 로그인 체크
    if (!this.currentUser) {
      console.warn('⚠️ [Reservation] User not logged in, redirecting to login page');
      
      // 현재 페이지 URL을 returnTo로 저장
      const currentUrl = window.location.pathname + window.location.search;
      
      if (confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
        // 네이버 로그인 페이지로 직접 이동
        window.location.href = `/auth/naver?returnTo=${encodeURIComponent(currentUrl)}`;
      }
      return;
    }
    
    console.log('✅ [Reservation] User is logged in, opening modal');
    

    this.reservationType = type; // 'class' or 'product'
    this.itemId = itemId;
    this.itemTitle = itemTitle;
    this.itemPrice = itemPrice;

    // 모달 내용 업데이트
    document.getElementById('modalTitle').textContent = 
      type === 'class' ? '원데이 클래스 예약' : '상품 예약';
    document.getElementById('reservationItemTitle').textContent = itemTitle;
    document.getElementById('reservationItemPrice').textContent = 
      itemPrice ? `${itemPrice.toLocaleString()}원` : '가격 문의';

    // 사용자 정보 자동 입력
    if (this.currentUser.name) {
      document.getElementById('contactName').value = this.currentUser.name;
    }
    if (this.currentUser.email) {
      document.getElementById('contactEmail').value = this.currentUser.email;
    }
    if (this.currentUser.phone) {
      document.getElementById('contactPhone').value = this.currentUser.phone;
    }

    // 모달 표시
    const modal = document.getElementById('reservationModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }

  // 예약 모달 닫기
  closeModal() {
    const modal = document.getElementById('reservationModal');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    
    // 폼 초기화
    document.getElementById('reservationForm').reset();
  }

  // 예약 제출
  async submitReservation() {
    try {
      const submitBtn = document.getElementById('submitReservationBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>처리 중...';

      const formData = {
        reservation_type: this.reservationType,
        [this.reservationType === 'class' ? 'class_id' : 'product_id']: this.itemId,
        reservation_date: document.getElementById('reservationDate').value,
        reservation_time: document.getElementById('reservationTime').value,
        participants: parseInt(document.getElementById('participants').value),
        contact_name: document.getElementById('contactName').value,
        contact_phone: document.getElementById('contactPhone').value,
        contact_email: document.getElementById('contactEmail').value || null,
        special_request: document.getElementById('specialRequest').value || null
      };

      console.log('📤 [Reservation] Submitting:', formData);

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [Reservation] Server error:', result);
        const errorMsg = result.error || '예약 생성 실패';
        const errorDetails = result.details ? `\n\n상세: ${result.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }

      console.log('✅ [Reservation] Success:', result);

      // 캘린더 파일 다운로드 체크
      if (document.getElementById('addToNaverCalendar').checked) {
        this.addToNaverCalendar(result.calendar_data);
      }

      // 성공 메시지
      alert(`🎉 예약이 완료되었습니다!\n\n예약번호: ${result.reservation_id}\n일시: ${formData.reservation_date} ${formData.reservation_time}\n인원: ${formData.participants}명`);

      // 모달 닫기
      this.closeModal();

      // 마이페이지로 이동 (선택사항)
      if (confirm('예약 내역을 확인하시겠습니까?')) {
        window.location.href = '/static/mypage.html';
      }

    } catch (error) {
      console.error('❌ [Reservation] Error:', error);
      alert(`예약 실패: ${error.message}`);
    } finally {
      const submitBtn = document.getElementById('submitReservationBtn');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>예약 확정';
    }
  }

  // 캘린더 파일 다운로드 (ICS 형식)
  addToNaverCalendar(calendarData) {
    try {
      // ICS 파일 생성 (표준 iCalendar 형식)
      const startDate = calendarData.date.replace(/-/g, '');
      const startTime = calendarData.time.replace(':', '') + '00';
      
      // 종료 시간 (시작 시간 + 2시간)
      const startHour = parseInt(calendarData.time.split(':')[0]);
      const endHour = (startHour + 2).toString().padStart(2, '0');
      const endTime = endHour + calendarData.time.split(':')[1] + '00';
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AromaPulse//Reservation//KO',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@aromapulse.kr`,
        `DTSTAMP:${startDate}T${startTime}Z`,
        `DTSTART:${startDate}T${startTime}Z`,
        `DTEND:${startDate}T${endTime}Z`,
        `SUMMARY:${calendarData.title}`,
        `DESCRIPTION:아로마펄스 예약`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      // Blob 생성 및 다운로드
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aromapulse-reservation-${startDate}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('📅 [Calendar] ICS file downloaded');
      alert('📅 캘린더 파일이 다운로드되었습니다.\n네이버 캘린더, 구글 캘린더, 아웃룩 등에서 열어보세요!');
      
    } catch (error) {
      console.error('❌ [Calendar] Error:', error);
      alert('캘린더 파일 생성 중 오류가 발생했습니다');
    }
  }
}

// 전역 인스턴스 생성
window.reservationBooking = new ReservationBooking();
