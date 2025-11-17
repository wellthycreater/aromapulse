// 전역 변수
let currentProduct = null;

// URL에서 제품 ID 가져오기
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
    if (!productId) {
        alert('제품 ID가 없습니다.');
        window.location.href = '/shop';
        return;
    }

    await loadProductDetail();
    updateCartCount();
    initScrollHandler();
});

// 제품 상세 정보 로드
async function loadProductDetail() {
    try {
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error('제품 정보를 불러올 수 없습니다.');
        }

        const product = await response.json();
        currentProduct = product;

        // 카테고리 한글 변환
        const categoryMap = {
            'insomnia': '불면증',
            'depression': '우울증',
            'anxiety': '불안',
            'stress': '스트레스',
            'refresh': '리프레시',
            'symptom_care': '증상 케어'
        };

        // UI 업데이트
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-description').textContent = product.description || '향기로운 아로마 제품입니다.';
        document.getElementById('product-price').textContent = product.price.toLocaleString();
        document.getElementById('product-category').textContent = categoryMap[product.category] || product.category || '-';
        document.getElementById('product-volume').textContent = product.volume || '-';
        
        // 재고 표시
        const stockElement = document.getElementById('product-stock');
        if (product.stock > 0) {
            stockElement.textContent = `${product.stock}개 구매 가능`;
            stockElement.className = 'font-semibold text-green-600';
        } else {
            stockElement.textContent = '품절';
            stockElement.className = 'font-semibold text-red-600';
        }

        // 컨셉 뱃지
        const conceptBadge = document.getElementById('product-concept');
        if (product.concept === 'symptom_care') {
            conceptBadge.textContent = '증상 케어';
            conceptBadge.className = 'px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold';
        } else {
            conceptBadge.textContent = '리프레시';
            conceptBadge.className = 'px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold';
        }

        // 이미지 설정
        if (product.thumbnail_image) {
            document.getElementById('product-thumbnail').src = product.thumbnail_image;
        } else if (product.main_image) {
            document.getElementById('product-thumbnail').src = product.main_image;
        }

        if (product.detail_image) {
            document.getElementById('product-detail-image').src = product.detail_image;
        } else {
            document.getElementById('product-detail-image').parentElement.innerHTML = 
                '<div class="text-center py-20 text-gray-500"><i class="fas fa-image text-6xl mb-4"></i><p>상세 이미지가 준비 중입니다.</p></div>';
        }

        // 총 금액 초기화
        updateTotalPrice();

        // 로딩 숨기고 컨텐츠 표시
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('product-detail').classList.remove('hidden');
        document.getElementById('sticky-bar').classList.remove('hidden');

    } catch (error) {
        console.error('제품 로드 오류:', error);
        alert('제품 정보를 불러오는데 실패했습니다.');
        window.location.href = '/shop';
    }
}

// 수량 증가
function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    const stock = currentProduct.stock;

    if (currentValue < stock) {
        quantityInput.value = currentValue + 1;
        updateTotalPrice();
    } else {
        showToast('재고가 부족합니다.', 'error');
    }
}

// 수량 감소
function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);

    if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
        updateTotalPrice();
    }
}

// 총 금액 업데이트
function updateTotalPrice() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value);
    const total = currentProduct.price * quantity;
    document.getElementById('total-price').textContent = total.toLocaleString();
}

// 장바구니에 추가
function addToCart() {
    if (!currentProduct) return;

    const quantity = parseInt(document.getElementById('quantity').value);
    
    if (quantity > currentProduct.stock) {
        showToast('재고가 부족합니다.', 'error');
        return;
    }

    if (currentProduct.stock === 0) {
        showToast('품절된 상품입니다.', 'error');
        return;
    }

    // 로컬 스토리지에서 장바구니 가져오기
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // 이미 있는 상품인지 확인
    const existingIndex = cart.findIndex(item => item.id === currentProduct.id);

    if (existingIndex >= 0) {
        // 수량 업데이트
        cart[existingIndex].quantity += quantity;
    } else {
        // 새 상품 추가
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            quantity: quantity,
            image: currentProduct.thumbnail_image || currentProduct.main_image,
            concept: currentProduct.concept
        });
    }

    // 저장
    localStorage.setItem('cart', JSON.stringify(cart));

    // 알림 표시
    showToast('장바구니에 추가되었습니다!', 'success');
    updateCartCount();
}

// 바로 구매
function buyNow() {
    if (!currentProduct) return;

    const quantity = parseInt(document.getElementById('quantity').value);
    
    if (quantity > currentProduct.stock) {
        showToast('재고가 부족합니다.', 'error');
        return;
    }

    if (currentProduct.stock === 0) {
        showToast('품절된 상품입니다.', 'error');
        return;
    }

    // 장바구니에 추가
    addToCart();
    
    // 잠시 후 장바구니로 이동
    setTimeout(() => {
        window.location.href = '/static/cart';
    }, 500);
}

// 장바구니 개수 업데이트
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountEl = document.getElementById('cart-count');
    if (count > 0) {
        cartCountEl.textContent = count;
        cartCountEl.classList.remove('hidden');
    } else {
        cartCountEl.classList.add('hidden');
    }
}

// 탭 전환
function switchTab(tabName) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 모든 탭 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // 선택된 탭 활성화
    event.target.closest('.tab-button').classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

// 스크롤 핸들러 (하단 고정 바 표시/숨김)
function initScrollHandler() {
    let lastScroll = 0;
    const stickyBar = document.getElementById('sticky-bar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // 구매 버튼 영역을 지나면 하단 바 표시
        if (currentScroll > 800) {
            stickyBar.classList.remove('hidden');
        } else {
            stickyBar.classList.add('hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// 토스트 알림
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.className = 'fixed top-20 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[60] fade-in';
    } else {
        toast.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[60] fade-in';
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// 뒤로 가기
function goBack() {
    window.history.back();
}
