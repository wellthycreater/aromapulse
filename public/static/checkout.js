// Checkout JavaScript with Toss Payments SDK v2
let cart = [];
const DELIVERY_FEE = 3000;

// 토스페이먼츠 클라이언트 키 (실제 키)
const TOSS_CLIENT_KEY = 'test_ck_eqRGgYO1r56JgBPB9nnW8QnN2Eya';

let paymentWidget;
let customerKey; // 고객 고유 키

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
  loadCartFromLocalStorage();
  
  if (cart.length === 0) {
    alert('장바구니가 비어있습니다');
    window.location.href = '/shop.html';
    return;
  }
  
  renderOrderSummary();
  
  // 고객 고유 키 생성
  customerKey = `CUSTOMER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // 토스페이먼츠 결제 위젯 초기화
  await initializePaymentWidget();
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

// 주소 검색 (Daum 우편번호 API)
function searchAddress() {
  new daum.Postcode({
    oncomplete: function(data) {
      document.getElementById('customer-zipcode').value = data.zonecode;
      document.getElementById('customer-address').value = data.address;
      document.getElementById('customer-detail-address').focus();
    }
  }).open();
}

// 토스페이먼츠 결제 위젯 초기화 (SDK v2)
async function initializePaymentWidget() {
  try {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + DELIVERY_FEE;
    
    // 결제위젯 초기화
    paymentWidget = await loadPaymentWidget(TOSS_CLIENT_KEY, customerKey);
    
    // 결제 UI 렌더링
    await paymentWidget.renderPaymentMethods({
      selector: '#payment-method',
      variantKey: 'DEFAULT'
    }, {
      value: totalAmount,
      currency: 'KRW',
      region: 'KR'
    });
    
    // 이용약관 UI 렌더링
    await paymentWidget.renderAgreement({
      selector: '#agreement',
      variantKey: 'AGREEMENT'
    });
    
    console.log('토스페이먼츠 결제 위젯 초기화 완료');
    
  } catch (error) {
    console.error('결제 위젯 초기화 오류:', error);
    alert('결제 시스템 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
  }
}

// 결제 처리
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
    document.getElementById('customer-name').focus();
    return;
  }
  
  if (!customerEmail) {
    alert('이메일을 입력해주세요');
    document.getElementById('customer-email').focus();
    return;
  }
  
  if (!customerPhone) {
    alert('연락처를 입력해주세요');
    document.getElementById('customer-phone').focus();
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
    
    // 주문 ID 생성
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // 주문 정보를 sessionStorage에 임시 저장 (결제 성공 후 사용)
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
        quantity: item.quantity,
        unit_price: item.price
      })),
      total_amount: subtotal,
      delivery_fee: DELIVERY_FEE,
      final_amount: totalAmount
    };
    
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    
    // 토스페이먼츠 결제 요청 (SDK v2)
    await paymentWidget.requestPayment({
      orderId: orderId,
      orderName: getOrderName(),
      successUrl: `${window.location.origin}/static/payment-success.html`,
      failUrl: `${window.location.origin}/static/payment-fail.html`,
      customerEmail: customerEmail,
      customerName: customerName,
      customerMobilePhone: customerPhone
    });
    
  } catch (error) {
    console.error('결제 요청 오류:', error);
    if (error.message) {
      alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}

// 주문명 생성 (첫 번째 상품명 + 외 N건)
function getOrderName() {
  if (cart.length === 0) return '아로마펄스 주문';
  
  const firstName = cart[0].name;
  if (cart.length === 1) {
    return firstName;
  } else {
    return `${firstName} 외 ${cart.length - 1}건`;
  }
}
