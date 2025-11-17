// 장바구니 데이터
let cart = [];
const DELIVERY_FEE = 3000;
const FREE_DELIVERY_THRESHOLD = 30000;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();
});

// 로컬 스토리지에서 장바구니 로드
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }
}

// 로컬 스토리지에 장바구니 저장
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// 장바구니 렌더링
function renderCart() {
    const cartItemsEl = document.getElementById('cart-items');
    const emptyCartEl = document.getElementById('empty-cart');
    const cartContentEl = document.getElementById('cart-content');
    
    // 장바구니가 비어있는 경우
    if (!cart || cart.length === 0) {
        emptyCartEl.classList.remove('hidden');
        cartContentEl.classList.add('hidden');
        return;
    }
    
    emptyCartEl.classList.add('hidden');
    cartContentEl.classList.remove('hidden');
    
    // 장바구니 아이템 렌더링
    cartItemsEl.innerHTML = '';
    cart.forEach((item, index) => {
        const itemEl = createCartItemElement(item, index);
        cartItemsEl.appendChild(itemEl);
    });
    
    // 총 상품 개수 업데이트
    document.getElementById('total-items').textContent = cart.length;
    
    // 주문 요약 업데이트
    updateOrderSummary();
}

// 장바구니 아이템 요소 생성
function createCartItemElement(item, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'border rounded-lg p-4 hover:shadow-md transition-shadow';
    
    const itemTotal = item.price * item.quantity;
    
    itemDiv.innerHTML = `
        <div class="flex gap-4">
            <!-- 제품 이미지 -->
            <div class="w-24 h-24 flex-shrink-0">
                <img src="${item.image || 'https://via.placeholder.com/96'}" 
                     alt="${item.name}" 
                     class="w-full h-full object-cover rounded-lg">
            </div>
            
            <!-- 제품 정보 -->
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-gray-800 line-clamp-2">${item.name}</h3>
                    <button onclick="removeItem(${index})" 
                        class="text-gray-400 hover:text-red-500 ml-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="text-sm text-gray-500 mb-3 space-y-1">
                    <p>${item.concept === 'refresh' ? '리프레시' : '증상 케어'}</p>
                    ${item.volume ? `<p class="text-purple-600 font-semibold"><i class="fas fa-flask mr-1"></i>용량: ${item.volume}</p>` : ''}
                </div>
                
                <div class="flex items-center justify-between">
                    <!-- 수량 조절 -->
                    <div class="flex items-center border rounded-lg">
                        <button onclick="decreaseQuantity(${index})" 
                            class="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" value="${item.quantity}" min="1" 
                            class="w-16 text-center border-x py-2" 
                            readonly>
                        <button onclick="increaseQuantity(${index})" 
                            class="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <!-- 가격 -->
                    <div class="text-right">
                        <p class="text-sm text-gray-500">${item.price.toLocaleString()}원 x ${item.quantity}</p>
                        <p class="text-lg font-bold text-purple-600">${itemTotal.toLocaleString()}원</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return itemDiv;
}

// 수량 증가
function increaseQuantity(index) {
    if (cart[index]) {
        cart[index].quantity += 1;
        saveCart();
        renderCart();
    }
}

// 수량 감소
function decreaseQuantity(index) {
    if (cart[index] && cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        saveCart();
        renderCart();
    } else if (cart[index] && cart[index].quantity === 1) {
        // 수량이 1일 때 감소하면 삭제 확인
        if (confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
            removeItem(index);
        }
    }
}

// 아이템 제거
function removeItem(index) {
    if (confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
        cart.splice(index, 1);
        saveCart();
        renderCart();
        showToast('상품이 장바구니에서 제거되었습니다.');
    }
}

// 장바구니 전체 비우기
function clearCart() {
    if (cart.length === 0) {
        showToast('장바구니가 이미 비어있습니다.');
        return;
    }
    
    if (confirm('장바구니를 모두 비우시겠습니까?')) {
        cart = [];
        saveCart();
        renderCart();
        showToast('장바구니가 비워졌습니다.');
    }
}

// 주문 요약 업데이트
function updateOrderSummary() {
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const totalAmount = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = `${subtotal.toLocaleString()}원`;
    document.getElementById('delivery-fee').textContent = deliveryFee === 0 
        ? '무료' 
        : `${deliveryFee.toLocaleString()}원`;
    document.getElementById('total-amount').textContent = `${totalAmount.toLocaleString()}원`;
}

// 결제 페이지로 이동
function proceedToCheckout() {
    if (!cart || cart.length === 0) {
        showToast('장바구니에 상품이 없습니다.');
        return;
    }
    
    // 장바구니 데이터를 다시 저장 (최신 상태 확인)
    saveCart();
    
    // 결제 페이지로 이동
    window.location.href = '/checkout';
}

// 토스트 알림 표시
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    
    // 타입에 따라 색상 변경
    if (type === 'error') {
        toast.className = 'fixed top-20 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    } else {
        toast.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
