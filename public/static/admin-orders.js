// 주문 관리 JavaScript

let currentPage = 1;
const itemsPerPage = 20;
let allOrders = [];
let filteredOrders = [];

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
  // 관리자 인증 체크 (하위 호환성 지원)
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  if (!token) {
    alert('관리자 로그인이 필요합니다.');
    window.location.href = '/static/admin-login.html';
    return;
  }

  await loadOrders();
});

// 주문 목록 로드
async function loadOrders() {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    // 필터 값 가져오기
    const orderStatus = document.getElementById('order-status-filter').value;
    const paymentStatus = document.getElementById('payment-status-filter').value;
    const searchQuery = document.getElementById('search-input').value;

    // URL 파라미터 구성
    const params = new URLSearchParams();
    if (orderStatus) params.append('order_status', orderStatus);
    if (paymentStatus) params.append('payment_status', paymentStatus);
    if (searchQuery) params.append('search', searchQuery);
    params.append('page', currentPage.toString());
    params.append('limit', itemsPerPage.toString());

    const response = await fetch(`/api/orders/admin/list?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('주문 목록 로드 실패');
    }

    const data = await response.json();
    allOrders = data.orders || [];
    filteredOrders = allOrders;

    renderOrdersTable();
    updateStatistics();
    updatePagination(data.total || 0);

  } catch (error) {
    console.error('주문 로드 오류:', error);
    showNotification('주문 목록을 불러오는데 실패했습니다.', 'error');
  }
}

// 주문 테이블 렌더링
function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  
  if (filteredOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-4xl mb-2"></i>
          <p>주문 내역이 없습니다.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredOrders.map(order => {
    const createdAt = new Date(order.created_at);
    const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`;

    return `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-3">
          <div class="font-semibold text-blue-600">${order.order_number}</div>
          ${getFulfillmentTypeBadge(order.fulfillment_type)}
          ${order.fulfillment_type === 'workshop' && order.workshop_order_status ? `<div class="mt-1">${getWorkshopStatusBadge(order.workshop_order_status)}</div>` : ''}
        </td>
        <td class="px-4 py-3">
          <div class="font-medium">${order.customer_name}</div>
          <div class="text-xs text-gray-500">${order.customer_email}</div>
          <div class="text-xs text-gray-500">${order.customer_phone}</div>
        </td>
        <td class="px-4 py-3">
          <div class="font-semibold">${(order.total_amount || order.final_amount)?.toLocaleString()}원</div>
          <div class="text-xs text-gray-500">상품: ${order.product_amount?.toLocaleString()}원</div>
          <div class="text-xs text-gray-500">배송비: ${order.delivery_fee?.toLocaleString()}원</div>
        </td>
        <td class="px-4 py-3">
          ${getPaymentStatusBadge(order.payment_status)}
          ${order.paid_at ? `<div class="text-xs text-gray-500 mt-1">${new Date(order.paid_at).toLocaleString('ko-KR')}</div>` : ''}
        </td>
        <td class="px-4 py-3">
          ${getOrderStatusBadge(order.order_status)}
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">
          ${formattedDate}
        </td>
        <td class="px-4 py-3">
          <button onclick="viewOrderDetail(${order.id})" 
              class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-1">
            <i class="fas fa-eye"></i> 상세
          </button>
          <button onclick="deleteOrder(${order.id}, '${order.order_number}')" 
              class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
            <i class="fas fa-trash"></i> 삭제
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 결제 상태 뱃지
function getPaymentStatusBadge(status) {
  const badges = {
    'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold"><i class="fas fa-clock mr-1"></i>결제 대기</span>',
    'paid': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i class="fas fa-check-circle mr-1"></i>결제 완료</span>',
    'failed': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold"><i class="fas fa-times-circle mr-1"></i>결제 실패</span>',
    'cancelled': '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold"><i class="fas fa-ban mr-1"></i>결제 취소</span>',
    'refunded': '<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold"><i class="fas fa-undo mr-1"></i>환불 완료</span>'
  };
  return badges[status] || status;
}

// 주문 상태 뱃지
function getOrderStatusBadge(status) {
  const badges = {
    'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold"><i class="fas fa-hourglass-half mr-1"></i>주문 접수</span>',
    'confirmed': '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"><i class="fas fa-check mr-1"></i>주문 확인</span>',
    'preparing': '<span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold"><i class="fas fa-box mr-1"></i>상품 준비중</span>',
    'shipped': '<span class="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold"><i class="fas fa-truck mr-1"></i>배송중</span>',
    'delivered': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i class="fas fa-check-double mr-1"></i>배송 완료</span>',
    'cancelled': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold"><i class="fas fa-ban mr-1"></i>주문 취소</span>'
  };
  return badges[status] || status;
}

// 이행 타입 뱃지 (자사 직접 배송 vs 공방 위탁)
function getFulfillmentTypeBadge(type) {
  const badges = {
    'direct': '<span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"><i class="fas fa-home mr-1"></i>자사 배송</span>',
    'workshop': '<span class="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium"><i class="fas fa-industry mr-1"></i>공방 위탁</span>'
  };
  return badges[type] || badges['direct'];
}

// 공방 발주 상태 뱃지
function getWorkshopStatusBadge(status) {
  const badges = {
    'pending': '<span class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"><i class="fas fa-hourglass mr-1"></i>발주 대기</span>',
    'sent': '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"><i class="fas fa-paper-plane mr-1"></i>발주 전송</span>',
    'processing': '<span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"><i class="fas fa-cog mr-1"></i>공방 처리중</span>',
    'shipped': '<span class="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs"><i class="fas fa-truck mr-1"></i>공방 발송</span>',
    'completed': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"><i class="fas fa-check-circle mr-1"></i>완료</span>'
  };
  return badges[status] || status;
}

// 통계 업데이트
async function updateStatistics() {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch('/api/orders/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('통계 로드 실패');
    }

    const stats = await response.json();

    // 통계 카드 업데이트
    document.getElementById('stat-total').textContent = stats.total_orders || 0;
    document.getElementById('stat-pending').textContent = stats.payment_pending || 0;
    document.getElementById('stat-paid').textContent = stats.payment_paid || 0;
    document.getElementById('stat-shipping').textContent = stats.order_shipping || 0;
    document.getElementById('stat-delivered').textContent = stats.order_delivered || 0;

  } catch (error) {
    console.error('통계 로드 오류:', error);
  }
}

// 페이지네이션 업데이트
function updatePagination(total) {
  const totalPages = Math.ceil(total / itemsPerPage);
  const paginationDiv = document.getElementById('pagination');

  if (totalPages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  let html = '<div class="flex justify-center items-center space-x-2">';

  // 이전 버튼
  if (currentPage > 1) {
    html += `<button onclick="changePage(${currentPage - 1})" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"><i class="fas fa-chevron-left"></i></button>`;
  }

  // 페이지 번호
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="px-3 py-1 bg-purple-600 text-white rounded">${i}</button>`;
    } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `<button onclick="changePage(${i})" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span class="px-2">...</span>`;
    }
  }

  // 다음 버튼
  if (currentPage < totalPages) {
    html += `<button onclick="changePage(${currentPage + 1})" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"><i class="fas fa-chevron-right"></i></button>`;
  }

  html += '</div>';
  paginationDiv.innerHTML = html;
}

// 페이지 변경
function changePage(page) {
  currentPage = page;
  loadOrders();
}

// 주문 상세 보기
async function viewOrderDetail(orderId) {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('주문 상세 정보 로드 실패');
    }

    const data = await response.json();
    const order = data.order;
    const items = data.items;

    // 모달 내용 생성
    const modalContent = document.getElementById('order-detail-content');
    modalContent.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        <!-- 헤더 -->
        <div class="flex justify-between items-center mb-6 border-b pb-4">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-shopping-bag text-purple-600 mr-2"></i>
            주문 상세 정보
          </h2>
          <button onclick="closeOrderDetailModal()" 
              class="text-gray-500 hover:text-gray-700 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 주문 기본 정보 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-bold text-gray-700 mb-3 flex items-center">
              <i class="fas fa-info-circle text-blue-600 mr-2"></i>주문 정보
            </h3>
            <div class="space-y-2 text-sm">
              <div><strong>주문번호:</strong> <span class="text-blue-600 font-mono">${order.order_number}</span></div>
              <div><strong>이행 타입:</strong> ${getFulfillmentTypeBadge(order.fulfillment_type || 'direct')}</div>
              ${order.fulfillment_type === 'workshop' && order.workshop_order_status ? `
                <div><strong>발주 상태:</strong> ${getWorkshopStatusBadge(order.workshop_order_status)}</div>
              ` : ''}
              <div><strong>주문일시:</strong> ${new Date(order.created_at).toLocaleString('ko-KR')}</div>
              <div><strong>결제 상태:</strong> ${getPaymentStatusBadge(order.payment_status)}</div>
              <div><strong>주문 상태:</strong> ${getOrderStatusBadge(order.order_status)}</div>
              ${order.paid_at ? `<div><strong>결제 완료:</strong> ${new Date(order.paid_at).toLocaleString('ko-KR')}</div>` : ''}
              ${order.shipped_at ? `<div><strong>배송 시작:</strong> ${new Date(order.shipped_at).toLocaleString('ko-KR')}</div>` : ''}
              ${order.delivered_at ? `<div><strong>배송 완료:</strong> ${new Date(order.delivered_at).toLocaleString('ko-KR')}</div>` : ''}
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-bold text-gray-700 mb-3 flex items-center">
              <i class="fas fa-user text-green-600 mr-2"></i>고객 정보
            </h3>
            <div class="space-y-2 text-sm">
              <div><strong>이름:</strong> ${order.customer_name}</div>
              <div><strong>이메일:</strong> ${order.customer_email}</div>
              <div><strong>전화번호:</strong> ${order.customer_phone}</div>
              ${order.customer_zipcode ? `<div><strong>우편번호:</strong> ${order.customer_zipcode}</div>` : ''}
              ${order.customer_address ? `<div><strong>주소:</strong> ${order.customer_address}</div>` : ''}
              ${order.customer_detail_address ? `<div><strong>상세주소:</strong> ${order.customer_detail_address}</div>` : ''}
              ${order.delivery_message ? `<div><strong>배송 메시지:</strong> ${order.delivery_message}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- 주문 상품 목록 -->
        <div class="mb-6">
          <h3 class="font-bold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-box text-purple-600 mr-2"></i>주문 상품
          </h3>
          <div class="bg-gray-50 rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-200">
                <tr>
                  <th class="px-4 py-2 text-left">상품명</th>
                  <th class="px-4 py-2 text-center">컨셉</th>
                  <th class="px-4 py-2 text-center">수량</th>
                  <th class="px-4 py-2 text-right">단가</th>
                  <th class="px-4 py-2 text-right">합계</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr class="border-b">
                    <td class="px-4 py-3">${item.product_name}</td>
                    <td class="px-4 py-3 text-center">
                      ${item.product_concept === 'symptom_care' ? 
                        '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">증상 케어</span>' : 
                        '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">리프레시</span>'}
                    </td>
                    <td class="px-4 py-3 text-center">${item.quantity}</td>
                    <td class="px-4 py-3 text-right">${item.unit_price.toLocaleString()}원</td>
                    <td class="px-4 py-3 text-right font-semibold">${item.total_price.toLocaleString()}원</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 결제 금액 정보 -->
        <div class="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 class="font-bold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-won-sign text-purple-600 mr-2"></i>결제 금액
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>상품 금액:</span>
              <span>${order.total_amount.toLocaleString()}원</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>배송비:</span>
              <span>${order.delivery_fee.toLocaleString()}원</span>
            </div>
            ${order.discount_amount > 0 ? `
            <div class="flex justify-between text-sm text-red-600">
              <span>할인 금액:</span>
              <span>-${order.discount_amount.toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>최종 결제 금액:</span>
              <span class="text-purple-600">${(order.total_amount || order.final_amount).toLocaleString()}원</span>
            </div>
          </div>
        </div>

        <!-- 배송 정보 -->
        ${order.tracking_number || order.delivery_company ? `
        <div class="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 class="font-bold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-truck text-blue-600 mr-2"></i>배송 정보
          </h3>
          <div class="space-y-2 text-sm">
            ${order.delivery_company ? `<div><strong>택배사:</strong> ${order.delivery_company}</div>` : ''}
            ${order.tracking_number ? `<div><strong>운송장 번호:</strong> ${order.tracking_number}</div>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- 공방 발주 관리 (공방 위탁 주문인 경우만 표시) -->
        ${order.fulfillment_type === 'workshop' ? `
        <div class="bg-purple-50 p-4 rounded-lg mb-6 border-2 border-purple-200">
          <h3 class="font-bold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-industry text-purple-600 mr-2"></i>공방 발주 관리
          </h3>
          <div class="space-y-3">
            <!-- 발주 상태 표시 -->
            <div class="bg-white p-3 rounded-lg">
              <div class="text-sm space-y-2">
                <div><strong>발주 상태:</strong> ${getWorkshopStatusBadge(order.workshop_order_status || 'pending')}</div>
                ${order.workshop_order_sent_at ? `
                  <div><strong>발주 전송 일시:</strong> ${new Date(order.workshop_order_sent_at).toLocaleString('ko-KR')}</div>
                ` : ''}
                ${order.workshop_notes ? `
                  <div><strong>발주 메모:</strong> <span class="text-gray-600">${order.workshop_notes}</span></div>
                ` : ''}
              </div>
            </div>

            <!-- 발주 관리 버튼들 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              ${!order.workshop_order_status || order.workshop_order_status === 'pending' ? `
                <button onclick="sendWorkshopOrder(${order.id})" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center">
                  <i class="fas fa-paper-plane mr-2"></i>공방에 발주 전송
                </button>
              ` : ''}
              
              <button onclick="printWorkshopOrderSheet(${order.id})" 
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                <i class="fas fa-print mr-2"></i>발주서 출력
              </button>
              
              <button onclick="showWorkshopStatusModal(${order.id}, '${order.workshop_order_status || 'pending'}')" 
                  class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                <i class="fas fa-edit mr-2"></i>발주 상태 변경
              </button>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 관리자 메모 -->
        <div class="mb-6">
          <h3 class="font-bold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-sticky-note text-yellow-600 mr-2"></i>관리자 메모
          </h3>
          <textarea id="admin-memo-input" 
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" 
              rows="3"
              placeholder="주문에 대한 메모를 작성하세요...">${order.admin_memo || ''}</textarea>
          <button onclick="saveAdminMemo(${order.id})" 
              class="mt-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600">
            <i class="fas fa-save mr-1"></i>메모 저장
          </button>
        </div>

        <!-- 상태 변경 버튼 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">결제 상태 변경</h4>
            <div class="space-y-2">
              ${order.payment_status === 'pending' ? `
                <button onclick="updatePaymentStatus(${order.id}, 'paid')" 
                    class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  <i class="fas fa-check-circle mr-1"></i>결제 완료로 변경
                </button>
              ` : ''}
              ${order.payment_status === 'paid' ? `
                <button onclick="updatePaymentStatus(${order.id}, 'refunded')" 
                    class="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">
                  <i class="fas fa-undo mr-1"></i>환불 처리
                </button>
              ` : ''}
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">주문 상태 변경</h4>
            <div class="space-y-2">
              ${order.order_status === 'pending' ? `
                <button onclick="updateOrderStatus(${order.id}, 'confirmed')" 
                    class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                  <i class="fas fa-check mr-1"></i>주문 확인
                </button>
              ` : ''}
              ${order.order_status === 'confirmed' ? `
                <button onclick="updateOrderStatus(${order.id}, 'preparing')" 
                    class="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
                  <i class="fas fa-box mr-1"></i>상품 준비중
                </button>
              ` : ''}
              ${order.order_status === 'preparing' ? `
                <button onclick="showShippingModal(${order.id})" 
                    class="w-full bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600">
                  <i class="fas fa-truck mr-1"></i>배송 시작
                </button>
              ` : ''}
              ${order.order_status === 'shipped' ? `
                <button onclick="updateOrderStatus(${order.id}, 'delivered')" 
                    class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  <i class="fas fa-check-double mr-1"></i>배송 완료
                </button>
              ` : ''}
              ${order.order_status !== 'cancelled' && order.order_status !== 'delivered' ? `
                <button onclick="updateOrderStatus(${order.id}, 'cancelled')" 
                    class="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                  <i class="fas fa-ban mr-1"></i>주문 취소
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    // 모달 표시
    document.getElementById('order-detail-modal').classList.remove('hidden');

  } catch (error) {
    console.error('주문 상세 정보 로드 오류:', error);
    showNotification('주문 상세 정보를 불러오는데 실패했습니다.', 'error');
  }
}

// 주문 상세 모달 닫기
function closeOrderDetailModal() {
  document.getElementById('order-detail-modal').classList.add('hidden');
}

// 결제 상태 업데이트
async function updatePaymentStatus(orderId, newStatus) {
  if (!confirm(`결제 상태를 "${getPaymentStatusText(newStatus)}"로 변경하시겠습니까?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}/payment-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payment_status: newStatus })
    });

    if (!response.ok) {
      throw new Error('결제 상태 변경 실패');
    }

    showNotification('결제 상태가 변경되었습니다.', 'success');
    closeOrderDetailModal();
    loadOrders();

  } catch (error) {
    console.error('결제 상태 변경 오류:', error);
    showNotification('결제 상태 변경에 실패했습니다.', 'error');
  }
}

// 주문 상태 업데이트
async function updateOrderStatus(orderId, newStatus) {
  if (!confirm(`주문 상태를 "${getOrderStatusText(newStatus)}"로 변경하시겠습니까?`)) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}/order-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order_status: newStatus })
    });

    if (!response.ok) {
      throw new Error('주문 상태 변경 실패');
    }

    showNotification('주문 상태가 변경되었습니다.', 'success');
    closeOrderDetailModal();
    loadOrders();

  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    showNotification('주문 상태 변경에 실패했습니다.', 'error');
  }
}

// 배송 정보 입력 모달 표시
function showShippingModal(orderId) {
  const modalHtml = `
    <div id="shipping-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-truck text-cyan-600 mr-2"></i>배송 정보 입력
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">택배사</label>
            <select id="delivery-company" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
              <option value="CJ대한통운">CJ대한통운</option>
              <option value="우체국택배">우체국택배</option>
              <option value="한진택배">한진택배</option>
              <option value="로젠택배">로젠택배</option>
              <option value="롯데택배">롯데택배</option>
              <option value="경동택배">경동택배</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">운송장 번호</label>
            <input type="text" id="tracking-number" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                placeholder="운송장 번호를 입력하세요">
          </div>
          <div class="flex space-x-2">
            <button onclick="saveShippingInfo(${orderId})" 
                class="flex-1 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600">
              <i class="fas fa-save mr-1"></i>저장하고 배송 시작
            </button>
            <button onclick="closeShippingModal()" 
                class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
              <i class="fas fa-times mr-1"></i>취소
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 배송 정보 저장
async function saveShippingInfo(orderId) {
  const deliveryCompany = document.getElementById('delivery-company').value;
  const trackingNumber = document.getElementById('tracking-number').value;

  if (!trackingNumber.trim()) {
    alert('운송장 번호를 입력해주세요.');
    return;
  }

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}/shipping`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        delivery_company: deliveryCompany,
        tracking_number: trackingNumber,
        order_status: 'shipped'
      })
    });

    if (!response.ok) {
      throw new Error('배송 정보 저장 실패');
    }

    showNotification('배송이 시작되었습니다.', 'success');
    closeShippingModal();
    closeOrderDetailModal();
    loadOrders();

  } catch (error) {
    console.error('배송 정보 저장 오류:', error);
    showNotification('배송 정보 저장에 실패했습니다.', 'error');
  }
}

// 배송 정보 모달 닫기
function closeShippingModal() {
  const modal = document.getElementById('shipping-modal');
  if (modal) {
    modal.remove();
  }
}

// 관리자 메모 저장
async function saveAdminMemo(orderId) {
  const memo = document.getElementById('admin-memo-input').value;

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}/memo`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ admin_memo: memo })
    });

    if (!response.ok) {
      throw new Error('메모 저장 실패');
    }

    showNotification('메모가 저장되었습니다.', 'success');

  } catch (error) {
    console.error('메모 저장 오류:', error);
    showNotification('메모 저장에 실패했습니다.', 'error');
  }
}

// ===== 공방 발주 관리 함수들 =====

// 공방에 발주 전송
async function sendWorkshopOrder(orderId) {
  if (!confirm('공방에 발주를 전송하시겠습니까?')) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}/send-workshop-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('발주 전송 실패');
    }

    showNotification('공방에 발주가 전송되었습니다.', 'success');
    closeOrderDetailModal();
    loadOrders();

  } catch (error) {
    console.error('발주 전송 오류:', error);
    showNotification('발주 전송에 실패했습니다.', 'error');
  }
}

// 발주서 출력
async function printWorkshopOrderSheet(orderId) {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}/workshop-order-sheet`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('발주서 조회 실패');
    }

    const data = await response.json();
    const order = data.order;
    const items = data.items;

    // 새 창에서 발주서 출력
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>발주서 - ${order.order_number}</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; }
          h1 { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; }
          .info-section { margin: 20px 0; }
          .info-section h2 { background: #f0f0f0; padding: 8px; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background: #e0e0e0; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin: 20px 0; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>🏭 공방 발주서</h1>
        
        <div class="info-section">
          <h2>📋 주문 정보</h2>
          <p><strong>주문번호:</strong> ${order.order_number}</p>
          <p><strong>주문일시:</strong> ${new Date(order.created_at).toLocaleString('ko-KR')}</p>
          <p><strong>발주서 출력일:</strong> ${new Date(data.print_date).toLocaleString('ko-KR')}</p>
        </div>

        <div class="info-section">
          <h2>📦 배송 정보</h2>
          <p><strong>받는 사람:</strong> ${order.customer_name}</p>
          <p><strong>전화번호:</strong> ${order.customer_phone}</p>
          <p><strong>이메일:</strong> ${order.customer_email}</p>
          <p><strong>우편번호:</strong> ${order.customer_zipcode || '-'}</p>
          <p><strong>주소:</strong> ${order.customer_address || '-'}</p>
          <p><strong>상세주소:</strong> ${order.customer_address_detail || order.customer_detail_address || '-'}</p>
          ${order.delivery_message ? `<p><strong>���송 메시지:</strong> ${order.delivery_message}</p>` : ''}
        </div>

        <div class="info-section">
          <h2>🛍️ 주문 상품</h2>
          <table>
            <thead>
              <tr>
                <th>상품명</th>
                <th>컨셉</th>
                <th style="text-align: center;">수량</th>
                <th style="text-align: right;">비고</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.product_concept === 'symptom_care' ? '증상 케어' : '리프레시'}</td>
                  <td style="text-align: center;">${item.quantity}개</td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="total">
          총 상품 수량: ${items.reduce((sum, item) => sum + item.quantity, 0)}개
        </div>

        ${order.workshop_notes ? `
        <div class="info-section">
          <h2>📝 특이사항</h2>
          <p>${order.workshop_notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>아로마펄스(AromaPulse)</p>
          <p>본 발주서는 공방 제작용입니다.</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
            🖨️ 인쇄하기
          </button>
          <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">
            ❌ 닫기
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

  } catch (error) {
    console.error('발주서 출력 오류:', error);
    showNotification('발주서 출력에 실패했습니다.', 'error');
  }
}

// 발주 상태 변경 모달 표시
function showWorkshopStatusModal(orderId, currentStatus) {
  const modal = document.createElement('div');
  modal.id = 'workshop-status-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold mb-4 flex items-center">
        <i class="fas fa-edit text-purple-600 mr-2"></i>
        발주 상태 변경
      </h3>
      
      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-2">발주 상태</label>
        <select id="workshop-status-select" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
          <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>발주 대기</option>
          <option value="sent" ${currentStatus === 'sent' ? 'selected' : ''}>발주 전송</option>
          <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>공방 처리중</option>
          <option value="shipped" ${currentStatus === 'shipped' ? 'selected' : ''}>공방 발송</option>
          <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>완료</option>
        </select>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-2">발주 메모 (선택사항)</label>
        <textarea id="workshop-notes-input" 
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" 
            rows="3"
            placeholder="공방 관련 메모를 작성하세요..."></textarea>
      </div>

      <div class="flex space-x-2">
        <button onclick="updateWorkshopStatus(${orderId})" 
            class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
          <i class="fas fa-check mr-1"></i>저장
        </button>
        <button onclick="closeWorkshopStatusModal()" 
            class="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
          <i class="fas fa-times mr-1"></i>취소
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 발주 상태 변경 모달 닫기
function closeWorkshopStatusModal() {
  const modal = document.getElementById('workshop-status-modal');
  if (modal) {
    modal.remove();
  }
}

// 발주 상태 업데이트
async function updateWorkshopStatus(orderId) {
  const status = document.getElementById('workshop-status-select').value;
  const notes = document.getElementById('workshop-notes-input').value;

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}/workshop-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workshop_order_status: status,
        workshop_notes: notes
      })
    });

    if (!response.ok) {
      throw new Error('발주 상태 업데이트 실패');
    }

    showNotification('발주 상태가 변경되었습니다.', 'success');
    closeWorkshopStatusModal();
    closeOrderDetailModal();
    loadOrders();

  } catch (error) {
    console.error('발주 상태 업데이트 오류:', error);
    showNotification('발주 상태 변경에 실패했습니다.', 'error');
  }
}

// 결제 상태 텍스트
function getPaymentStatusText(status) {
  const texts = {
    'pending': '결제 대기',
    'paid': '결제 완료',
    'failed': '결제 실패',
    'cancelled': '결제 취소',
    'refunded': '환불 완료'
  };
  return texts[status] || status;
}

// 주문 상태 텍스트
function getOrderStatusText(status) {
  const texts = {
    'pending': '주문 접수',
    'confirmed': '주문 확인',
    'preparing': '상품 준비중',
    'shipped': '배송중',
    'delivered': '배송 완료',
    'cancelled': '주문 취소'
  };
  return texts[status] || status;
}

// 알림 표시
function showNotification(message, type = 'info') {
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 주문 삭제
async function deleteOrder(orderId, orderNumber) {
  // 삭제 확인 모달 표시
  const confirmed = await showDeleteConfirmModal(orderId, orderNumber);
  
  if (!confirmed) {
    return;
  }

  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/orders/admin/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || '주문 삭제 실패');
    }

    const result = await response.json();
    
    console.log('주문 삭제 완료:', result);
    showNotification(`주문 ${orderNumber}이(가) 삭제되었습니다.`, 'success');
    
    // 목록 새로고침
    loadOrders();

  } catch (error) {
    console.error('주문 삭제 오류:', error);
    showNotification(`주문 삭제 실패: ${error.message}`, 'error');
  }
}

// 삭제 확인 모달 표시
function showDeleteConfirmModal(orderId, orderNumber) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'delete-confirm-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">주문을 삭제하시겠습니까?</h3>
          <p class="text-gray-600 text-sm">
            주문번호: <span class="font-mono font-bold text-red-600">${orderNumber}</span>
          </p>
          <p class="text-red-600 text-sm mt-2">
            ⚠️ 이 작업은 되돌릴 수 없습니다!
          </p>
        </div>

        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-info-circle text-yellow-400"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                <strong>주의:</strong> 결제 완료된 주문은 삭제 대신 <strong>취소</strong> 상태로 변경하는 것을 권장합니다.
              </p>
            </div>
          </div>
        </div>

        <div class="flex space-x-3">
          <button id="delete-confirm-btn" 
              class="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-semibold">
            <i class="fas fa-trash mr-2"></i>삭제
          </button>
          <button id="delete-cancel-btn" 
              class="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 font-semibold">
            <i class="fas fa-times mr-2"></i>취소
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 확인 버튼 클릭
    document.getElementById('delete-confirm-btn').addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });
    
    // 취소 버튼 클릭
    document.getElementById('delete-cancel-btn').addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });
    
    // ESC 키로 닫기
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
        resolve(false);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

// 로그아웃
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('auth_token');
  window.location.href = '/static/admin-login.html';
}
