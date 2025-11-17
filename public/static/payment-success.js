// Payment Success Handler

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentKey = urlParams.get('paymentKey');
  const orderId = urlParams.get('orderId');
  const amount = urlParams.get('amount');

  if (!paymentKey || !orderId || !amount) {
    showError('결제 정보가 올바르지 않습니다.');
    return;
  }

  // sessionStorage에서 주문 데이터 가져오기
  const orderDataStr = sessionStorage.getItem('orderData');
  if (!orderDataStr) {
    showError('주문 정보를 찾을 수 없습니다.');
    return;
  }

  const orderData = JSON.parse(orderDataStr);

  try {
    console.log('📋 결제 승인 API 호출 시작');
    console.log('요청 데이터:', { paymentKey, orderId, amount: parseInt(amount), orderData });
    
    // 결제 승인 API 호출
    const response = await fetch('/api/orders/confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
        orderData
      })
    });

    console.log('📋 결제 승인 API 응답 상태:', response.status);
    const result = await response.json();
    console.log('📋 결제 승인 API 응답 데이터:', result);

    if (!response.ok) {
      console.error('❌ 결제 승인 실패:', result);
      console.error('❌ 에러 상세:', {
        error: result.error,
        details: result.details,
        code: result.code,
        message: result.message
      });
      throw new Error(result.details || result.message || result.error || '결제 승인 실패');
    }

    // 성공 처리
    console.log('✅ 결제 승인 성공');
    showSuccess(result, orderData);

    // sessionStorage 및 localStorage 정리
    sessionStorage.removeItem('orderData');
    localStorage.removeItem('cart');

  } catch (error) {
    console.error('❌ 결제 승인 오류:', error);
    
    // 에러 상세 정보 수집
    const errorDetails = {
      message: error.message,
      paymentKey: paymentKey ? paymentKey.substring(0, 20) + '...' : 'N/A',
      orderId: orderId || 'N/A',
      amount: amount || 'N/A'
    };
    
    showError(error.message, errorDetails);
  }
});

function showSuccess(data, orderData) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('success-state').classList.remove('hidden');

  // 주문 정보 표시
  document.getElementById('order-number').textContent = data.order_number || '-';
  
  // final_amount는 orderData나 data에서 가져오기
  const finalAmount = data.final_amount || orderData.final_amount || orderData.total_amount || 0;
  document.getElementById('payment-amount').textContent = `${finalAmount.toLocaleString()}원`;
  
  document.getElementById('payment-method').textContent = 
    getPaymentMethodName(data.payment_method || 'CARD');
}

function showError(message, details = null) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  
  let errorHtml = message;
  if (details) {
    errorHtml += '<br><br><small style="color: #999; font-size: 12px;">상세 정보:<br>' + 
                 JSON.stringify(details, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;') + 
                 '</small>';
  }
  
  document.getElementById('error-message').innerHTML = errorHtml;
}

function getPaymentMethodName(method) {
  const methods = {
    'CARD': '신용/체크카드',
    'VIRTUAL_ACCOUNT': '가상계좌',
    'TRANSFER': '계좌이체',
    'MOBILE_PHONE': '휴대폰',
    'CULTURE_GIFT_CERTIFICATE': '문화상품권',
    'BOOK_GIFT_CERTIFICATE': '도서문화상품권',
    'GAME_GIFT_CERTIFICATE': '게임문화상품권'
  };
  return methods[method] || method;
}
