// Studio Detail JavaScript

let currentStudio = null;
let currentSchedules = [];
let selectedScheduleId = null;
let currentBookingId = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const studioId = urlParams.get('id');

  if (!studioId) {
    alert('공방 ID가 없습니다.');
    location.href = '/local-studios';
    return;
  }

  loadStudio(studioId);
  loadSchedules(studioId);
});

// 공방 정보 로드
async function loadStudio(studioId) {
  try {
    const response = await fetch(`/api/workshops/${studioId}`);
    
    if (!response.ok) {
      throw new Error('공방 정보를 찾을 수 없습니다');
    }

    currentStudio = await response.json();
    renderStudio();
    
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
    
  } catch (error) {
    console.error('Load studio error:', error);
    alert('공방 정보를 불러오는데 실패했습니다.');
    location.href = '/local-studios';
  }
}

// 공방 정보 렌더링
function renderStudio() {
  const studio = currentStudio;

  document.getElementById('category-badge').textContent = studio.category || '아로마 테라피';
  document.getElementById('studio-title').textContent = studio.title;
  document.getElementById('studio-description').textContent = studio.description;
  document.getElementById('studio-location').textContent = studio.location;
  document.getElementById('studio-phone').textContent = studio.contact_phone;
  
  document.getElementById('studio-full-description').textContent = studio.description;
  document.getElementById('studio-address').textContent = studio.address;
  document.getElementById('studio-detailed-address').textContent = studio.detailed_address || '';
  document.getElementById('studio-postal').textContent = studio.postal_code || '';

  // 페이지 타이틀 변경
  document.title = `${studio.title} - 아로마펄스`;
}

// 예약 가능 스케줄 로드
async function loadSchedules(workshopId) {
  try {
    const response = await fetch(`/api/workshop-bookings/schedules/${workshopId}`);
    
    if (!response.ok) {
      throw new Error('스케줄을 찾을 수 없습니다');
    }

    const data = await response.json();
    currentSchedules = data.schedules || [];
    
    renderSchedules();
    
  } catch (error) {
    console.error('Load schedules error:', error);
    document.getElementById('no-schedules').classList.remove('hidden');
  }
}

// 스케줄 렌더링
function renderSchedules() {
  const container = document.getElementById('schedules-list');
  container.innerHTML = '';

  if (currentSchedules.length === 0) {
    document.getElementById('no-schedules').classList.remove('hidden');
    return;
  }

  document.getElementById('no-schedules').classList.add('hidden');

  currentSchedules.forEach(schedule => {
    const slot = createScheduleSlot(schedule);
    container.appendChild(slot);
  });
}

// 스케줄 슬롯 생성
function createScheduleSlot(schedule) {
  const slot = document.createElement('div');
  slot.className = 'schedule-slot border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-purple-300';
  slot.onclick = () => selectSchedule(schedule.id, slot);

  const date = new Date(schedule.available_date);
  const dateStr = date.toLocaleDateString('ko-KR', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'short'
  });

  const available = schedule.max_slots - schedule.booked_slots;
  const availableText = available > 0 
    ? `<span class="text-green-600 font-semibold">${available}자리 남음</span>`
    : `<span class="text-red-600 font-semibold">마감</span>`;

  slot.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold text-gray-800">${dateStr}</div>
        <div class="text-sm text-gray-600">
          <i class="fas fa-clock mr-1"></i>
          ${schedule.start_time} - ${schedule.end_time}
        </div>
      </div>
      <div class="text-right text-sm">
        ${availableText}
      </div>
    </div>
  `;

  if (available <= 0) {
    slot.classList.add('opacity-50', 'cursor-not-allowed');
    slot.onclick = null;
  }

  return slot;
}

// 스케줄 선택
function selectSchedule(scheduleId, element) {
  selectedScheduleId = scheduleId;

  // 모든 슬롯에서 선택 표시 제거
  document.querySelectorAll('.schedule-slot').forEach(slot => {
    slot.classList.remove('selected', 'border-purple-600', 'bg-gray-50');
  });

  // 선택한 슬롯 강조
  element.classList.add('selected', 'border-purple-600', 'bg-gray-50');
}

// 예약 제출
async function submitBooking(event) {
  event.preventDefault();

  if (!selectedScheduleId) {
    alert('날짜와 시간을 선택해주세요');
    return;
  }

  const bookingType = document.getElementById('booking-type').value;
  const customerName = document.getElementById('customer-name').value;
  const customerEmail = document.getElementById('customer-email').value;
  const customerPhone = document.getElementById('customer-phone').value;
  const specialRequests = document.getElementById('special-requests').value;

  // 선택한 스케줄 찾기
  const schedule = currentSchedules.find(s => s.id === selectedScheduleId);
  if (!schedule) {
    alert('선택한 스케줄을 찾을 수 없습니다');
    return;
  }

  const bookingData = {
    workshop_id: currentStudio.id,
    schedule_id: selectedScheduleId,
    booking_type: bookingType,
    booking_date: schedule.available_date,
    booking_time: schedule.start_time,
    num_participants: 1,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    special_requests: specialRequests,
    price_per_person: 0,
    total_price: 0
  };

  try {
    const response = await fetch('/api/workshop-bookings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error('예약 실패');
    }

    const result = await response.json();
    currentBookingId = result.booking_id;

    // 성공 모달 표시
    showSuccessModal();

  } catch (error) {
    console.error('Booking error:', error);
    alert('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

// 성공 모달 표시
function showSuccessModal() {
  const modal = document.getElementById('success-modal');
  modal.style.display = 'flex';
}

// iCalendar 다운로드
async function downloadICalendar() {
  if (!currentBookingId) {
    alert('예약 ID를 찾을 수 없습니다');
    return;
  }

  try {
    const response = await fetch(`/api/workshop-bookings/${currentBookingId}/icalendar`);
    
    if (!response.ok) {
      throw new Error('iCalendar 다운로드 실패');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aromapulse_booking_${currentBookingId}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert('iCalendar 파일이 다운로드되었습니다!');

  } catch (error) {
    console.error('Download iCalendar error:', error);
    alert('iCalendar 다운로드에 실패했습니다.');
  }
}
