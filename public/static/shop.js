// Global state
let currentTab = 'all';
let allProducts = [];
let filteredProducts = [];
let cart = [];

// Auth check
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            document.getElementById('auth-buttons').style.display = 'none';
            document.getElementById('user-info').style.display = 'flex';
            document.getElementById('user-name').textContent = payload.name || payload.email;
        } catch (e) {
            console.error('Token parse error:', e);
        }
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    location.href = '/login';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCart();
    loadProducts();
});

// Load products from API
async function loadProducts() {
    try {
        const response = await axios.get('/api/admin-products/public');
        console.log('Products loaded:', response.data);
        
        // API returns { products: [...] } - already filtered for is_active = 1
        if (response.data && response.data.products && Array.isArray(response.data.products)) {
            allProducts = response.data.products;
        } else {
            allProducts = [];
        }
        
        updateCounts();
        filterAndRenderProducts();
        
    } catch (error) {
        console.error('제품 로드 오류:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';
    }
}

// Update product counts
function updateCounts() {
    const symptomCareCount = allProducts.filter(p => p.concept === 'symptom_care').length;
    const refreshCount = allProducts.filter(p => p.concept === 'refresh').length;
    
    document.getElementById('count-all').textContent = allProducts.length;
    document.getElementById('count-symptom-care').textContent = symptomCareCount;
    document.getElementById('count-refresh').textContent = refreshCount;
}

// Switch tab
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab styles
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-purple-600', 'text-purple-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.getElementById(`tab-${tab}`);
    activeTab.classList.add('active', 'border-purple-600', 'text-purple-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    
    filterAndRenderProducts();
}

// Filter and render products
function filterAndRenderProducts() {
    // Filter by tab
    if (currentTab === 'all') {
        filteredProducts = [...allProducts];
    } else if (currentTab === 'symptom_care') {
        filteredProducts = allProducts.filter(p => p.concept === 'symptom_care');
    } else if (currentTab === 'refresh') {
        filteredProducts = allProducts.filter(p => p.concept === 'refresh');
    }
    
    // Apply sorting
    sortProducts();
}

// Sort products
function sortProducts() {
    const sortValue = document.getElementById('sort-select').value;
    
    switch(sortValue) {
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    renderProducts();
}

// Render products
function renderProducts() {
    const gridEl = document.getElementById('products-grid');
    const loadingEl = document.getElementById('loading');
    const emptyEl = document.getElementById('empty-state');
    
    loadingEl.style.display = 'none';
    
    if (filteredProducts.length === 0) {
        emptyEl.style.display = 'block';
        gridEl.innerHTML = '';
        document.getElementById('total-count').textContent = '0';
        return;
    }
    
    emptyEl.style.display = 'none';
    document.getElementById('total-count').textContent = filteredProducts.length;
    
    gridEl.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

// Create product card HTML
function createProductCard(product) {
    const isSymptomCare = product.concept === 'symptom_care';
    const isRefresh = product.concept === 'refresh';
    
    // Stock badge
    let stockBadge = '';
    if (product.stock === 0) {
        stockBadge = '<span class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">품절</span>';
    } else if (product.stock < 10) {
        stockBadge = `<span class="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">재고 ${product.stock}개</span>`;
    }
    
    // Concept badge
    const conceptBadge = isSymptomCare 
        ? '<span class="inline-block bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full mb-2"><i class="fas fa-heart-pulse mr-1"></i>증상케어</span>'
        : '<span class="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full mb-2"><i class="fas fa-spray-can mr-1"></i>리프레시</span>';
    
    // Category or type info
    let categoryInfo = '';
    if (isSymptomCare && product.category) {
        const categoryMap = {
            'insomnia': '불면',
            'depression': '우울',
            'anxiety': '불안',
            'stress': '스트레스'
        };
        categoryInfo = `<p class="text-sm text-gray-600 mb-1"><i class="fas fa-tag mr-1"></i>${categoryMap[product.category] || product.category}</p>`;
    } else if (isRefresh && product.refresh_type) {
        const typeMap = {
            'fabric_perfume': '섬유 향수',
            'room_spray': '룸 스프레이',
            'fabric_deodorizer': '섬유 탈취제',
            'diffuser': '디퓨저',
            'candle': '캔들',
            'perfume': '향수'
        };
        categoryInfo = `<p class="text-sm text-gray-600 mb-1"><i class="fas fa-spray-can mr-1"></i>${typeMap[product.refresh_type] || product.refresh_type}</p>`;
    }
    
    // Volume info for refresh products
    let volumeInfo = '';
    if (isRefresh && product.volume) {
        volumeInfo = `<p class="text-sm text-gray-600 mb-2"><i class="fas fa-flask mr-1"></i>용량: ${product.volume}</p>`;
    }
    
    // Workshop info for symptom care products
    let workshopInfo = '';
    if (isSymptomCare && product.workshop_name) {
        workshopInfo = `
            <div class="mt-2 pt-2 border-t border-gray-200">
                <p class="text-xs text-gray-500 mb-1"><i class="fas fa-home mr-1"></i><strong>공방:</strong> ${product.workshop_name}</p>
                ${product.workshop_location ? `<p class="text-xs text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>${product.workshop_location}</p>` : ''}
            </div>
        `;
    }
    
    // Image
    const imageUrl = product.thumbnail_image || product.detail_image || '/static/placeholder-product.png';
    
    // Price format
    const priceFormatted = product.price.toLocaleString('ko-KR');
    
    // Buy button
    const buyButton = product.stock > 0 
        ? `<button onclick="addToCart(${product.id})" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
               <i class="fas fa-shopping-cart mr-2"></i>장바구니 담기
           </button>`
        : `<button disabled class="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed">
               품절
           </button>`;
    
    return `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden relative">
            ${stockBadge}
            <div class="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                <img src="${imageUrl}" alt="${product.name}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='/static/placeholder-product.png'">
            </div>
            <div class="p-4">
                ${conceptBadge}
                <h3 class="text-lg font-bold text-gray-800 mb-2">${product.name}</h3>
                ${categoryInfo}
                ${volumeInfo}
                ${product.description ? `<p class="text-sm text-gray-600 mb-3 line-clamp-2">${product.description}</p>` : ''}
                <div class="flex items-center justify-between mb-3">
                    <span class="text-2xl font-bold text-purple-600">${priceFormatted}원</span>
                </div>
                ${workshopInfo}
                <div class="mt-3">
                    ${buyButton}
                </div>
            </div>
        </div>
    `;
}

// Cart functions
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartBadge();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product || product.stock === 0) {
        alert('죄송합니다. 해당 제품은 품절되었습니다.');
        return;
    }
    
    // Check if already in cart
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
            saveCart();
            alert('장바구니에 추가되었습니다!');
        } else {
            alert('재고가 부족합니다.');
        }
    } else {
        cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            thumbnail: product.thumbnail_image,
            quantity: 1,
            maxStock: product.stock
        });
        saveCart();
        alert('장바구니에 추가되었습니다!');
    }
}
