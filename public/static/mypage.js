// API로부터 동적 CSS 로드 (캐싱 우회)
async function loadDynamicStyles() {
    try {
        console.log('🎨 동적 CSS 로딩 시작...');
        const response = await fetch('/api/user/mypage-styles?v=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`API 응답 실패: ${response.status}`);
        }
        
        const css = await response.text();
        console.log('📦 CSS 받음:', css.length, '바이트');
        
        // 기존 동적 스타일 제거
        const oldStyle = document.getElementById('dynamic-profile-styles');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        // 새 스타일 주입
        const styleTag = document.createElement('style');
        styleTag.id = 'dynamic-profile-styles';
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
        
        console.log('✅ 동적 CSS 로드 성공!');
        return true;
    } catch (error) {
        console.error('❌ 동적 CSS 로드 실패:', error);
        console.error('상세:', error.message);
        return false;
    }
}

// 로그인 체크 (쿠키 기반 인증)
async function checkAuth() {
    try {
        console.log('[checkAuth] /api/auth/me 호출...');
        const response = await fetch('/api/auth/me');
        console.log('[checkAuth] 응답 상태:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[checkAuth] API 실패:', response.status, errorText);
            alert('로그인 상태를 확인할 수 없습니다');
            location.href = '/login';
            return null;
        }
        
        const contentType = response.headers.get('content-type');
        console.log('[checkAuth] Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[checkAuth] JSON이 아닌 응답:', text.substring(0, 200));
            alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            return null;
        }
        
        const data = await response.json();
        console.log('[checkAuth] 응답 데이터:', data);
        
        if (data.authenticated && data.user) {
            return data.user;
        } else {
            alert('로그인이 필요합니다');
            location.href = '/login';
            return null;
        }
    } catch (e) {
        console.error('[checkAuth] 예외 발생:', e);
        alert('로그인 상태를 확인할 수 없습니다');
        location.href = '/login';
        return null;
    }
}

// 사용자 정보 로드
async function loadUserInfo() {
    console.log('[loadUserInfo] 시작...');
    const authUser = await checkAuth();
    console.log('[loadUserInfo] checkAuth 결과:', authUser);
    if (!authUser) {
        console.error('[loadUserInfo] authUser가 없습니다');
        return;
    }
    
    // authUser 데이터로 먼저 기본 정보 표시
    document.getElementById('sidebar-user-name').textContent = authUser.name || '사용자';
    document.getElementById('sidebar-user-email').textContent = authUser.email || '';
    document.getElementById('profile-initial').textContent = (authUser.name || 'U').charAt(0).toUpperCase();
    document.getElementById('profile-name').value = authUser.name || '';
    document.getElementById('profile-email').value = authUser.email || '';
    
    try {
        console.log('[loadUserInfo] /api/user/profile 호출 중...');
        const response = await fetch('/api/user/profile', {
            credentials: 'include'  // 쿠키 포함
        });
        
        console.log('[loadUserInfo] 응답 상태:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[loadUserInfo] API 실패:', response.status, errorText);
            
            // 401 Unauthorized - 토큰 인증 실패 시 로그아웃
            if (response.status === 401) {
                console.warn('[loadUserInfo] 토큰 인증 실패 - 자동 로그아웃');
                alert('⚠️ 로그인 세션이 만료되었습니다.\n다시 로그인해주세요.');
                document.cookie = 'auth_token=; Path=/; Max-Age=0';
                window.location.href = '/login';
                return;
            }
            
            console.warn('[loadUserInfo] authUser 데이터로 폴백합니다');
            
            // OAuth provider 설정 (authUser에서)
            const emailInput = document.getElementById('profile-email');
            const oauthProvider = authUser.provider;
            console.log('[loadUserInfo] OAuth provider (from authUser):', oauthProvider);
            if (oauthProvider && oauthProvider !== 'local') {
                emailInput.readOnly = true;
                emailInput.classList.add('bg-gray-50');
                emailInput.title = 'OAuth 로그인 사용자는 이메일을 변경할 수 없습니다';
            }
            return;
        }
        
        const data = await response.json();
        console.log('[loadUserInfo] 사용자 정보 로드 성공:', data);
        
        // API 응답의 user 객체 사용
        const user = data.user || data;
        
        // 사이드바 정보 업데이트
        document.getElementById('sidebar-user-name').textContent = user.name || authUser.name || '사용자';
        document.getElementById('sidebar-user-email').textContent = user.email || authUser.email || '';
        
        // 프로필 이니셜 설정
        const initial = (user.name || authUser.name || 'U').charAt(0).toUpperCase();
        document.getElementById('profile-initial').textContent = initial;
        
        // 프로필 이미지가 있으면 표시
        const removeBtn = document.getElementById('remove-image-btn');
        if (user.profile_image) {
            document.getElementById('profile-image-preview').src = user.profile_image;
            document.getElementById('profile-image-preview').classList.remove('hidden');
            document.getElementById('profile-initial').style.display = 'none';
            // 삭제 버튼 표시
            if (removeBtn) removeBtn.classList.remove('hidden');
        } else {
            // 이미지가 없으면 삭제 버튼 숨김
            if (removeBtn) removeBtn.classList.add('hidden');
        }
        
        // 프로필 폼 채우기
        console.log('[loadUserInfo] 프로필 폼 채우기 - name:', user.name, 'email:', user.email);
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-address').value = user.address || user.b2b_address || '';
        
        // OAuth 사용자는 이메일 변경 불가
        const emailInput = document.getElementById('profile-email');
        const oauthProvider = user.oauth_provider || authUser.provider;
        console.log('[loadUserInfo] OAuth provider:', oauthProvider);
        if (oauthProvider && oauthProvider !== 'local') {
            emailInput.readOnly = true;
            emailInput.classList.add('bg-gray-50');
            emailInput.title = 'OAuth 로그인 사용자는 이메일을 변경할 수 없습니다';
        } else {
            emailInput.readOnly = false;
            emailInput.classList.remove('bg-gray-50');
            emailInput.title = '';
        }
        
    } catch (error) {
        console.error('[loadUserInfo] 예외 발생:', error);
        console.warn('[loadUserInfo] authUser 데이터를 이미 표시했습니다');
        
        // OAuth provider 설정 (authUser에서)
        const emailInput = document.getElementById('profile-email');
        const oauthProvider = authUser.provider;
        console.log('[loadUserInfo] OAuth provider (from authUser, catch):', oauthProvider);
        if (oauthProvider && oauthProvider !== 'local') {
            emailInput.readOnly = true;
            emailInput.classList.add('bg-gray-50');
            emailInput.title = 'OAuth 로그인 사용자는 이메일을 변경할 수 없습니다';
        }
    }
    
    // 통계 로드
    loadUserStats();
}

// 사용자 통계 로드
async function loadUserStats() {
    try {
        // TODO: 통계 API 구현 필요
        // 현재는 기본값 사용
        const stats = {
            total_orders: 0,
            total_bookings: 0,
            total_consultations: 0
        };
        
        // 통계 카드 업데이트
        const statCards = document.querySelectorAll('.stat-card .text-2xl');
        if (statCards[0]) statCards[0].textContent = stats.total_orders || 0;
        if (statCards[1]) statCards[1].textContent = stats.total_bookings || 0;
        if (statCards[2]) statCards[2].textContent = stats.total_consultations || 0;
        
        console.log('통계 로드 성공:', stats);
    } catch (error) {
        console.error('통계 로드 오류:', error);
    }
}

// 이미지 압축 함수
function compressImage(file, maxWidth = 400, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Canvas 생성
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // 최대 너비 제한
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 이미지 그리기
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Base64로 변환 (JPEG, 품질 0.8)
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                
                console.log('원본 크기:', file.size, '바이트');
                console.log('압축 후 크기:', compressedBase64.length, '바이트');
                console.log('압축률:', ((1 - compressedBase64.length / file.size) * 100).toFixed(2) + '%');
                
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// (중복 함수 제거됨 - 768-913줄에 쿠키 기반 버전 사용)

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
    
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    const address = document.getElementById('profile-address').value;
    
    // 입력값 검증
    if (!name || name.trim() === '') {
        alert('이름을 입력해주세요');
        return;
    }
    
    if (!email || email.trim() === '') {
        alert('이메일을 입력해주세요');
        return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('올바른 이메일 형식을 입력해주세요');
        return;
    }
    
    try {
        console.log('프로필 업데이트 시작:', { name, email, phone, address });
        
        // 업데이트 데이터 준비
        const updateData = { name, email, phone, address };
        
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });
        
        console.log('[updateProfile] API 응답 상태:', response.status);
        
        // Content-Type 확인
        const contentType = response.headers.get('content-type');
        console.log('[updateProfile] Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[updateProfile] JSON이 아닌 응답:', text.substring(0, 500));
            throw new Error('서버에서 올바른 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
        
        const data = await response.json();
        console.log('[updateProfile] 프로필 업데이트 응답:', data);
        console.log('[updateProfile] 응답 전체:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            console.error('[updateProfile] 서버 에러 응답:', {
                error: data.error,
                message: data.message,
                stack: data.stack,
                details: data.details
            });
            
            const errorMsg = data.error || data.message || `서버 오류 (${response.status})`;
            const details = data.details ? `\n상세: ${data.details}` : '';
            const stack = data.stack ? `\n스택: ${data.stack}` : '';
            throw new Error(errorMsg + details + stack);
        }
        
        // 쿠키 기반 인증 사용 - 토큰은 서버에서 자동으로 쿠키에 설정됨
        
        alert('✅ 프로필이 성공적으로 업데이트되었습니다!');
        
        // 업데이트된 정보 다시 로드
        await loadUserInfo();
        
        // 사이드바 정보도 업데이트
        if (data.user) {
            document.getElementById('sidebar-user-name').textContent = data.user.name || name;
            const initial = (data.user.name || name).charAt(0).toUpperCase();
            document.getElementById('profile-initial').textContent = initial;
        }
        
    } catch (error) {
        console.error('❌ 프로필 업데이트 실패:', error);
        console.error('에러 상세:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // 토큰 인증 실패 시 자동 로그아웃
        if (error.message && error.message.includes('토큰 인증 실패')) {
            alert('⚠️ 로그인 세션이 만료되었습니다.\n다시 로그인해주세요.');
            // 쿠키 삭제
            document.cookie = 'auth_token=; Path=/; Max-Age=0';
            // 로그인 페이지로 리다이렉트
            window.location.href = '/login';
            return;
        }
        
        // 사용자에게 명확한 에러 메시지 표시
        const errorMessage = error.message || '알 수 없는 오류가 발생했습니다';
        alert(`❌ 프로필 업데이트 실패\n\n${errorMessage}\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인하세요.`);
    }
}

// 주문 내역 로드
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const ordersEmpty = document.getElementById('orders-empty');
    
    try {
        const response = await fetch('/api/orders/my-orders', {
            credentials: 'include'  // 쿠키 포함
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
    const bookingsList = document.getElementById('bookings-list');
    const bookingsEmpty = document.getElementById('bookings-empty');
    
    try {
        console.log('[MyPage] Loading reservations...');
        
        // 새로운 예약 API 호출
        const response = await fetch('/api/reservations/my', {
            credentials: 'include'  // 쿠키 포함
        });
        
        console.log('[MyPage] Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('[MyPage] Failed to load reservations:', errorData);
            throw new Error(errorData.error || 'Failed to load reservations');
        }
        
        let reservations = await response.json();
        console.log('[MyPage] Loaded reservations:', reservations);
        console.log('[MyPage] Total count:', reservations.length);
        
        // reservation_type 기반 타입 필터링
        if (type !== 'all') {
            const typeMap = {
                'workshop': 'workshop',
                'product': 'product',
                'class': 'class'
            };
            reservations = reservations.filter(r => r.reservation_type === typeMap[type]);
            console.log(`[MyPage] After filter (${type}):`, reservations.length);
        }
        
        if (reservations.length === 0) {
            bookingsList.innerHTML = '';
            bookingsEmpty.style.display = 'block';
            console.log('[MyPage] No reservations to display');
            return;
        }
        
        console.log('[MyPage] Displaying', reservations.length, 'reservations');
        
        bookingsEmpty.style.display = 'none';
        bookingsList.innerHTML = reservations.map(reservation => {
            // 예약 타입별 제목 결정
            const title = reservation.class_title || reservation.product_name || '예약 항목';
            const location = reservation.class_location || reservation.class_address || '';
            
            return `
            <div class="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="inline-block px-3 py-1.5 rounded-full text-xs font-medium mb-2 ${
                            reservation.reservation_type === 'workshop' ? 'bg-purple-50 text-purple-600' : 
                            reservation.reservation_type === 'product' ? 'bg-blue-50 text-blue-600' : 
                            'bg-green-50 text-green-600'
                        }">
                            ${
                                reservation.reservation_type === 'workshop' ? '워크샵' : 
                                reservation.reservation_type === 'product' ? '쇼핑 예약' : 
                                '원데이 클래스'
                            }
                        </span>
                        <p class="text-xs text-gray-400">예약일: ${new Date(reservation.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-xs font-medium ${getBookingStatusClass(reservation.status)}">
                        ${getBookingStatusText(reservation.status)}
                    </span>
                </div>
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800 mb-3 text-sm">${title}</h4>
                    <div class="flex gap-4 text-xs text-gray-600">
                        <span><i class="fas fa-calendar mr-1.5"></i>${reservation.reservation_date} ${reservation.reservation_time || ''}</span>
                        <span><i class="${reservation.reservation_type === 'product' ? 'fas fa-box' : 'fas fa-users'} mr-1.5"></i>${reservation.participants || 1}${reservation.reservation_type === 'product' ? '개' : '명'}</span>
                    </div>
                    ${location ? `<div class="mt-2 text-xs text-gray-500"><i class="fas fa-map-marker-alt mr-1.5"></i>${location}</div>` : ''}
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                        <div class="text-xs text-gray-500 mb-1">연락처: ${reservation.contact_phone}</div>
                        <div class="text-xs text-gray-500">${reservation.contact_name}</div>
                    </div>
                    <button onclick="viewReservationDetail(${reservation.id})" class="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium">
                        상세보기
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('[MyPage] Failed to load bookings:', error);
        console.error('[MyPage] Error details:', error.message);
        bookingsEmpty.style.display = 'none';
        bookingsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p class="mb-2">예약 내역을 불러오는데 실패했습니다</p>
                <p class="text-sm text-gray-400">${error.message}</p>
                <button onclick="loadBookings()" class="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                    다시 시도
                </button>
            </div>
        `;
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
                'Content-Type': 'application/json'
            },
            credentials: 'include',  // 쿠키 포함
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
    
    const password = document.getElementById('withdrawal-password').value;
    const reason = document.getElementById('withdrawal-reason').value;
    
    try {
        const response = await fetch('/api/user/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',  // 쿠키 포함
            body: JSON.stringify({ password, reason })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to withdraw');
        }
        
        alert('회원 탈퇴가 완료되었습니다');
        // 쿠키는 서버에서 자동으로 삭제됨
        location.href = '/';
        
    } catch (error) {
        console.error('Failed to withdraw:', error);
        alert(error.message || '회원 탈퇴에 실패했습니다');
    }
}

// 로그아웃
async function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            // 서버에 로그아웃 요청하여 쿠키 삭제
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('로그아웃 요청 실패:', error);
        }
        // 쿠키는 서버에서 삭제되었으므로 로그인 페이지로 이동
        location.href = '/';
    }
}

// 프로필 이미지 업로드 처리
async function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }
    
    // 파일 크기 검증 (1MB)
    if (file.size > 1024 * 1024) {
        alert('이미지 크기는 1MB 이하여야 합니다.');
        return;
    }
    
    try {
        // 이미지를 캔버스에 그려서 리사이즈 및 압축
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        
        img.onload = async function() {
            // 캔버스 생성 및 리사이즈 (최대 300x300)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = img.width;
            let height = img.height;
            const maxSize = 300;
            
            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Base64로 변환 (JPEG, 품질 0.8)
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            // 업로드 중 표시
            const uploadBtn = document.querySelector('[onclick*="profile-image-input"]');
            const originalHTML = uploadBtn.innerHTML;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i>';
            uploadBtn.disabled = true;
            
            // API 호출
            const response = await fetch('/api/user/profile-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ imageData })
            });
            
            if (!response.ok) {
                throw new Error('이미지 업로드 실패');
            }
            
            const result = await response.json();
            
            // UI 업데이트
            document.getElementById('profile-image-preview').src = imageData;
            document.getElementById('profile-image-preview').classList.remove('hidden');
            document.getElementById('profile-initial').style.display = 'none';
            document.getElementById('remove-image-btn').classList.remove('hidden');
            
            // 버튼 복원
            uploadBtn.innerHTML = originalHTML;
            uploadBtn.disabled = false;
            
            alert('프로필 이미지가 업로드되었습니다.');
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        alert('이미지 업로드에 실패했습니다.');
        
        // 버튼 복원
        const uploadBtn = document.querySelector('[onclick*="profile-image-input"]');
        uploadBtn.innerHTML = '<i class="fas fa-camera text-xs"></i>';
        uploadBtn.disabled = false;
    }
}

// 프로필 이미지 삭제
async function removeProfileImage() {
    if (!confirm('프로필 이미지를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        // 삭제 중 표시
        const removeBtn = document.getElementById('remove-image-btn');
        const originalHTML = removeBtn.innerHTML;
        removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i>';
        removeBtn.disabled = true;
        
        // API 호출
        const response = await fetch('/api/user/profile-image', {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('이미지 삭제 실패');
        }
        
        // UI 업데이트
        document.getElementById('profile-image-preview').src = '';
        document.getElementById('profile-image-preview').classList.add('hidden');
        document.getElementById('profile-initial').style.display = '';
        removeBtn.classList.add('hidden');
        
        // 버튼 복원
        removeBtn.innerHTML = originalHTML;
        removeBtn.disabled = false;
        
        alert('프로필 이미지가 삭제되었습니다.');
        
    } catch (error) {
        console.error('이미지 삭제 오류:', error);
        alert('이미지 삭제에 실패했습니다.');
        
        // 버튼 복원
        const removeBtn = document.getElementById('remove-image-btn');
        removeBtn.innerHTML = '<i class="fas fa-times text-xs"></i>';
        removeBtn.disabled = false;
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

function viewReservationDetail(reservationId) {
    alert(`예약 상세보기: ${reservationId}\n(개발 중)`);
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

// 현재 위치 사용하기
async function useCurrentLocation() {
    // 위치 권한 지원 확인
    if (!navigator.geolocation) {
        alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
        return;
    }

    // 로딩 표시
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>위치 가져오는 중...';

    try {
        console.log('📍 위치 권한 요청 중...');
        
        // 위치 권한 요청
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log(`✅ 위치 획득: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`);

        // 서버에 위치 정보 전송
        const response = await fetch('/api/user/location', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: latitude,
                longitude: longitude
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '위치 업데이트 실패');
        }

        const result = await response.json();
        console.log('✅ 서버 위치 업데이트 성공:', result);

        // 주소 필드에 좌표 정보 표시
        const addressField = document.getElementById('profile-address');
        addressField.value = `현재 위치 (위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)})`;
        addressField.placeholder = '주소를 입력하거나 현재 위치를 사용하세요';

        // 성공 메시지
        alert(`✅ 현재 위치가 저장되었습니다!\n\n이제 인근 공방을 쉽게 찾을 수 있습니다.\n(정확도: 약 ${Math.round(accuracy)}m)`);

    } catch (error) {
        console.error('❌ 위치 가져오기 실패:', error);
        
        // 에러 메시지 처리
        let errorMessage = '위치를 가져올 수 없습니다.';
        
        if (error.code) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '위치 권한이 거부되었습니다.\n\n브라우저 설정에서 위치 권한을 허용해주세요.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '위치 정보를 사용할 수 없습니다.';
                    break;
                case error.TIMEOUT:
                    errorMessage = '위치 요청 시간이 초과되었습니다.\n\n다시 시도해주세요.';
                    break;
            }
        } else {
            errorMessage = error.message || errorMessage;
        }
        
        alert('❌ ' + errorMessage);
    } finally {
        // 버튼 원상복구
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async function() {
    // 동적 CSS 먼저 로드 (캐싱 우회)
    await loadDynamicStyles();
    
    // 인증 체크 먼저 수행
    const user = await checkAuth();
    if (!user) return;  // 로그인 안 되어 있으면 중단
    
    // 사용자 정보 및 데이터 로드
    loadUserInfo();
    loadOrders();
    loadBookings();  // 예약 내역도 자동 로드
    
    // 예약 내역 탭을 기본으로 표시
    document.getElementById('tab-bookings').classList.remove('hidden');
    console.log('[MyPage] Default tab set to: bookings');
});
