// Shopping Mall JavaScript
let allProducts = [];
let cart = [];
let currentCategory = 'all';

// 배송비 설정 (개발/테스트용: 무료)
const BASE_DELIVERY_FEE = 0; // 기본 배송비 (테스트용: 0원, 프로덕션: 3000원)
const FREE_DELIVERY_THRESHOLD = 50000; // 무료 배송 기준 금액 (5만원)

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
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(`cat-${category}`);
  activeBtn.classList.add('active');
  
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
  
  // 제품 개수 업데이트
  const countEl = document.getElementById('product-count');
  if (countEl) {
    countEl.textContent = products.length;
  }
  
  if (products.length === 0) {
    document.getElementById('empty-state').style.display = 'block';
    return;
  }
  
  document.getElementById('empty-state').style.display = 'none';
  
  products.forEach((product, index) => {
    const card = createProductCard(product);
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in-up');
    gridEl.appendChild(card);
  });
}

// 제품 카드 생성
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card bg-white rounded-3xl shadow-xl overflow-hidden relative group';
  
  const thumbnailUrl = product.thumbnail_image || 'https://via.placeholder.com/400x400?text=No+Image';
  
  const conceptBadge = product.concept === 'refresh'
    ? '<div class="absolute top-5 left-5 z-10"><span class="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black rounded-full shadow-2xl badge-glow flex items-center space-x-2"><i class="fas fa-spray-can"></i><span>리프레시</span></span></div>'
    : '<div class="absolute top-5 left-5 z-10"><span class="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-black rounded-full shadow-2xl badge-glow flex items-center space-x-2"><i class="fas fa-heart-pulse"></i><span>증상 케어</span></span></div>';
  
  const stockOverlay = product.stock > 0 
    ? '' 
    : '<div class="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40 backdrop-blur-sm flex items-center justify-center z-20"><div class="text-center"><span class="bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-2xl inline-block"><i class="fas fa-times-circle mr-2"></i>품절</span></div></div>';
  
  card.innerHTML = `
    <div class="relative overflow-hidden h-72 bg-gradient-to-br from-purple-50 to-pink-50">
      <img src="${thumbnailUrl}" alt="${product.name}" class="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-3">
      ${conceptBadge}
      ${stockOverlay}
      <div class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"></div>
    </div>
    <div class="p-6">
      <h3 class="font-black text-xl mb-3 text-gray-800 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 leading-tight">${product.name}</h3>
      <p class="text-sm text-gray-500 mb-5 line-clamp-2 leading-relaxed">${product.description || '프리미엄 아로마 제품으로 특별한 힐링을 경험하세요.'}</p>
      
      <div class="flex items-baseline justify-between mb-6 pb-5 border-b-2 border-gray-100">
        <div class="flex items-baseline space-x-1">
          <span class="text-4xl font-black price-tag">${product.price.toLocaleString()}</span>
          <span class="text-lg text-gray-500 font-semibold">원</span>
        </div>
        ${product.stock > 0 
          ? `<div class="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs font-bold">재고 있음</span>
            </div>`
          : `<div class="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-full">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span class="text-xs font-bold">품절</span>
            </div>`
        }
      </div>
      
      <div class="grid grid-cols-3 gap-2">
        <button onclick="viewProductDetail(${product.id})" class="bg-gray-100 text-gray-700 px-3 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
          <i class="fas fa-search-plus text-sm"></i>
        </button>
        <button onclick="quickBooking(${product.id})" ${product.stock <= 0 ? 'disabled' : ''} 
          class="bg-pink-600 text-white px-3 py-3 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center">
          <i class="fas fa-calendar-check text-sm"></i>
        </button>
        <button onclick="addToCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''} 
          class="btn-primary text-white px-3 py-3 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center">
          <i class="fas fa-shopping-cart text-sm"></i>
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// 제품 상세보기
function viewProductDetail(productId) {
  window.location.href = `/static/product-detail?id=${productId}`;
}

// 빠른 예약 - 예약 모달 열기
function quickBooking(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) {
    alert('상품 정보를 찾을 수 없습니다.');
    return;
  }
  
  // 새로운 예약 시스템 사용 (reservation-booking.js)
  if (window.reservationBooking) {
    window.reservationBooking.openModal(
      'product',
      productId,
      product.name,
      product.price
    );
  } else {
    console.error('예약 시스템이 로드되지 않았습니다.');
    alert('예약 시스템을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
  }
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
  const emptyCartEl = document.getElementById('empty-cart');
  const cartSummaryEl = document.getElementById('cart-summary');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');
  
  // 장바구니 개수
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;
  
  // 장바구니 비어있음
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '';
    emptyCartEl.style.display = 'block';
    cartSummaryEl.style.display = 'none';
    return;
  }
  
  emptyCartEl.style.display = 'none';
  cartSummaryEl.style.display = 'block';
  
  // 장바구니 아이템 렌더링
  cartItemsEl.innerHTML = '';
  let subtotal = 0;
  
  cart.forEach((item, index) => {
    subtotal += item.price * item.quantity;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'flex items-center gap-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300';
    itemEl.innerHTML = `
      <div class="relative">
        <img src="${item.thumbnail_image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="w-24 h-24 object-cover rounded-xl shadow-lg">
        <div class="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">${item.quantity}</div>
      </div>
      <div class="flex-1">
        <h4 class="font-black text-gray-800 mb-2 leading-tight">${item.name}</h4>
        <p class="text-2xl font-black price-tag mb-3">${item.price.toLocaleString()}원</p>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm">
            <button onclick="updateQuantity(${index}, ${item.quantity - 1})" class="text-gray-500 hover:text-purple-600 transition-colors transform hover:scale-110">
              <i class="fas fa-minus text-sm"></i>
            </button>
            <span class="font-black text-gray-800 min-w-[24px] text-center text-lg">${item.quantity}</span>
            <button onclick="updateQuantity(${index}, ${item.quantity + 1})" class="text-gray-500 hover:text-purple-600 transition-colors transform hover:scale-110">
              <i class="fas fa-plus text-sm"></i>
            </button>
          </div>
          <button onclick="removeFromCart(${index})" class="ml-auto text-red-500 hover:text-red-700 transition-all transform hover:scale-110 p-2">
            <i class="fas fa-trash-alt text-lg"></i>
          </button>
        </div>
      </div>
    `;
    
    cartItemsEl.appendChild(itemEl);
  });
  
  // 배송비 계산 (5만원 이상 무료)
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : BASE_DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  
  console.log('🛒 장바구니 배송비 계산:', {
    subtotal,
    FREE_DELIVERY_THRESHOLD,
    deliveryFee,
    total,
    isFreeShipping: subtotal >= FREE_DELIVERY_THRESHOLD
  });
  
  // UI 업데이트
  subtotalEl.textContent = `${subtotal.toLocaleString()}원`;
  
  // 배송비 표시
  const shippingEl = document.getElementById('shipping');
  if (shippingEl) {
    if (deliveryFee === 0) {
      shippingEl.innerHTML = '<span class="text-green-600 font-bold">무료</span>';
    } else {
      shippingEl.innerHTML = `<span class="text-gray-600">${deliveryFee.toLocaleString()}원</span>`;
    }
  }
  
  totalEl.textContent = `${total.toLocaleString()}원`;
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

// 사용자 메뉴 처리
function handleUserMenu() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // 로그인 안 되어 있으면 로그인 페이지로
    window.location.href = '/login';
    return;
  }
  
  // 로그인 되어 있으면 프로필 페이지로
  window.location.href = '/profile';
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
