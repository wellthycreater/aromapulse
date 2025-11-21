// 로그인 체크
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다');
        location.href = '/login';
        return null;
    }
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // 토큰 만료 체크
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            alert('로그인이 만료되었습니다');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            location.href = '/login';
            return null;
        }
        
        return payload;
    } catch (e) {
        console.error('Token parse error:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.href = '/login';
        return null;
    }
}

// 사용자 정보 로드
async function loadUserInfo() {
    const tokenUser = checkAuth();
    if (!tokenUser) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error('Failed to load user info, status:', response.status);
            throw new Error('Failed to load user info');
        }
        
        const data = await response.json();
        console.log('사용자 정보 로드 성공:', data);
        
        // API 응답의 user 객체 사용
        const user = data.user || data;
        
        // 사이드바 정보 업데이트
        document.getElementById('sidebar-user-name').textContent = user.name || tokenUser.name || '사용자';
        document.getElementById('sidebar-user-email').textContent = user.email || tokenUser.email || '';
        
        // 프로필 이니셜 설정
        const initial = (user.name || tokenUser.name || 'U').charAt(0).toUpperCase();
        document.getElementById('profile-initial').textContent = initial;
        
        // 프로필 이미지가 있으면 표시
        if (user.profile_image) {
            document.getElementById('profile-image-preview').src = user.profile_image;
            document.getElementById('profile-image-preview').classList.remove('hidden');
            document.getElementById('profile-initial').style.display = 'none';
        }
        
        // 프로필 폼 채우기
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-address').value = user.address || user.b2b_address || '';
        
    } catch (error) {
        console.error('Failed to load user info:', error);
        // 토큰에서 기본 정보 사용
        document.getElementById('sidebar-user-name').textContent = tokenUser.name || '사용자';
        document.getElementById('sidebar-user-email').textContent = tokenUser.email || '';
        document.getElementById('profile-initial').textContent = (tokenUser.name || 'U').charAt(0).toUpperCase();
        
        document.getElementById('profile-name').value = tokenUser.name || '';
        document.getElementById('profile-email').value = tokenUser.email || '';
    }
}

// 프로필 이미지 업로드
function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다');
        return;
    }
    
    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다');
        return;
    }
    
    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profile-image-preview');
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        document.getElementById('profile-initial').style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    // TODO: 실제 서버 업로드 로직
    console.log('Profile image uploaded:', file.name);
}

// 탭 전환
function showTab(tabName) {
    // 모든 탭 콘텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // 선택된 탭 표시
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('fade-in');
    
    // 메뉴 활성화 상태 변경
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        item.classList.add('text-gray-600');
    });
    event.target.closest('.nav-item').classList.add('active');
    event.target.closest('.nav-item').classList.remove('text-gray-600');
    
    // 탭별 데이터 로드
    if (tabName === 'orders') {
        loadOrders();
    } else if (tabName === 'bookings') {
        loadBookings();
    } else if (tabName === 'consultations') {
        loadConsultations();
    }
}

// 프로필 정보 업데이트
async function updateProfile(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    const name = document.getElementById('profile-name').value;
    const phone = document.getElementById('profile-phone').value;
    const address = document.getElementById('profile-address').value;
    
    // 입력값 검증
    if (!name || name.trim() === '') {
        alert('이름을 입력해주세요');
        return;
    }
    
    try {
        console.log('프로필 업데이트 시작:', { name, phone, address });
        
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, phone, address })
        });
        
        const data = await response.json();
        console.log('프로필 업데이트 응답:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update profile');
        }
        
        alert('프로필이 업데이트되었습니다 ✅');
        
        // 업데이트된 정보 다시 로드
        await loadUserInfo();
        
        // 사이드바 정보도 업데이트
        if (data.user) {
            document.getElementById('sidebar-user-name').textContent = data.user.name || name;
            const initial = (data.user.name || name).charAt(0).toUpperCase();
            document.getElementById('profile-initial').textContent = initial;
        }
        
    } catch (error) {
        console.error('Failed to update profile:', error);
        alert('프로필 업데이트에 실패했습니다: ' + error.message);
    }
}

// 주문 내역 로드
async function loadOrders() {
    const token = localStorage.getItem('token');
    const ordersList = document.getElementById('orders-list');
    const ordersEmpty = document.getElementById('orders-empty');
    
    try {
        const response = await fetch('/api/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load orders');
        
        const data = await response.json();
        const orders = data.orders || [];
        
        if (orders.length === 0) {
            ordersList.innerHTML = '';
            ordersEmpty.style.display = 'block';
            return;
        }
        
        ordersEmpty.style.display = 'none';
        ordersList.innerHTML = orders.map(order => `
            <div class="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">주문번호: ${order.order_id}</p>
                        <p class="text-xs text-gray-400">${new Date(order.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-xs font-medium ${getOrderStatusClass(order.status)}">
                        ${getOrderStatusText(order.status)}
                    </span>
                </div>
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800 mb-2 text-sm">${order.product_name || '제품명'}</h4>
                    <p class="text-xs text-gray-500">수량: ${order.quantity}개</p>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span class="text-lg font-bold text-gray-800">${order.total_amount?.toLocaleString()}<span class="text-sm font-normal text-gray-500">원</span></span>
                    <button onclick="viewOrderDetail('${order.order_id}')" class="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium">
                        상세보기
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        ordersList.innerHTML = '<p class="text-center text-gray-500 py-8">주문 내역을 불러오는데 실패했습니다</p>';
    }
}

// 예약 내역 로드
async function loadBookings(type = 'all') {
    const token = localStorage.getItem('token');
    const bookingsList = document.getElementById('bookings-list');
    const bookingsEmpty = document.getElementById('bookings-empty');
    
    try {
        const response = await fetch('/api/bookings/my-bookings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load bookings');
        
        const data = await response.json();
        let bookings = data.bookings || [];
        
        // 타입 필터링
        if (type !== 'all') {
            bookings = bookings.filter(b => b.type === type);
        }
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = '';
            bookingsEmpty.style.display = 'block';
            return;
        }
        
        bookingsEmpty.style.display = 'none';
        bookingsList.innerHTML = bookings.map(booking => `
            <div class="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="inline-block px-3 py-1.5 rounded-full text-xs font-medium mb-2 ${booking.type === 'workshop' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}">
                            ${booking.type === 'workshop' ? '워크샵' : '원데이 클래스'}
                        </span>
                        <p class="text-xs text-gray-400">예약일: ${new Date(booking.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-xs font-medium ${getBookingStatusClass(booking.status)}">
                        ${getBookingStatusText(booking.status)}
                    </span>
                </div>
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800 mb-3 text-sm">${booking.title || '프로그램명'}</h4>
                    <div class="flex gap-4 text-xs text-gray-600">
                        <span><i class="fas fa-calendar mr-1.5"></i>${booking.date || '날짜 미정'}</span>
                        <span><i class="fas fa-users mr-1.5"></i>${booking.participants || 1}명</span>
                    </div>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span class="text-lg font-bold text-gray-800">${booking.amount?.toLocaleString() || '0'}<span class="text-sm font-normal text-gray-500">원</span></span>
                    <button onclick="viewBookingDetail('${booking.booking_id}')" class="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium">
                        상세보기
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load bookings:', error);
        bookingsList.innerHTML = '<p class="text-center text-gray-500 py-8">예약 내역을 불러오는데 실패했습니다</p>';
    }
}

// 상담 내역 로드
async function loadConsultations() {
    const consultationsList = document.getElementById('consultations-list');
    const consultationsEmpty = document.getElementById('consultations-empty');
    
    // TODO: 실제 상담 내역 API 구현 필요
    // 현재는 샘플 데이터 표시
    const sampleConsultations = [
        {
            id: 'C001',
            type: 'chatbot',
            title: 'AI 챗봇 상담',
            date: '2024-11-20',
            summary: '스트레스 관리 제품 추천 문의',
            status: 'completed'
        },
        {
            id: 'C002',
            type: 'support',
            title: '고객지원 상담',
            date: '2024-11-18',
            summary: '배송 관련 문의',
            status: 'completed'
        }
    ];
    
    if (sampleConsultations.length === 0) {
        consultationsList.innerHTML = '';
        consultationsEmpty.style.display = 'block';
        return;
    }
    
    consultationsEmpty.style.display = 'none';
    consultationsList.innerHTML = sampleConsultations.map(consultation => `
        <div class="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <span class="inline-block px-3 py-1.5 rounded-full text-xs font-medium mb-2 ${consultation.type === 'chatbot' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}">
                        ${consultation.type === 'chatbot' ? 'AI 챗봇' : '고객지원'}
                    </span>
                    <p class="text-xs text-gray-400">${new Date(consultation.date).toLocaleDateString('ko-KR')}</p>
                </div>
                <span class="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    완료
                </span>
            </div>
            <div class="mb-4">
                <h4 class="font-semibold text-gray-800 mb-2 text-sm">${consultation.title}</h4>
                <p class="text-xs text-gray-600 leading-relaxed">${consultation.summary}</p>
            </div>
            <div class="flex justify-end pt-4 border-t border-gray-100">
                <button onclick="viewConsultationDetail('${consultation.id}')" class="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium">
                    상세보기
                </button>
            </div>
        </div>
    `).join('');
}

// 예약 필터링
function filterBookings(type) {
    // 필터 버튼 스타일 업데이트
    document.querySelectorAll('.booking-filter-btn').forEach(btn => {
        btn.classList.remove('text-gray-900', 'border-b-2', 'border-gray-800', 'font-medium');
        btn.classList.add('text-gray-500');
    });
    event.target.classList.remove('text-gray-500');
    event.target.classList.add('text-gray-900', 'border-b-2', 'border-gray-800', 'font-medium');
    
    loadBookings(type);
}

// 비밀번호 변경
async function changePassword(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // 비밀번호 확인
    if (newPassword !== confirmPassword) {
        alert('새 비밀번호가 일치하지 않습니다');
        return;
    }
    
    // 비밀번호 강도 체크
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        alert('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다');
        return;
    }
    
    try {
        const response = await fetch('/api/user/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to change password');
        }
        
        alert('비밀번호가 변경되었습니다 ✅');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
    } catch (error) {
        console.error('Failed to change password:', error);
        alert(error.message || '비밀번호 변경에 실패했습니다');
    }
}

// 회원 탈퇴
async function withdrawAccount(event) {
    event.preventDefault();
    
    if (!confirm('정말로 회원 탈퇴하시겠습니까?\n이 작업은 취소할 수 없습니다.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    const password = document.getElementById('withdrawal-password').value;
    const reason = document.getElementById('withdrawal-reason').value;
    
    try {
        const response = await fetch('/api/user/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password, reason })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to withdraw');
        }
        
        alert('회원 탈퇴가 완료되었습니다');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.href = '/';
        
    } catch (error) {
        console.error('Failed to withdraw:', error);
        alert(error.message || '회원 탈퇴에 실패했습니다');
    }
}

// 로그아웃
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.href = '/';
    }
}

// 새 상담 시작
function startNewConsultation() {
    // 사이드톡 챗봇 열기
    if (typeof SidetalkAI !== 'undefined') {
        // 챗봇 열기 시도
        const chatButton = document.querySelector('[class*="sidetalk"]') || document.querySelector('iframe[src*="sidetalk"]');
        if (chatButton) {
            chatButton.click();
        } else {
            alert('챗봇을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        }
    } else {
        alert('상담 서비스를 준비 중입니다.');
    }
}

// 상세보기 함수들
function viewOrderDetail(orderId) {
    alert(`주문 상세보기: ${orderId}\n(개발 중)`);
}

function viewBookingDetail(bookingId) {
    alert(`예약 상세보기: ${bookingId}\n(개발 중)`);
}

function viewConsultationDetail(consultationId) {
    alert(`상담 상세보기: ${consultationId}\n(개발 중)`);
}

// 상태별 클래스 및 텍스트
function getOrderStatusClass(status) {
    const classes = {
        'pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        'paid': 'bg-blue-50 text-blue-700 border border-blue-200',
        'shipped': 'bg-purple-50 text-purple-700 border border-purple-200',
        'delivered': 'bg-green-50 text-green-700 border border-green-200',
        'cancelled': 'bg-red-50 text-red-700 border border-red-200'
    };
    return classes[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
}

function getOrderStatusText(status) {
    const texts = {
        'pending': '결제대기',
        'paid': '결제완료',
        'shipped': '배송중',
        'delivered': '배송완료',
        'cancelled': '취소됨'
    };
    return texts[status] || '알 수 없음';
}

function getBookingStatusClass(status) {
    const classes = {
        'pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        'confirmed': 'bg-green-50 text-green-700 border border-green-200',
        'completed': 'bg-blue-50 text-blue-700 border border-blue-200',
        'cancelled': 'bg-red-50 text-red-700 border border-red-200'
    };
    return classes[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
}

function getBookingStatusText(status) {
    const texts = {
        'pending': '예약대기',
        'confirmed': '예약확정',
        'completed': '완료',
        'cancelled': '취소됨'
    };
    return texts[status] || '알 수 없음';
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadOrders();
});
