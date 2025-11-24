// One-day Classes page JavaScript

let allClasses = [];
let filteredClasses = [];
let currentPriceFilter = 'all';

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', async () => {
    // 클래스 목록은 모두에게 공개
    updateAuthUI();
    
    // 클래스 로드 (모든 사용자)
    await loadClasses();
    
    // 페이지 뷰 트래킹
    trackPageView('classes_list');
});

// UI 업데이트 (인증 링크)
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (!token) {
        // 로그인하지 않은 경우
        if (authButtons) authButtons.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    } else {
        // 로그인된 경우
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // 토큰 만료 체크
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (authButtons) authButtons.classList.remove('hidden');
                if (userMenu) userMenu.classList.add('hidden');
                return;
            }
            
            // 로그인 상태 UI 표시
            if (authButtons) authButtons.classList.add('hidden');
            if (userMenu) {
                userMenu.classList.remove('hidden');
                userMenu.classList.add('flex');
            }
            
            // 사용자 정보 표시
            const userName = payload.name || '사용자';
            const userInitial = userName.charAt(0).toUpperCase();
            
            const userNameEl = document.getElementById('user-name');
            const userInitialEl = document.getElementById('user-initial');
            
            if (userNameEl) userNameEl.textContent = userName;
            if (userInitialEl) userInitialEl.textContent = userInitial;
            
        } catch (e) {
            console.error('Token parse error:', e);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (authButtons) authButtons.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
        }
    }
}

// 로그아웃 함수
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('로그아웃되었습니다.');
    location.reload();
}

// 프로필 드롭다운 토글
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// 프로필 버튼 클릭 이벤트 설정
document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProfileDropdown();
        });
    }
    
    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        const profileBtn = document.getElementById('profile-btn');
        const dropdown = document.getElementById('profile-dropdown');
        if (profileBtn && dropdown && !profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
});

// 클래스 상세 페이지로 이동 (권한 체크 없이)
function viewClass(id) {
    window.location.href = `/class/${id}`;
}

// 클래스 목록 로드
async function loadClasses() {
    try {
        // 원데이 클래스 API 호출
        const response = await fetch('/api/oneday-classes?limit=100');
        
        if (response.ok) {
            allClasses = await response.json();
            filteredClasses = [...allClasses];
            renderClasses();
        } else {
            showEmpty();
        }
        
    } catch (error) {
        console.error('클래스 로드 오류:', error);
        showEmpty();
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 클래스 렌더링
function renderClasses() {
    const container = document.getElementById('classes-container');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredClasses.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = filteredClasses.map((cls, index) => `
        <div class="class-card group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-all duration-300" 
             onclick="viewClass(${cls.id})"
             style="animation: fadeInUp 0.6s ease-out ${index * 0.1}s backwards;">
            <!-- Image with Overlay -->
            <div class="relative h-64 overflow-hidden">
                ${cls.image_url 
                    ? `<img src="${cls.image_url}" alt="${cls.title}" 
                           class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                    : `<div class="w-full h-full bg-gradient-to-br from-green-400 via-teal-400 to-cyan-400 flex items-center justify-center">
                           <i class="fas fa-spa text-white text-6xl opacity-80"></i>
                       </div>`
                }
                <!-- Gradient Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                <!-- Category Badge - Floating -->
                ${cls.category 
                    ? `<div class="absolute top-4 left-4">
                           <span class="inline-flex items-center px-4 py-2 text-xs font-bold bg-white/95 backdrop-blur-sm text-green-700 rounded-full shadow-lg">
                               <i class="fas fa-tag mr-2"></i>${cls.category}
                           </span>
                       </div>`
                    : ''
                }
                
                <!-- Popular Badge (optional) -->
                ${index < 3 
                    ? `<div class="absolute top-4 right-4">
                           <span class="inline-flex items-center px-3 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-lg">
                               <i class="fas fa-fire mr-1"></i>인기
                           </span>
                       </div>`
                    : ''
                }
                
                <!-- Title Overlay at Bottom -->
                <div class="absolute bottom-0 left-0 right-0 p-6">
                    <h3 class="text-2xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg">
                        ${cls.title}
                    </h3>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6">
                <!-- Description -->
                <p class="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                    ${cls.description || '나만의 향기 제품을 만들어보는 특별한 원데이 클래스입니다.'}
                </p>
                
                <!-- Details with Icons -->
                <div class="space-y-3 mb-6">
                    <div class="flex items-center text-sm text-gray-700">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center mr-3">
                            <i class="fas fa-map-marker-alt text-green-600"></i>
                        </div>
                        <span class="font-medium">${cls.location}</span>
                    </div>
                    
                    <div class="flex items-center text-sm text-gray-700">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mr-3">
                            <i class="fas fa-clock text-cyan-600"></i>
                        </div>
                        <span class="font-medium">${cls.duration ? `${cls.duration}분` : '시간 협의 가능'}</span>
                    </div>
                    
                    ${cls.max_participants 
                        ? `<div class="flex items-center text-sm text-gray-700">
                               <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mr-3">
                                   <i class="fas fa-users text-amber-600"></i>
                               </div>
                               <span class="font-medium">1명 ~ 최대 ${cls.max_participants}명</span>
                           </div>`
                        : `<div class="flex items-center text-sm text-gray-700">
                               <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mr-3">
                                   <i class="fas fa-users text-amber-600"></i>
                               </div>
                               <span class="font-medium">1명부터 참여 가능</span>
                           </div>`
                    }
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 mb-6"></div>
                
                <!-- Footer with Price and CTA -->
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs text-gray-500 mb-1">1인 기준</div>
                        <div class="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            ${formatPrice(cls.price)}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="event.stopPropagation(); viewClass(${cls.id})" 
                                class="flex-1 px-4 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-all duration-300">
                            <span class="flex items-center justify-center">
                                상세보기
                                <i class="fas fa-info-circle ml-2"></i>
                            </span>
                        </button>
                        <button onclick="event.stopPropagation(); openBookingModal(${cls.id}, event)" 
                                class="group/btn relative flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                            <span class="relative z-10 flex items-center justify-center">
                                예약하기
                                <i class="fas fa-calendar-check ml-2 group-hover/btn:scale-110 transition-transform"></i>
                            </span>
                            <!-- Shine Effect -->
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                        </button>
                    </div>
                </div>
                
                <!-- Features Tags -->
                <div class="mt-4 flex flex-wrap gap-2">
                    <span class="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                        <i class="fas fa-user-check mr-1"></i>1명부터 가능
                    </span>
                    <span class="text-xs px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                        <i class="fas fa-certificate mr-1"></i>개인 맞춤
                    </span>
                    <span class="text-xs px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full font-medium">
                        <i class="fas fa-home mr-1"></i>당일 완성
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// 검색
function searchClasses() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    
    // 검색 트래킹
    if (searchTerm) {
        trackSearch(searchTerm, category);
    }
    
    filteredClasses = allClasses.filter(cls => {
        const matchesSearch = !searchTerm || 
            cls.title.toLowerCase().includes(searchTerm) ||
            (cls.description && cls.description.toLowerCase().includes(searchTerm)) ||
            (cls.location && cls.location.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !category || cls.category === category;
        
        const matchesPrice = filterByPriceRange(cls, currentPriceFilter);
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    renderClasses();
}

// 가격 필터
function filterByPrice(range) {
    currentPriceFilter = range;
    
    // 필터 칩 활성화 상태 업데이트
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 필터 트래킹
    trackFilter('price', range);
    
    searchClasses();
}

function filterByPriceRange(cls, range) {
    if (range === 'all') return true;
    if (!cls.price) return false;
    
    const price = cls.price;
    
    switch(range) {
        case '0-50000':
            return price <= 50000;
        case '50000-100000':
            return price > 50000 && price <= 100000;
        case '100000+':
            return price > 100000;
        default:
            return true;
    }
}

// 가격 포맷팅
function formatPrice(price) {
    if (!price) return '가격 문의';
    return `${price.toLocaleString()}원`;
}

// Empty state 표시
function showEmpty() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('classes-container').style.display = 'none';
    document.getElementById('empty-state').style.display = 'block';
}

// 검색 입력 시 자동 검색
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            setTimeout(searchClasses, 300);
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', searchClasses);
    }
});

// ============================================
// 예약 기능
// ============================================

let currentBookingClass = null;

// 예약 모달 열기
function openBookingModal(classId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    // 로그인 확인
    const token = getCookie('auth_token');
    if (!token) {
        alert('로그인이 필요한 서비스입니다.\n\n메인 페이지에서 로그인 후 이용해주세요.');
        window.location.href = '/';
        return;
    }
    
    // 클래스 정보 찾기
    const classInfo = allClasses.find(c => c.id === classId);
    if (!classInfo) {
        alert('클래스 정보를 찾을 수 없습니다.');
        return;
    }
    
    currentBookingClass = classInfo;
    
    // 모달 정보 설정
    document.getElementById('booking-class-id').value = classId;
    document.getElementById('booking-class-title').textContent = classInfo.title;
    
    // 날짜 기본값 설정 (내일)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    document.getElementById('booking-date').value = dateStr;
    document.getElementById('booking-date').min = dateStr;
    
    // 시간 기본값 설정 (10:00)
    document.getElementById('booking-time').value = '10:00';
    
    // 폼 초기화
    document.getElementById('booking-form').reset();
    document.getElementById('booking-class-id').value = classId;
    document.getElementById('booking-date').value = dateStr;
    document.getElementById('booking-time').value = '10:00';
    
    // 모달 표시
    document.getElementById('booking-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 예약 모달 닫기
function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentBookingClass = null;
}

// 예약 제출
async function submitBooking(event) {
    event.preventDefault();
    
    const classId = document.getElementById('booking-class-id').value;
    const bookingDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;
    const participants = document.getElementById('participants').value;
    const bookerName = document.getElementById('booker-name').value;
    const bookerPhone = document.getElementById('booker-phone').value;
    const bookerEmail = document.getElementById('booker-email').value;
    const notes = document.getElementById('booking-notes').value;
    
    // 날짜/시간 결합
    const bookingDatetime = `${bookingDate}T${bookingTime}:00`;
    
    try {
        const response = await fetch(`/api/bookings/oneday-classes/${classId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                booking_date: bookingDatetime,
                participants: parseInt(participants),
                booker_name: bookerName,
                booker_phone: bookerPhone,
                booker_email: bookerEmail,
                notes: notes || null
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showBookingSuccess(data.booking);
        } else {
            const error = await response.json();
            alert(`예약 실패: ${error.error || '알 수 없는 오류'}`);
        }
    } catch (error) {
        console.error('예약 오류:', error);
        alert('예약 처리 중 오류가 발생했습니다.');
    }
}

// 예약 성공 표시
function showBookingSuccess(booking) {
    closeBookingModal();
    
    // 성공 모달 정보 설정
    document.getElementById('success-booking-id').textContent = `#${booking.id}`;
    document.getElementById('success-class-title').textContent = booking.class_title;
    
    // 날짜 포맷팅
    const bookingDate = new Date(booking.booking_date);
    const dateStr = bookingDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('success-date').textContent = dateStr;
    document.getElementById('success-participants').textContent = `${booking.participants}명`;
    
    // iCalendar 다운로드 링크 설정
    const icalendarLink = document.getElementById('icalendar-link');
    icalendarLink.href = `/api/bookings/${booking.id}/icalendar`;
    icalendarLink.download = `aromapulse-booking-${booking.id}.ics`;
    
    // 성공 모달 표시
    document.getElementById('success-modal').classList.remove('hidden');
}

// 성공 모달 닫기
function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // 페이지 새로고침 (선택사항)
    // location.reload();
}

// 쿠키 가져오기 헬퍼 함수
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
