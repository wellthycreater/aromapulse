// Workshops page JavaScript

let allWorkshops = [];
let filteredWorkshops = [];
let currentPriceFilter = 'all';

// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadWorkshops();
});

// 인증 확인
function checkAuth() {
    const token = localStorage.getItem('token');
    const authLink = document.getElementById('auth-link');
    
    if (token) {
        authLink.textContent = '대시보드';
        authLink.href = '/dashboard';
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
