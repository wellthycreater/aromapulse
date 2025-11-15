// Shopping Mall JavaScript
let allProducts = [];
let cart = [];
let currentCategory = 'all';

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadCartFromLocalStorage();
  updateCartUI();
});

// 제품 목록 로드
async function loadProducts() {
  const loadingEl = document.getElementById('loading');
  const gridEl = document.getElementById('products-grid');
  
  loadingEl.style.display = 'block';
  gridEl.innerHTML = '';
  
  try {
    const response = await fetch('/api/admin-products/public');
    
    if (!response.ok) {
      throw new Error('제품 로드 실패');
    }
    
    const data = await response.json();
    allProducts = data.products || [];
    
    loadingEl.style.display = 'none';
    
    filterAndRenderProducts();
    
  } catch (error) {
    console.error('제품 로드 오류:', error);
    loadingEl.style.display = 'none';
    document.getElementById('empty-state').style.display = 'block';
  }
}

// 카테고리 전환
function switchCategory(category) {
  currentCategory = category;
  
  // 버튼 스타일 업데이트
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('text-purple-600', 'border-b-4', 'border-purple-600');
    btn.classList.add('text-gray-500');
  });
  
  const activeBtn = document.getElementById(`cat-${category}`);
  activeBtn.classList.add('text-purple-600', 'border-b-4', 'border-purple-600');
  activeBtn.classList.remove('text-gray-500');
  
  filterAndRenderProducts();
}

// 제품 필터링 및 렌더링
function filterAndRenderProducts() {
  let products = allProducts;
  
  // 카테고리 필터
  if (currentCategory !== 'all') {
    products = products.filter(p => p.concept === currentCategory);
  }
  
  const gridEl = document.getElementById('products-grid');
  gridEl.innerHTML = '';
  
  if (products.length === 0) {
    document.getElementById('empty-state').style.display = 'block';
    return;
  }
  
  document.getElementById('empty-state').style.display = 'none';
  
  products.forEach(product => {
    const card = createProductCard(product);
    gridEl.appendChild(card);
  });
}

// 제품 카드 생성
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:scale-105';
  
  const thumbnailUrl = product.thumbnail_image || 'https://via.placeholder.com/400x400?text=No+Image';
  
  const conceptBadge = product.concept === 'refresh'
    ? '<span class="absolute top-2 left-2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">리프레시</span>'
    : '<span class="absolute top-2 left-2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">증상 케어</span>';
  
  card.innerHTML = `
    <div class="relative">
      <img src="${thumbnailUrl}" alt="${product.name}" class="w-full h-64 object-cover">
      ${conceptBadge}
    </div>
    <div class="p-5">
      <h3 class="font-bold text-lg mb-2 text-gray-800 line-clamp-2">${product.name}</h3>
      <p class="text-sm text-gray-600 mb-4 line-clamp-2">${product.description || '상세한 제품 정보는 상세 페이지에서 확인하세요.'}</p>
      <div class="flex items-center justify-between mb-4">
        <span class="text-2xl font-bold text-purple-600">${product.price.toLocaleString()}원</span>
        ${product.stock > 0 
          ? `<span class="text-sm text-green-600"><i class="fas fa-check-circle mr-1"></i>재고 있음</span>`
          : `<span class="text-sm text-red-600"><i class="fas fa-times-circle mr-1"></i>품절</span>`
        }
      </div>
      <div class="flex gap-2">
        <button onclick="viewProductDetail(${product.id})" class="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-300">
          <i class="fas fa-info-circle mr-1"></i>상세보기
        </button>
        <button onclick="addToCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''} 
          class="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
          <i class="fas fa-cart-plus mr-1"></i>담기
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// 제품 상세보기
function viewProductDetail(productId) {
  window.location.href = `/product.html?id=${productId}`;
}

// 장바구니에 추가
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  // 이미 장바구니에 있는지 확인
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      thumbnail_image: product.thumbnail_image,
      quantity: 1,
      stock: product.stock
    });
  }
  
  saveCartToLocalStorage();
  updateCartUI();
  
  // 애니메이션 효과
  showNotification('장바구니에 추가되었습니다! 🛒');
}

// 장바구니 토글
function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  if (sidebar.classList.contains('hidden')) {
    sidebar.classList.remove('hidden');
    overlay.classList.remove('hidden');
  } else {
    sidebar.classList.add('hidden');
    overlay.classList.add('hidden');
  }
}

// 장바구니 UI 업데이트
function updateCartUI() {
  const cartItemsEl = document.getElementById('cart-items');
  const cartCountEl = document.getElementById('cart-count');
  const cartTotalEl = document.getElementById('cart-total');
  
  // 장바구니 개수
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;
  
  // 장바구니 비어있음
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-shopping-cart text-6xl mb-4"></i>
        <p>장바구니가 비어있습니다</p>
      </div>
    `;
    cartTotalEl.textContent = '0원';
    return;
  }
  
  // 장바구니 아이템 렌더링
  cartItemsEl.innerHTML = '';
  let total = 0;
  
  cart.forEach((item, index) => {
    total += item.price * item.quantity;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'flex items-center gap-4 border-b pb-4';
    itemEl.innerHTML = `
      <img src="${item.thumbnail_image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
      <div class="flex-1">
        <h4 class="font-semibold text-gray-800 mb-1">${item.name}</h4>
        <p class="text-purple-600 font-bold">${item.price.toLocaleString()}원</p>
        <div class="flex items-center gap-2 mt-2">
          <button onclick="updateQuantity(${index}, ${item.quantity - 1})" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
            <i class="fas fa-minus"></i>
          </button>
          <span class="font-semibold">${item.quantity}</span>
          <button onclick="updateQuantity(${index}, ${item.quantity + 1})" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
            <i class="fas fa-plus"></i>
          </button>
          <button onclick="removeFromCart(${index})" class="ml-auto text-red-500 hover:text-red-700">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    cartItemsEl.appendChild(itemEl);
  });
  
  cartTotalEl.textContent = `${total.toLocaleString()}원`;
}

// 수량 업데이트
function updateQuantity(index, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(index);
    return;
  }
  
  const item = cart[index];
  if (newQuantity > item.stock) {
    showNotification(`재고가 부족합니다. (재고: ${item.stock}개)`);
    return;
  }
  
  cart[index].quantity = newQuantity;
  saveCartToLocalStorage();
  updateCartUI();
}

// 장바구니에서 제거
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCartToLocalStorage();
  updateCartUI();
  showNotification('장바구니에서 제거되었습니다');
}

// 결제 진행
function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification('장바구니가 비어있습니다');
    return;
  }
  
  // 결제 페이지로 이동
  window.location.href = '/checkout.html';
}

// 로컬스토리지에 장바구니 저장
function saveCartToLocalStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// 로컬스토리지에서 장바구니 로드
function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }
}

// 알림 표시
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
  notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 제품 섹션으로 스크롤
function scrollToProducts() {
  const productsSection = document.getElementById('products-grid');
  productsSection.scrollIntoView({ behavior: 'smooth' });
}

// 사용자 메뉴 토글
function toggleUserMenu() {
  // TODO: 사용자 메뉴 구현
  alert('사용자 메뉴 준비 중입니다');
}
