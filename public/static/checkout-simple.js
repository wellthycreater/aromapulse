// 초간단 결제 - 서버에서 모든 처리
let cart = [];
const DELIVERY_FEE = 3000;

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ 간단 결제 페이지 로드');
  
  loadCartFromLocalStorage();
  
  if (cart.length === 0) {
    alert('장바구니가 비어있습니다');
    window.location.href = '/shop.html';
    return;
  }
  
  renderOrderSummary();
});

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

// 주문 요약 렌더링
function renderOrderSummary() {
  const orderItemsEl = document.getElementById('order-items');
  const subtotalEl = document.getElementById('subtotal');
  const totalAmountEl = document.getElementById('total-amount');
  
  orderItemsEl.innerHTML = '';
  let subtotal = 0;
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'flex justify-between text-sm';
    itemEl.innerHTML = `
      <span class="text-gray-600">${item.name} x${item.quantity}</span>
      <span class="font-semibold">${itemTotal.toLocaleString()}원</span>
    `;
    orderItemsEl.appendChild(itemEl);
  });
  
  const totalAmount = subtotal + DELIVERY_FEE;
  
  subtotalEl.textContent = `${subtotal.toLocaleString()}원`;
  totalAmountEl.textContent = `${totalAmount.toLocaleString()}원`;
}

// 주소 검색
function searchAddress() {
  new daum.Postcode({
    oncomplete: function(data) {
      document.getElementById('customer-zipcode').value = data.zonecode;
      document.getElementById('customer-address').value = data.address;
      document.getElementById('customer-detail-address').focus();
    }
  }).open();
}

// 결제 처리 - 서버에 결제 요청
async function processPayment() {
  // 필수 정보 검증
  const customerName = document.getElementById('customer-name').value.trim();
  const customerEmail = document.getElementById('customer-email').value.trim();
  const customerPhone = document.getElementById('customer-phone').value.trim();
  const customerZipcode = document.getElementById('customer-zipcode').value.trim();
  const customerAddress = document.getElementById('customer-address').value.trim();
  const customerDetailAddress = document.getElementById('customer-detail-address').value.trim();
  const deliveryMessage = document.getElementById('delivery-message').value.trim();
  
  if (!customerName) {
    alert('이름을 입력해주세요');
    return;
  }
  
  if (!customerEmail) {
    alert('이메일을 입력해주세요');
    return;
  }
  
  if (!customerPhone) {
    alert('연락처를 입력해주세요');
    return;
  }
  
  if (!customerAddress) {
    alert('배송지 주소를 입력해주세요');
    searchAddress();
    return;
  }
  
  try {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + DELIVERY_FEE;
    
    console.log('🚀 서버에 결제 준비 요청...');
    
    const orderData = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_zipcode: customerZipcode,
      customer_address: customerAddress,
      customer_detail_address: customerDetailAddress,
      delivery_message: deliveryMessage,
      items: cart.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price
      })),
      total_amount: subtotal,
      delivery_fee: DELIVERY_FEE,
      final_amount: totalAmount
    };
    
    // sessionStorage에 저장
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    
    // 서버에 결제 준비 API 호출
    const response = await fetch('/api/orders/prepare-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error('결제 준비 요청 실패');
    }
    
    const result = await response.json();
    console.log('✅ 결제 준비 완료:', result);
    
    // 토스페이먼츠 결제창 URL로 리디렉트
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    } else {
      throw new Error('결제 URL을 받지 못했습니다');
    }
    
  } catch (error) {
    console.error('❌ 결제 요청 오류:', error);
    alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
  }
}
