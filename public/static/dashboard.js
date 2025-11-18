// Dashboard JavaScript

let currentUser = null;

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', async () => {
    console.log('[DASHBOARD] Page loaded, checking localStorage...');
    console.log('[DASHBOARD] localStorage.token exists:', !!localStorage.getItem('token'));
    console.log('[DASHBOARD] localStorage.user exists:', !!localStorage.getItem('user'));
    
    // 짧은 지연 후 실행 (localStorage 준비 대기)
    setTimeout(async () => {
        await loadUserData();
    }, 100);
});

// 사용자 데이터 로드
async function loadUserData() {
    try {
        // localStorage에서 토큰과 사용자 정보 가져오기
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        console.log('[DEBUG] Dashboard load - token:', token ? 'exists' : 'missing');
        console.log('[DEBUG] Dashboard load - userStr:', userStr ? 'exists' : 'missing');
        
        if (!token || !userStr) {
            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            console.log('[DEBUG] Redirecting to login - missing token or user');
            window.location.href = '/login';
            return;
        }
        
        currentUser = JSON.parse(userStr);
        console.log('[DEBUG] Current user loaded:', currentUser.email, currentUser.user_type);
        
        // 헤더에 사용자 이름 표시
        document.getElementById('user-name').textContent = currentUser.name;
        
        // 워크샵 메뉴 가시성 제어: B2B만 표시
        updateWorkshopMenuVisibility(currentUser.user_type);
        
        // 사용자 타입에 따라 대시보드 표시
        if (currentUser.user_type === 'B2C') {
            await loadB2CDashboard();
        } else if (currentUser.user_type === 'B2B') {
            await loadB2BDashboard();
        }
        
        // 로딩 숨기기
        document.getElementById('loading').style.display = 'none';
        
    } catch (error) {
        console.error('사용자 데이터 로드 오류:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
        window.location.href = '/login';
    }
}

// 워크샵 메뉴 가시성 제어
function updateWorkshopMenuVisibility(userType) {
    // 모든 워크샵 관련 링크/버튼 찾기
    const workshopButtons = document.querySelectorAll('button[onclick*="workshops"], a[href*="/workshops"]');
    const workshopSections = document.querySelectorAll('[id*="workshop"]');
    
    workshopButtons.forEach(button => {
        if (userType === 'B2B') {
            button.style.display = '';
        } else {
            button.style.display = 'none';
        }
    });
    
    // B2C 사용자의 경우 추천 워크샵 섹션 숨기기
    if (userType === 'B2C') {
        const recommendedSection = document.querySelector('[id*="recommended-workshops"]')?.closest('.bg-white');
        if (recommendedSection) {
            recommendedSection.style.display = 'none';
        }
    }
}

// B2C 대시보드 로드
async function loadB2CDashboard() {
    document.getElementById('b2c-dashboard').style.display = 'block';
    
    // 사용자 정보 표시
    document.getElementById('b2c-user-name').textContent = currentUser.name;
    document.getElementById('b2c-user-email').textContent = currentUser.email;
    
    // 프로필 이미지 표시
    if (currentUser.profile_image) {
        document.getElementById('b2c-profile-image').src = currentUser.profile_image;
        document.getElementById('b2c-profile-image').classList.remove('hidden');
        document.getElementById('b2c-profile-icon').classList.add('hidden');
    }
    
    // 카테고리 한글 변환
    const categoryText = getCategoryText(currentUser.b2c_category, currentUser.b2c_subcategory);
    document.getElementById('b2c-category').textContent = categoryText || '미설정';
    
    // 가입일 포맷
    if (currentUser.created_at) {
        const createdDate = new Date(currentUser.created_at).toLocaleDateString('ko-KR');
        document.getElementById('b2c-created').textContent = createdDate;
    } else {
        document.getElementById('b2c-created').textContent = '정보 없음';
    }
    
    // 통계 데이터 로드
    await loadB2CStats();
    
    // 활동 통계 로드
    await loadActivityStats();
}

// B2B 대시보드 로드
async function loadB2BDashboard() {
    document.getElementById('b2b-dashboard').style.display = 'block';
    
    // 비즈니스 정보 표시
    document.getElementById('b2b-business-name').textContent = currentUser.b2b_business_name || currentUser.name;
    document.getElementById('b2b-user-email').textContent = currentUser.email;
    document.getElementById('b2b-user-name').textContent = currentUser.name;
    
    // 프로필 이미지 표시
    if (currentUser.profile_image) {
        document.getElementById('b2b-profile-image').src = currentUser.profile_image;
        document.getElementById('b2b-profile-image').classList.remove('hidden');
        document.getElementById('b2b-profile-icon').classList.add('hidden');
    }
    
    // 카테고리 한글 변환
    const categoryText = getB2BCategoryText(currentUser.b2b_category);
    document.getElementById('b2b-category').textContent = categoryText || '미설정';
    
    // 가입일 포맷
    if (currentUser.created_at) {
        const createdDate = new Date(currentUser.created_at).toLocaleDateString('ko-KR');
        document.getElementById('b2b-created').textContent = createdDate;
    } else {
        document.getElementById('b2b-created').textContent = '정보 없음';
    }
    
    // 통계 데이터 로드
    await loadB2BStats();
}

// B2C 통계 로드
async function loadB2CStats() {
    try {
        const token = localStorage.getItem('token');
        
        // 예약 수 조회
        const bookingsResponse = await fetch(`/api/bookings/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (bookingsResponse.ok) {
            const bookings = await bookingsResponse.json();
            document.getElementById('booking-count').textContent = bookings.length || 0;
        }
        
        // 리뷰 수 조회
        const reviewsResponse = await fetch(`/api/reviews/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (reviewsResponse.ok) {
            const reviews = await reviewsResponse.json();
            document.getElementById('review-count').textContent = reviews.length || 0;
        }
        
    } catch (error) {
        console.error('B2C 통계 로드 오류:', error);
    }
}

// B2B 통계 로드
async function loadB2BStats() {
    try {
        const token = localStorage.getItem('token');
        
        // 워크샵 수 조회
        const workshopsResponse = await fetch(`/api/workshops/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (workshopsResponse.ok) {
            const workshops = await workshopsResponse.json();
            document.getElementById('workshop-count').textContent = workshops.length || 0;
        }
        
        // 총 예약 수 조회
        const bookingsResponse = await fetch(`/api/bookings/provider`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (bookingsResponse.ok) {
            const bookings = await bookingsResponse.json();
            document.getElementById('total-bookings').textContent = bookings.length || 0;
        }
        
    } catch (error) {
        console.error('B2B 통계 로드 오류:', error);
    }
}

// 내 예약 로드 (B2C)
async function loadMyBookings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bookings = await response.json();
            
            if (bookings.length === 0) {
                return;
            }
            
            const container = document.getElementById('my-bookings');
            container.innerHTML = bookings.map(booking => `
                <div class="border rounded-lg p-4 mb-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-800 mb-2">${booking.workshop_title}</h4>
                            <p class="text-sm text-gray-600 mb-1">
                                <i class="far fa-calendar mr-2"></i>${new Date(booking.booking_date).toLocaleDateString('ko-KR')}
                            </p>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-users mr-2"></i>${booking.participants}명
                            </p>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}">${getStatusText(booking.status)}</span>
                            <p class="text-lg font-bold text-gray-800 mt-2">${booking.total_price?.toLocaleString()}원</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('예약 로드 오류:', error);
    }
}

// 추천 워크샵 로드
async function loadRecommendedWorkshops() {
    try {
        const response = await fetch('/api/workshops?limit=3');
        
        if (response.ok) {
            const workshops = await response.json();
            
            const container = document.getElementById('recommended-workshops');
            container.innerHTML = workshops.map(workshop => `
                <div class="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer" onclick="location.href='/workshop/${workshop.id}'">
                    <div class="h-48 bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center">
                        <i class="fas fa-spa text-white text-4xl"></i>
                    </div>
                    <div class="p-4">
                        <h4 class="font-bold text-gray-800 mb-2">${workshop.title}</h4>
                        <p class="text-sm text-gray-600 mb-2 line-clamp-2">${workshop.description || ''}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-teal-600 font-bold">${workshop.price?.toLocaleString()}원</span>
                            <span class="text-sm text-gray-500">${workshop.duration}분</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('추천 워크샵 로드 오류:', error);
    }
}

// 내 워크샵 로드 (B2B)
async function loadMyWorkshops() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/workshops/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const workshops = await response.json();
            
            if (workshops.length === 0) {
                return;
            }
            
            const container = document.getElementById('my-workshops');
            container.innerHTML = `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">워크샵명</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">카테고리</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">가격</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
                                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">관리</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${workshops.map(workshop => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3">${workshop.title}</td>
                                    <td class="px-4 py-3 text-sm text-gray-600">${workshop.category}</td>
                                    <td class="px-4 py-3 font-semibold">${workshop.price?.toLocaleString()}원</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 rounded-full text-xs ${workshop.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                                            ${workshop.is_active ? '활성' : '비활성'}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <button onclick="editWorkshop(${workshop.id})" class="text-blue-600 hover:text-blue-700 mr-2">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="viewWorkshop(${workshop.id})" class="text-teal-600 hover:text-teal-700">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('워크샵 로드 오류:', error);
    }
}

// 최근 예약 로드 (B2B)
async function loadRecentBookings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/bookings/provider?limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bookings = await response.json();
            
            if (bookings.length === 0) {
                return;
            }
            
            const container = document.getElementById('recent-bookings');
            container.innerHTML = bookings.map(booking => `
                <div class="border-b last:border-b-0 py-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-semibold text-gray-800">${booking.workshop_title}</h4>
                            <p class="text-sm text-gray-600 mt-1">
                                고객: ${booking.user_name} | ${booking.participants}명
                            </p>
                            <p class="text-sm text-gray-500 mt-1">
                                ${new Date(booking.booking_date).toLocaleDateString('ko-KR')}
                            </p>
                        </div>
                        <div class="text-right">
                            <span class="px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}">${getStatusText(booking.status)}</span>
                            <p class="text-sm font-bold text-gray-800 mt-2">${booking.total_price?.toLocaleString()}원</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('예약 현황 로드 오류:', error);
    }
}

// 헬퍼 함수들
function getCategoryText(category, subcategory) {
    const categoryMap = {
        'daily_stress': '일상 스트레스',
        'work_stress': '직무 스트레스'
    };
    
    const text = categoryMap[category] || category;
    return subcategory ? `${text} - ${subcategory}` : text;
}

function getB2BCategoryText(category) {
    const categoryMap = {
        'perfumer': '조향사',
        'company': '기업',
        'shop': '매장',
        'independent': '독립 사업자'
    };
    
    return categoryMap[category] || category;
}

function getStatusColor(status) {
    const colorMap = {
        'pending': 'bg-yellow-100 text-yellow-700',
        'confirmed': 'bg-green-100 text-green-700',
        'cancelled': 'bg-red-100 text-red-700',
        'completed': 'bg-gray-100 text-gray-700'
    };
    
    return colorMap[status] || 'bg-gray-100 text-gray-700';
}

function getStatusText(status) {
    const statusMap = {
        'pending': '대기중',
        'confirmed': '확정',
        'cancelled': '취소',
        'completed': '완료'
    };
    
    return statusMap[status] || status;
}

function editWorkshop(id) {
    window.location.href = `/workshop/edit/${id}`;
}

function viewWorkshop(id) {
    window.location.href = `/workshop/${id}`;
}

// 활동 통계 로드 (B2C)
async function loadActivityStats() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('/api/activity/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('활동 통계를 불러올 수 없습니다');
        }
        
        const stats = await response.json();
        
        // 활동 타입별 카운트 표시
        const activityCounts = {};
        stats.activity_counts.forEach(item => {
            activityCounts[item.activity_type] = item.count;
        });
        
        document.getElementById('view-count').textContent = activityCounts['view'] || 0;
        document.getElementById('search-count').textContent = activityCounts['search'] || 0;
        document.getElementById('filter-count').textContent = activityCounts['filter'] || 0;
        document.getElementById('click-count').textContent = activityCounts['click'] || 0;
        
        // 최근 검색 키워드 표시
        if (stats.search_keywords && stats.search_keywords.length > 0) {
            const keywordsHtml = stats.search_keywords
                .filter(item => item.keyword)
                .map(item => `
                    <span class="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                        ${escapeHtml(item.keyword)} (${item.count})
                    </span>
                `).join('');
            
            if (keywordsHtml) {
                document.getElementById('recent-searches').innerHTML = keywordsHtml;
            }
        }
        
    } catch (error) {
        console.error('활동 통계 로드 오류:', error);
        // 통계 로드 실패해도 대시보드는 계속 표시
    }
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 로그아웃
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}
