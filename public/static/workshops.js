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

// 인증 확인 및 B2B 권한 체크
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
    
    // B2B 사용자만 접근 허용
    if (user.user_type !== 'B2B') {
        console.log('[워크샵] B2C 사용자 접근 차단:', user.email);
        return false;
    }
    
    // B2B 사용자 - 접근 허용
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
    
    // 접근 거부 메시지 표시
    const container = document.querySelector('.container.mx-auto.px-4.py-12');
    if (container) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto text-center py-16">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <i class="fas fa-lock text-6xl text-gray-400 mb-6"></i>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">B2B 전용 서비스</h2>
                    <p class="text-lg text-gray-600 mb-6">
                        워크샵 서비스는 <strong>B2B 회원 전용</strong>입니다.
                    </p>
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
                        <h3 class="font-bold text-blue-800 mb-2">
                            <i class="fas fa-info-circle mr-2"></i>B2B 회원이란?
                        </h3>
                        <ul class="text-sm text-blue-700 space-y-1 ml-4">
                            <li>• 조향사 및 아로마 전문가</li>
                            <li>• 기업 고객 (복지, 교육 담당자)</li>
                            <li>• 매장 및 가게 운영자</li>
                            <li>• 독립 사업자</li>
                        </ul>
                    </div>
                    <div class="space-y-3">
                        <a href="/signup" class="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold">
                            <i class="fas fa-user-plus mr-2"></i>B2B 회원가입
                        </a>
                        <div class="text-gray-500 text-sm">
                            이미 B2B 회원이신가요? 
                            <a href="/login" class="text-purple-600 hover:underline font-semibold">로그인하기</a>
                        </div>
                        <div class="mt-4">
                            <a href="/dashboard" class="text-gray-600 hover:text-purple-600">
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
    
    container.innerHTML = filteredWorkshops.map(workshop => `
        <div class="workshop-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onclick="viewWorkshop(${workshop.id})">
            <!-- Image Placeholder -->
            <div class="h-48 bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center">
                ${workshop.image_url 
                    ? `<img src="${workshop.image_url}" alt="${workshop.title}" class="w-full h-full object-cover">`
                    : `<i class="fas fa-spa text-white text-5xl"></i>`
                }
            </div>
            
            <!-- Content -->
            <div class="p-4">
                <!-- Category Badge -->
                ${workshop.category 
                    ? `<span class="inline-block px-2 py-1 text-xs font-semibold bg-teal-100 text-teal-700 rounded-full mb-2">
                        ${workshop.category}
                    </span>`
                    : ''
                }
                
                <!-- Title -->
                <h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-2">${workshop.title}</h3>
                
                <!-- Description -->
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${workshop.description || '워크샵 설명이 없습니다.'}</p>
                
                <!-- Details -->
                <div class="space-y-2 text-sm text-gray-600 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-map-marker-alt w-5 text-teal-600"></i>
                        <span>${workshop.location}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-clock w-5 text-teal-600"></i>
                        <span>${workshop.duration ? `${workshop.duration}분` : '시간 미정'}</span>
                    </div>
                    ${workshop.max_participants 
                        ? `<div class="flex items-center">
                            <i class="fas fa-users w-5 text-teal-600"></i>
                            <span>최대 ${workshop.max_participants}명</span>
                        </div>`
                        : ''
                    }
                </div>
                
                <!-- Footer -->
                <div class="flex items-center justify-between pt-3 border-t">
                    <div>
                        <span class="text-2xl font-bold text-teal-600">${formatPrice(workshop.price)}</span>
                    </div>
                    <button onclick="event.stopPropagation(); viewWorkshop(${workshop.id})" class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                        자세히 보기
                    </button>
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
