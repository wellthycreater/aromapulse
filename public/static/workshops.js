// Workshops page JavaScript

let allWorkshops = [];
let filteredWorkshops = [];
let currentPriceFilter = 'all';

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', async () => {
    const accessGranted = checkAuth();
    
    if (!accessGranted) {
        showAccessDenied();
        return;
    }
    
    await loadWorkshops();
    
    // 페이지 뷰 트래킹
    trackPageView('workshops_list');
});

// 인증 확인 및 HR/복리후생 담당자 권한 체크
function checkAuth() {
    const token = localStorage.getItem('token');
    const authLink = document.getElementById('auth-link');
    
    if (!token) {
        // 로그인하지 않은 경우 - 로그인 유도
        authLink.textContent = '로그인';
        authLink.href = '/login';
        return false;
    }
    
    // 로그인된 사용자 정보 확인
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return false;
    }
    
    const user = JSON.parse(userStr);
    
    // B2B 사용자 체크
    if (user.user_type !== 'B2B') {
        console.log('[워크샵] B2C 사용자 접근 차단:', user.email);
        return false;
    }
    
    // 회사 규모 체크 (20인 이상)
    const validCompanySizes = ['20_50', '50_100', '100_300', '300_plus'];
    if (!user.company_size || !validCompanySizes.includes(user.company_size)) {
        console.log('[워크샵] 회사 규모 부적합 (20인 미만):', user.email);
        return false;
    }
    
    // 담당자 역할 체크 (HR, 조직문화, 복리후생)
    const allowedRoles = ['hr_manager', 'culture_team', 'welfare_manager'];
    if (!user.company_role || !allowedRoles.includes(user.company_role)) {
        console.log('[워크샵] 담당자 권한 없음:', user.email, user.company_role);
        return false;
    }
    
    // 모든 조건 충족 - 접근 허용
    authLink.textContent = '대시보드';
    authLink.href = '/dashboard';
    return true;
}

// 접근 거부 메시지 표시
function showAccessDenied() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('workshops-container').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    
    // Hero 섹션도 숨김
    const heroSection = document.querySelector('.bg-gradient-to-br');
    if (heroSection) {
        heroSection.style.display = 'none';
    }
    
    // 필터 섹션 숨김
    const filterSection = document.querySelector('.flex.gap-2.mb-6');
    if (filterSection) {
        filterSection.style.display = 'none';
    }
    
    // 현재 사용자 정보 확인
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    let denialReason = '';
    let actionButton = '';
    
    if (!user) {
        // 로그인 안 한 경우
        denialReason = '워크샵 서비스는 <strong>로그인이 필요한 서비스</strong>입니다.';
        actionButton = `
            <a href="/login" class="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:shadow-xl font-semibold transition-all">
                <i class="fas fa-sign-in-alt mr-2"></i>로그인하기
            </a>
        `;
    } else if (user.user_type !== 'B2B') {
        // B2C 사용자
        denialReason = '워크샵 서비스는 <strong>기업 담당자 전용</strong>입니다.<br>일반 고객님은 <strong>원데이 클래스</strong>를 이용해 주세요.';
        actionButton = `
            <a href="/oneday-classes" class="inline-block bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-3 rounded-lg hover:shadow-xl font-semibold transition-all">
                <i class="fas fa-chalkboard-teacher mr-2"></i>원데이 클래스 보기
            </a>
        `;
    } else if (!user.company_role || !['hr_manager', 'culture_team', 'welfare_manager'].includes(user.company_role)) {
        // B2B이지만 담당자 권한 없음
        denialReason = '워크샵 서비스는 <strong>HR팀, 조직문화팀, 복리후생 담당자</strong>만 이용 가능합니다.';
        actionButton = `
            <div class="text-center">
                <p class="text-gray-600 mb-4">담당자가 아니시라면 <strong>원데이 클래스</strong>를 이용해 주세요.</p>
                <a href="/oneday-classes" class="inline-block bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-3 rounded-lg hover:shadow-xl font-semibold transition-all">
                    <i class="fas fa-chalkboard-teacher mr-2"></i>원데이 클래스 보기
                </a>
            </div>
        `;
    } else if (!user.company_size || !['20_50', '50_100', '100_300', '300_plus'].includes(user.company_size)) {
        // 회사 규모 부적합
        denialReason = '워크샵 서비스는 <strong>20인 이상 기업</strong>을 대상으로 합니다.';
        actionButton = `
            <div class="text-center">
                <p class="text-gray-600 mb-4">소규모 기업이시라면 <strong>원데이 클래스</strong>를 이용해 주세요.</p>
                <a href="/oneday-classes" class="inline-block bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-3 rounded-lg hover:shadow-xl font-semibold transition-all">
                    <i class="fas fa-chalkboard-teacher mr-2"></i>원데이 클래스 보기
                </a>
            </div>
        `;
    }
    
    // 접근 거부 메시지 표시
    const container = document.querySelector('.container.mx-auto.px-4.py-12');
    if (container) {
        container.innerHTML = `
            <div class="max-w-3xl mx-auto text-center py-16">
                <div class="bg-white rounded-2xl shadow-2xl p-10">
                    <!-- Icon -->
                    <div class="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-user-shield text-5xl text-purple-600"></i>
                    </div>
                    
                    <!-- Title -->
                    <h2 class="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        기업 담당자 전용 서비스
                    </h2>
                    
                    <!-- Reason -->
                    <p class="text-lg text-gray-700 mb-8">
                        ${denialReason}
                    </p>
                    
                    <!-- Info Box -->
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 mb-8 text-left rounded-lg">
                        <h3 class="font-bold text-purple-900 mb-4 text-xl flex items-center">
                            <i class="fas fa-users-cog mr-3 text-2xl"></i>
                            워크샵 서비스 이용 대상
                        </h3>
                        <div class="space-y-3 text-purple-800">
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                                <div>
                                    <strong>HR팀 담당자</strong>
                                    <p class="text-sm text-purple-700">인사 및 인재개발 담당</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                                <div>
                                    <strong>조직문화팀 담당자</strong>
                                    <p class="text-sm text-purple-700">조직문화 및 팀빌딩 담당</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                                <div>
                                    <strong>복리후생 담당자</strong>
                                    <p class="text-sm text-purple-700">직원 복지 및 교육 담당</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                                <div>
                                    <strong>회사 규모</strong>
                                    <p class="text-sm text-purple-700">20인 ~ 50인 이상 기업</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Button -->
                    <div class="space-y-4">
                        ${actionButton}
                        
                        <div class="text-gray-500 text-sm mt-6">
                            <a href="/dashboard" class="text-purple-600 hover:underline font-semibold inline-flex items-center">
                                <i class="fas fa-arrow-left mr-2"></i>대시보드로 돌아가기
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// 워크샵 목록 로드
async function loadWorkshops() {
    try {
        const response = await fetch('/api/workshops?limit=100');
        
        if (response.ok) {
            allWorkshops = await response.json();
            filteredWorkshops = [...allWorkshops];
            renderWorkshops();
        } else {
            showEmpty();
        }
        
    } catch (error) {
        console.error('워크샵 로드 오류:', error);
        showEmpty();
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 워크샵 렌더링
function renderWorkshops() {
    const container = document.getElementById('workshops-container');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredWorkshops.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    container.innerHTML = filteredWorkshops.map((workshop, index) => `
        <div class="workshop-card group bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-all duration-300" 
             onclick="viewWorkshop(${workshop.id})"
             style="animation: fadeInUp 0.6s ease-out ${index * 0.1}s backwards;">
            <!-- Image with Overlay -->
            <div class="relative h-64 overflow-hidden">
                ${workshop.image_url 
                    ? `<img src="${workshop.image_url}" alt="${workshop.title}" 
                           class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                    : `<div class="w-full h-full bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 flex items-center justify-center">
                           <i class="fas fa-spa text-white text-6xl opacity-80"></i>
                       </div>`
                }
                <!-- Gradient Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                <!-- Category Badge - Floating -->
                ${workshop.category 
                    ? `<div class="absolute top-4 left-4">
                           <span class="inline-flex items-center px-4 py-2 text-xs font-bold bg-white/95 backdrop-blur-sm text-purple-700 rounded-full shadow-lg">
                               <i class="fas fa-tag mr-2"></i>${workshop.category}
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
                        ${workshop.title}
                    </h3>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6">
                <!-- Description -->
                <p class="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                    ${workshop.description || '팀의 유대감을 강화하고 스트레스를 해소하는 특별한 워크샵입니다.'}
                </p>
                
                <!-- Details with Icons -->
                <div class="space-y-3 mb-6">
                    <div class="flex items-center text-sm text-gray-700">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mr-3">
                            <i class="fas fa-map-marker-alt text-purple-600"></i>
                        </div>
                        <span class="font-medium">${workshop.location}</span>
                    </div>
                    
                    <div class="flex items-center text-sm text-gray-700">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-3">
                            <i class="fas fa-clock text-indigo-600"></i>
                        </div>
                        <span class="font-medium">${workshop.duration ? `${workshop.duration}분` : '시간 협의 가능'}</span>
                    </div>
                    
                    ${workshop.max_participants 
                        ? `<div class="flex items-center text-sm text-gray-700">
                               <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center mr-3">
                                   <i class="fas fa-users text-teal-600"></i>
                               </div>
                               <span class="font-medium">최소 10명 ~ 최대 ${workshop.max_participants}명</span>
                           </div>`
                        : `<div class="flex items-center text-sm text-gray-700">
                               <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center mr-3">
                                   <i class="fas fa-users text-teal-600"></i>
                               </div>
                               <span class="font-medium">인원 협의 가능</span>
                           </div>`
                    }
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-200 mb-6"></div>
                
                <!-- Footer with Price and CTA -->
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xs text-gray-500 mb-1">견적 문의 시작가</div>
                        <div class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            ${formatPrice(workshop.price)}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); viewWorkshop(${workshop.id})" 
                            class="group/btn relative px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                        <span class="relative z-10 flex items-center">
                            견적 문의
                            <i class="fas fa-arrow-right ml-2 group-hover/btn:translate-x-1 transition-transform"></i>
                        </span>
                        <!-- Shine Effect -->
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    </button>
                </div>
                
                <!-- Features Tags -->
                <div class="mt-4 flex flex-wrap gap-2">
                    <span class="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                        <i class="fas fa-user-tie mr-1"></i>전문 강사
                    </span>
                    <span class="text-xs px-3 py-1 bg-pink-50 text-pink-700 rounded-full font-medium">
                        <i class="fas fa-certificate mr-1"></i>맞춤 프로그램
                    </span>
                    <span class="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                        <i class="fas fa-handshake mr-1"></i>워케이션 가능
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// 검색
function searchWorkshops() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    
    // 검색 트래킹
    if (searchTerm) {
        trackSearch(searchTerm, category);
    }
    
    filteredWorkshops = allWorkshops.filter(workshop => {
        const matchesSearch = !searchTerm || 
            workshop.title.toLowerCase().includes(searchTerm) ||
            (workshop.description && workshop.description.toLowerCase().includes(searchTerm)) ||
            (workshop.location && workshop.location.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !category || workshop.category === category;
        
        const matchesPrice = filterByPriceRange(workshop, currentPriceFilter);
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    renderWorkshops();
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
    
    searchWorkshops();
}

function filterByPriceRange(workshop, range) {
    if (range === 'all') return true;
    if (!workshop.price) return false;
    
    const price = workshop.price;
    
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

// 워크샵 상세 보기
function viewWorkshop(id) {
    window.location.href = `/workshop/${id}`;
}

// 가격 포맷팅
function formatPrice(price) {
    if (!price) return '가격 문의';
    return `${price.toLocaleString()}원`;
}

// Empty state 표시
function showEmpty() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('workshops-container').style.display = 'none';
    document.getElementById('empty-state').style.display = 'block';
}

// 검색 입력 시 자동 검색
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            setTimeout(searchWorkshops, 300);
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', searchWorkshops);
    }
});
