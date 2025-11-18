// Workshops page JavaScript

let allWorkshops = [];
let filteredWorkshops = [];
let currentPriceFilter = 'all';

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', async () => {
    // 워크샵 목록은 모두에게 공개, 권한 체크는 업데이트만
    updateAuthUI();
    
    // 워크샵 로드 (모든 사용자)
    await loadWorkshops();
    
    // 페이지 뷰 트래킹
    trackPageView('workshops_list');
});

// UI 업데이트 (인증 링크)
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const authLink = document.getElementById('auth-link');
    
    if (!token) {
        // 로그인하지 않은 경우
        authLink.textContent = '로그인';
        authLink.href = '/login';
    } else {
        // 로그인된 경우
        authLink.textContent = '대시보드';
        authLink.href = '/dashboard';
    }
}

// 견적 문의 권한 체크 (상세 페이지에서 사용)
function checkQuotePermission() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return { hasPermission: false, reason: 'not_logged_in' };
    }
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return { hasPermission: false, reason: 'no_user_data' };
    }
    
    const user = JSON.parse(userStr);
    
    // B2B 사용자 체크
    if (user.user_type !== 'B2B') {
        return { hasPermission: false, reason: 'not_b2b' };
    }
    
    // 회사 규모 체크 (20인 이상)
    const validCompanySizes = ['20_50', '50_100', '100_300', '300_plus'];
    if (!user.company_size || !validCompanySizes.includes(user.company_size)) {
        return { hasPermission: false, reason: 'company_size' };
    }
    
    // 담당자 역할 체크 (HR, 조직문화, 복리후생)
    const allowedRoles = ['hr_manager', 'culture_team', 'welfare_manager'];
    if (!user.company_role || !allowedRoles.includes(user.company_role)) {
        return { hasPermission: false, reason: 'not_manager' };
    }
    
    // 모든 조건 충족
    return { hasPermission: true };
}

// 워크샵 상세 페이지로 이동 (권한 체크 없이)
function viewWorkshop(id) {
    window.location.href = `/workshop/${id}`;
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
