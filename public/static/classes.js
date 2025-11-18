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

// 클래스 상세 페이지로 이동 (권한 체크 없이)
function viewClass(id) {
    window.location.href = `/class/${id}`;
}

// 클래스 목록 로드
async function loadClasses() {
    try {
        // type=class 파라미터로 원데이 클래스만 가져오기
        const response = await fetch('/api/workshops?limit=100&type=class');
        
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
                    <button onclick="event.stopPropagation(); viewClass(${cls.id})" 
                            class="group/btn relative px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                        <span class="relative z-10 flex items-center">
                            신청하기
                            <i class="fas fa-arrow-right ml-2 group-hover/btn:translate-x-1 transition-transform"></i>
                        </span>
                        <!-- Shine Effect -->
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    </button>
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
