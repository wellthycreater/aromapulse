// Checkout JavaScript - 간단한 토스페이먼츠 결제창 방식
let cart = [];
const DELIVERY_FEE = 3000;

// 토스페이먼츠 클라이언트 키 (테스트 키 - 테스트 결제)
// 실제 aromapulse 계정의 테스트 키
const TOSS_CLIENT_KEY = 'test_ck_PBal2vxj81yAPQdaR5PK85RQgOAN';

// 토스페이먼츠 객체 (페이지 로드 후 초기화)
let tossPayments = null;

// SDK 로드 대기 함수
function waitForTossPayments(maxWaitTime = 5000) {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 즉시 resolve
    if (typeof TossPayments !== 'undefined') {
      console.log('✅ TossPayments SDK 이미 로드됨');
      resolve();
      return;
    }
    
    console.log('⏳ TossPayments SDK 로드 대기 중...');
    const startTime = Date.now();
    
    const checkInterval = setInterval(() => {
      if (typeof TossPayments !== 'undefined') {
        clearInterval(checkInterval);
        console.log('✅ TossPayments SDK 로드 완료');
        resolve();
      } else if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval);
        console.error('❌ TossPayments SDK 로드 시간 초과');
        reject(new Error('TossPayments SDK 로드 실패 - 시간 초과'));
      }
    }, 100);
  });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ 체크아웃 페이지 로드 완료');
  
  try {
    // SDK 로드 대기
    await waitForTossPayments();
    console.log('✅ TossPayments SDK 로드 완료');
    
    // 토스페이먼츠 객체 생성
    tossPayments = TossPayments(TOSS_CLIENT_KEY);
    console.log('✅ 토스페이먼츠 객체 생성 완료');
    
    loadCartFromLocalStorage();
    
    if (cart.length === 0) {
      alert('장바구니가 비어있습니다');
      window.location.href = '/shop.html';
      return;
    }
    
    console.log('✅ 장바구니 데이터:', cart);
    
    renderOrderSummary();
  } catch (error) {
    console.error('❌ 결제 시스템 초기화 오류:', error);
    
    // 더 자세한 에러 메시지
    let errorMessage = '결제 시스템을 로드하는 중 오류가 발생했습니다.\n\n';
    errorMessage += '가능한 원인:\n';
    errorMessage += '• 네트워크 연결 문제\n';
    errorMessage += '• 광고 차단 프로그램\n';
    errorMessage += '• 브라우저 보안 설정\n\n';
    errorMessage += '해결 방법:\n';
    errorMessage += '1. 페이지를 새로고침해주세요\n';
    errorMessage += '2. 광고 차단 프로그램을 잠시 비활성화해주세요\n';
    errorMessage += '3. 다른 브라우저를 사용해보세요';
    
    alert(errorMessage);
    
    // 장바구니 페이지로 돌아가기 옵션 제공
    if (confirm('장바구니 페이지로 돌아가시겠습니까?')) {
      window.location.href = '/shop.html';
    }
  }
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

// 결제 처리 - 매우 간단해짐!
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
  
  // 토스페이먼츠 객체 확인
  if (!tossPayments) {
    alert('결제 시스템이 초기화되지 않았습니다.\n페이지를 새로고침해주세요.');
    console.error('❌ tossPayments 객체가 null입니다');
    return;
  }
  
  try {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + DELIVERY_FEE;
    
    // 주문번호를 백엔드에서 미리 발급받기
    console.log('📋 주문번호 발급 요청 중...');
    const orderNumberResponse = await fetch('/api/orders/generate-order-number');
    
    if (!orderNumberResponse.ok) {
      console.error('❌ 주문번호 발급 응답 실패:', orderNumberResponse.status);
      throw new Error(`주문번호 발급 실패 (HTTP ${orderNumberResponse.status})`);
    }
    
    const orderNumberData = await orderNumberResponse.json();
    console.log('📋 주문번호 발급 응답:', orderNumberData);
    
    if (!orderNumberData.success || !orderNumberData.order_number) {
      console.error('❌ 주문번호 발급 실패:', orderNumberData);
      throw new Error(orderNumberData.error || '주문번호 발급에 실패했습니다.');
    }
    
    const orderId = orderNumberData.order_number;
    console.log('✅ 주문번호 발급 완료:', orderId);
    
    console.log('🚀 결제 요청 시작:', {
      orderId,
      amount: totalAmount,
      customerName,
      customerEmail
    });
    
    console.log('💰 금액 계산:', {
      cart: cart,
      subtotal: subtotal,
      deliveryFee: DELIVERY_FEE,
      totalAmount: totalAmount
    });
    
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
      product_amount: subtotal,
      total_amount: subtotal,
      delivery_fee: DELIVERY_FEE,
      final_amount: totalAmount
    };
    
    console.log('📦 주문 데이터:', orderData);
    
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    
    // 토스페이먼츠 결제창 호출 (단 한 줄!)
    await tossPayments.requestPayment('카드', {
      amount: totalAmount,
      orderId: orderId,
      orderName: getOrderName(),
      customerName: customerName,
      customerEmail: customerEmail,
      customerMobilePhone: customerPhone,
      successUrl: `${window.location.origin}/static/payment-success.html`,
      failUrl: `${window.location.origin}/static/payment-fail.html`,
    });
    
    console.log('✅ 결제창 호출 성공');
    
  } catch (error) {
    console.error('❌ 결제 요청 오류:', error);
    
    // 더 자세한 에러 메시지 표시
    let errorMessage = '결제 요청 중 오류가 발생했습니다.\n\n';
    
    if (error.code === 'USER_CANCEL') {
      // 사용자가 결제창을 닫은 경우
      console.log('ℹ️ 사용자가 결제를 취소했습니다.');
      return; // alert 없이 그냥 종료
    } else if (error.message) {
      errorMessage += `오류: ${error.message}\n\n`;
    }
    
    errorMessage += '문제가 계속되면 고객센터로 문의해주세요.';
    alert(errorMessage);
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
