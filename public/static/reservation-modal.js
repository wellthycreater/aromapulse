// 예약 모달 공통 컴포넌트
// shop.html, healing.html 등에서 사용

let currentReservationType = null;
let currentItemId = null;
let currentItemData = null;

// 예약 모달 HTML 생성
function createReservationModal() {
  const modalHTML = `
    <div id="reservation-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- 모달 헤더 -->
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-bold flex items-center">
              <i class="fas fa-calendar-check mr-3"></i>
              예약하기
            </h3>
            <button onclick="closeReservationModal()" class="text-white hover:text-gray-200 transition">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          <p id="reservation-item-title" class="mt-2 text-purple-100"></p>
        </div>

        <!-- 모달 내용 -->
        <form id="reservation-form" class="p-6 space-y-6">
          <!-- 예약 날짜 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-calendar text-purple-600 mr-2"></i>
              예약 날짜 *
            </label>
            <input type="date" 
                   id="reservation-date" 
                   name="reservation_date"
                   required
                   min="${new Date().toISOString().split('T')[0]}"
                   class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition">
          </div>

          <!-- 예약 시간 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-clock text-purple-600 mr-2"></i>
              예약 시간 *
            </label>
            <select id="reservation-time" 
                    name="reservation_time"
                    required
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition">
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

          <!-- 참석 인원 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-users text-purple-600 mr-2"></i>
              참석 인원 *
            </label>
            <div class="flex items-center space-x-4">
              <button type="button" onclick="changeParticipants(-1)" 
                      class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold w-12 h-12 rounded-lg transition">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" 
                     id="reservation-participants" 
                     name="participants"
                     value="1" 
                     min="1" 
                     max="10"
                     required
                     class="w-24 text-center px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition text-xl font-bold">
              <button type="button" onclick="changeParticipants(1)" 
                      class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold w-12 h-12 rounded-lg transition">
                <i class="fas fa-plus"></i>
              </button>
              <span class="text-gray-600">명</span>
            </div>
          </div>

          <!-- 예약자 정보 -->
          <div class="border-t pt-6">
            <h4 class="text-lg font-bold text-gray-800 mb-4">예약자 정보</h4>
            
            <!-- 이름 -->
            <div class="mb-4">
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-user text-purple-600 mr-2"></i>
                이름 *
              </label>
              <input type="text" 
                     id="contact-name" 
                     name="contact_name"
                     required
                     placeholder="홍길동"
                     class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition">
            </div>

            <!-- 연락처 -->
            <div class="mb-4">
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-phone text-purple-600 mr-2"></i>
                연락처 *
              </label>
              <input type="tel" 
                     id="contact-phone" 
                     name="contact_phone"
                     required
                     placeholder="010-1234-5678"
                     pattern="[0-9]{3}-[0-9]{4}-[0-9]{4}"
                     class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition">
              <p class="text-xs text-gray-500 mt-1">형식: 010-1234-5678</p>
            </div>

            <!-- 이메일 (선택) -->
            <div class="mb-4">
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-envelope text-purple-600 mr-2"></i>
                이메일 (선택사항)
              </label>
              <input type="email" 
                     id="contact-email" 
                     name="contact_email"
                     placeholder="example@email.com"
                     class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition">
            </div>

            <!-- 특별 요청사항 (선택) -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-comment text-purple-600 mr-2"></i>
                특별 요청사항 (선택사항)
              </label>
              <textarea id="special-request" 
                        name="special_request"
                        rows="3"
                        placeholder="특별한 요청사항이 있으시면 적어주세요"
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring focus:ring-purple-200 transition resize-none"></textarea>
            </div>
          </div>

          <!-- 안내 메시지 -->
          <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
            <div class="flex">
              <i class="fas fa-info-circle text-purple-500 mt-1 mr-3"></i>
              <div class="text-sm text-gray-700">
                <p class="font-bold mb-1">예약 안내</p>
                <ul class="list-disc list-inside space-y-1 text-xs">
                  <li>예약 확인은 입력하신 연락처로 연락드립니다.</li>
                  <li>예약 날짜 변경은 최소 2일 전까지 가능합니다.</li>
                  <li>당일 취소 시 취소 수수료가 발생할 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 버튼 -->
          <div class="flex space-x-3">
            <button type="button" 
                    onclick="closeReservationModal()" 
                    class="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition">
              취소
            </button>
            <button type="submit" 
                    id="submit-reservation-btn"
                    class="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition">
              <i class="fas fa-check mr-2"></i>
              예약 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // 모달을 body에 추가
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  document.body.appendChild(tempDiv.firstElementChild);

  // 폼 제출 이벤트 리스너
  document.getElementById('reservation-form').addEventListener('submit', handleReservationSubmit);
}

// 예약 모달 열기
function openReservationModal(type, itemId, itemData) {
  currentReservationType = type; // 'class' or 'product'
  currentItemId = itemId;
  currentItemData = itemData;

  // 모달이 없으면 생성
  if (!document.getElementById('reservation-modal')) {
    createReservationModal();
  }

  // 아이템 제목 설정
  const titleElement = document.getElementById('reservation-item-title');
  if (type === 'class') {
    titleElement.textContent = itemData.title || itemData.name;
  } else if (type === 'product') {
    titleElement.textContent = itemData.name;
  }

  // 모달 표시
  document.getElementById('reservation-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// 예약 모달 닫기
function closeReservationModal() {
  document.getElementById('reservation-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  
  // 폼 초기화
  document.getElementById('reservation-form').reset();
  document.getElementById('reservation-participants').value = '1';
}

// 참석 인원 변경
function changeParticipants(delta) {
  const input = document.getElementById('reservation-participants');
  let value = parseInt(input.value) + delta;
  
  if (value < 1) value = 1;
  if (value > 10) value = 10;
  
  input.value = value;
}

// 예약 제출 처리
async function handleReservationSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-reservation-btn');
  const originalText = submitBtn.innerHTML;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>처리 중...';

    // 폼 데이터 수집
    const formData = {
      reservation_type: currentReservationType,
      reservation_date: document.getElementById('reservation-date').value,
      reservation_time: document.getElementById('reservation-time').value,
      participants: parseInt(document.getElementById('reservation-participants').value),
      contact_name: document.getElementById('contact-name').value,
      contact_phone: document.getElementById('contact-phone').value,
      contact_email: document.getElementById('contact-email').value || null,
      special_request: document.getElementById('special-request').value || null
    };

    // 타입에 따라 ID 추가
    if (currentReservationType === 'class') {
      formData.class_id = currentItemId;
    } else if (currentReservationType === 'product') {
      formData.product_id = currentItemId;
    }

    console.log('[Reservation] Submitting:', formData);

    // API 호출
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // 성공 메시지
      alert(`✅ 예약이 완료되었습니다!\n\n예약번호: ${result.reservationId}\n\n예약 확인은 입력하신 연락처로 연락드리겠습니다.`);
      
      // 캘린더 다운로드 안내
      if (confirm('📅 네이버 캘린더에 추가하시겠습니까?\n\niCalendar 파일을 다운로드합니다.')) {
        downloadCalendar(result.reservationId);
      }
      
      closeReservationModal();
      
      // 내 예약 페이지로 이동 안내
      if (confirm('내 예약 목록을 확인하시겠습니까?')) {
        window.location.href = '/static/my-reservations';
      }
    } else {
      throw new Error(result.error || '예약 처리 중 오류가 발생했습니다.');
    }

  } catch (error) {
    console.error('[Reservation] Error:', error);
    alert(`❌ 예약 실패\n\n${error.message}\n\n로그인이 필요하거나 네트워크 오류일 수 있습니다.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// 네이버 캘린더 파일 다운로드
async function downloadCalendar(reservationId) {
  try {
    const response = await fetch(`/api/reservations/${reservationId}/calendar`, {
      credentials: 'include'
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservation-${reservationId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('📅 iCalendar 파일이 다운로드되었습니다.\n\n파일을 열면 네이버 캘린더 또는 기본 캘린더 앱에 자동으로 추가됩니다.');
    } else {
      throw new Error('캘린더 파일 생성 실패');
    }
  } catch (error) {
    console.error('[Calendar Download] Error:', error);
    alert('캘린더 파일 다운로드 중 오류가 발생했습니다.');
  }
}

// 전역으로 노출
window.openReservationModal = openReservationModal;
window.closeReservationModal = closeReservationModal;
window.changeParticipants = changeParticipants;
window.downloadCalendar = downloadCalendar;
