// Admin Product Management JavaScript
// 관리자 제품 관리 시스템

let currentProducts = [];
let isEditing = false;
let editingProductId = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProducts();
  
  // 폼 제출 이벤트
  document.getElementById('product-form').addEventListener('submit', handleFormSubmit);
  
  // 취소 버튼
  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  
  // 모달 외부 클릭시 닫기
  document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') {
      closeModal();
    }
  });
});

// 인증 확인
async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.href = '/login';
    return false;
  }
  
  try {
    // JWT 토큰 디코딩 (간단한 방식)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    
    // 사용자 정보 조회
    const response = await fetch(`/api/auth/me/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('인증 실패');
    }
    
    const data = await response.json();
    const user = data.user || data;
    
    // 관리자 권한 확인 (role이 'admin' 또는 'super_admin'인 경우만 허용)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      alert('관리자 권한이 필요합니다.\n\n관리자 계정으로 로그인해주세요.');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return false;
    }
    
    // 사용자 정보 표시
    document.getElementById('user-name').textContent = user.name;
    
    return true;
  } catch (error) {
    console.error('인증 오류:', error);
    alert('인증에 실패했습니다. 다시 로그인해주세요.');
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    return false;
  }
}

// 제품 목록 로드
async function loadProducts() {
  const token = localStorage.getItem('auth_token');
  const loadingEl = document.getElementById('loading');
  const gridEl = document.getElementById('products-grid');
  
  loadingEl.style.display = 'block';
  gridEl.innerHTML = '';
  
  try {
    const response = await fetch('/api/admin-products', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('제품 목록 로드 실패');
    }
    
    const data = await response.json();
    currentProducts = data.products || [];
    
    loadingEl.style.display = 'none';
    
    if (currentProducts.length === 0) {
      gridEl.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-500">
          <i class="fas fa-box-open text-6xl mb-4"></i>
          <p class="text-lg">등록된 제품이 없습니다.</p>
          <p class="text-sm mt-2">상단의 "제품 등록" 버튼을 클릭하여 첫 제품을 등록해보세요.</p>
        </div>
      `;
      return;
    }
    
    // 제품 카드 렌더링
    currentProducts.forEach(product => {
      const card = createProductCard(product);
      gridEl.appendChild(card);
    });
    
  } catch (error) {
    console.error('제품 로드 오류:', error);
    loadingEl.style.display = 'none';
    gridEl.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-500">
        <i class="fas fa-exclamation-circle text-6xl mb-4"></i>
        <p class="text-lg">제품 목록을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    `;
  }
}

// 제품 카드 생성
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow';
  
  const statusBadge = product.is_active 
    ? '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">활성</span>'
    : '<span class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">비활성</span>';
  
  const thumbnailUrl = product.thumbnail_image || 'https://via.placeholder.com/300x200?text=No+Image';
  
  const workshopInfo = product.workshop_name 
    ? `<div class="text-xs text-gray-500 mb-2">
         <i class="fas fa-store mr-1"></i>${product.workshop_name}
         ${product.workshop_location ? ` · ${product.workshop_location}` : ''}
       </div>`
    : '';
  
  card.innerHTML = `
    <div class="relative">
      <img src="${thumbnailUrl}" alt="${product.name}" class="w-full h-48 object-cover">
      <div class="absolute top-2 right-2">
        ${statusBadge}
      </div>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2 text-gray-800">${product.name}</h3>
      ${workshopInfo}
      <p class="text-sm text-gray-600 mb-3 line-clamp-2">${product.description || '설명 없음'}</p>
      <div class="flex items-center justify-between mb-3">
        <span class="text-lg font-bold text-purple-600">${product.price.toLocaleString()}원</span>
        <span class="text-sm text-gray-500">재고: ${product.stock}개</span>
      </div>
      <div class="flex gap-2">
        <button onclick="editProduct(${product.id})" class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          <i class="fas fa-edit mr-1"></i> 수정
        </button>
        <button onclick="deleteProduct(${product.id}, '${product.name}')" class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
          <i class="fas fa-trash mr-1"></i> 삭제
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// 새 제품 등록 모달 열기
function openNewProductModal() {
  isEditing = false;
  editingProductId = null;
  
  document.getElementById('modal-title').textContent = '새 제품 등록';
  document.getElementById('submit-btn').textContent = '등록';
  document.getElementById('product-form').reset();
  
  // 이미지 미리보기 초기화
  document.getElementById('thumbnail-preview').style.display = 'none';
  document.getElementById('detail-preview').style.display = 'none';
  document.getElementById('thumbnail-image-url').value = '';
  document.getElementById('detail-image-url').value = '';
  
  // 로컬 공방 정보 초기화
  document.getElementById('workshop-name').value = '';
  document.getElementById('workshop-location').value = '';
  document.getElementById('workshop-address').value = '';
  document.getElementById('workshop-contact').value = '';
  
  document.getElementById('product-modal').classList.remove('hidden');
}

// 제품 수정 모달 열기
async function editProduct(productId) {
  isEditing = true;
  editingProductId = productId;
  
  const product = currentProducts.find(p => p.id === productId);
  if (!product) {
    alert('제품을 찾을 수 없습니다.');
    return;
  }
  
  document.getElementById('modal-title').textContent = '제품 수정';
  document.getElementById('submit-btn').textContent = '수정';
  
  // 폼 필드 채우기
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-description').value = product.description || '';
  document.getElementById('product-category').value = product.category;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-active').checked = product.is_active === 1;
  
  // 로컬 공방 정보
  document.getElementById('workshop-name').value = product.workshop_name || '';
  document.getElementById('workshop-location').value = product.workshop_location || '';
  document.getElementById('workshop-address').value = product.workshop_address || '';
  document.getElementById('workshop-contact').value = product.workshop_contact || '';
  
  // 이미지 URL 및 미리보기 설정
  if (product.thumbnail_image) {
    document.getElementById('thumbnail-image-url').value = product.thumbnail_image;
    document.getElementById('thumbnail-preview-img').src = product.thumbnail_image;
    document.getElementById('thumbnail-preview').style.display = 'block';
  }
  
  if (product.detail_image) {
    document.getElementById('detail-image-url').value = product.detail_image;
    document.getElementById('detail-preview-img').src = product.detail_image;
    document.getElementById('detail-preview').style.display = 'block';
  }
  
  document.getElementById('product-modal').classList.remove('hidden');
}

// 모달 닫기
function closeModal() {
  document.getElementById('product-modal').classList.add('hidden');
  document.getElementById('product-form').reset();
  isEditing = false;
  editingProductId = null;
}

// 이미지 업로드
async function uploadImage(type) {
  const inputId = type === 'thumbnail' ? 'thumbnail-upload' : 'detail-upload';
  const input = document.getElementById(inputId);
  const file = input.files[0];
  
  if (!file) {
    alert('이미지 파일을 선택해주세요.');
    return;
  }
  
  // 파일 크기 확인 (10MB 제한)
  if (file.size > 10 * 1024 * 1024) {
    alert('이미지 파일 크기는 10MB 이하여야 합니다.');
    return;
  }
  
  // 파일 형식 확인
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.');
    return;
  }
  
  const token = localStorage.getItem('auth_token');
  const uploadBtn = event.target;
  const originalText = uploadBtn.textContent;
  
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 업로드 중...';
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/admin-products/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('이미지 업로드 실패');
    }
    
    const data = await response.json();
    const imageUrl = data.url;
    
    // 이미지 URL 저장 및 미리보기 표시
    if (type === 'thumbnail') {
      document.getElementById('thumbnail-image-url').value = imageUrl;
      document.getElementById('thumbnail-preview-img').src = imageUrl;
      document.getElementById('thumbnail-preview').style.display = 'block';
    } else {
      document.getElementById('detail-image-url').value = imageUrl;
      document.getElementById('detail-preview-img').src = imageUrl;
      document.getElementById('detail-preview').style.display = 'block';
    }
    
    alert(`${type === 'thumbnail' ? '대표 이미지' : '상세 이미지'} 업로드 완료!`);
    
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    alert('이미지 업로드 중 오류가 발생했습니다.');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = originalText;
  }
}

// 폼 제출 처리
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const token = localStorage.getItem('auth_token');
  const submitBtn = document.getElementById('submit-btn');
  const originalText = submitBtn.textContent;
  
  // 폼 데이터 수집
  const productData = {
    name: document.getElementById('product-name').value.trim(),
    description: document.getElementById('product-description').value.trim(),
    category: document.getElementById('product-category').value,
    price: parseInt(document.getElementById('product-price').value),
    stock: parseInt(document.getElementById('product-stock').value),
    thumbnail_image: document.getElementById('thumbnail-image-url').value,
    detail_image: document.getElementById('detail-image-url').value,
    is_active: document.getElementById('product-active').checked ? 1 : 0,
    // 로컬 공방 정보
    workshop_name: document.getElementById('workshop-name').value.trim() || null,
    workshop_location: document.getElementById('workshop-location').value || null,
    workshop_address: document.getElementById('workshop-address').value.trim() || null,
    workshop_contact: document.getElementById('workshop-contact').value.trim() || null
  };
  
  // 유효성 검사
  if (!productData.name) {
    alert('제품명을 입력해주세요.');
    return;
  }
  
  if (!productData.thumbnail_image) {
    alert('대표 이미지를 업로드해주세요.');
    return;
  }
  
  if (!productData.detail_image) {
    alert('상세 이미지를 업로드해주세요.');
    return;
  }
  
  if (productData.price < 0) {
    alert('가격은 0원 이상이어야 합니다.');
    return;
  }
  
  if (productData.stock < 0) {
    alert('재고는 0개 이상이어야 합니다.');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 처리 중...';
  
  try {
    let response;
    
    if (isEditing) {
      // 제품 수정
      response = await fetch(`/api/admin-products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
    } else {
      // 제품 등록
      response = await fetch('/api/admin-products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '제품 저장 실패');
    }
    
    alert(isEditing ? '제품이 수정되었습니다!' : '제품이 등록되었습니다!');
    closeModal();
    loadProducts();
    
  } catch (error) {
    console.error('제품 저장 오류:', error);
    alert(`제품 저장 중 오류가 발생했습니다: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// 제품 삭제
async function deleteProduct(productId, productName) {
  if (!confirm(`정말 "${productName}" 제품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
    return;
  }
  
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`/api/admin-products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('제품 삭제 실패');
    }
    
    alert('제품이 삭제되었습니다.');
    loadProducts();
    
  } catch (error) {
    console.error('제품 삭제 오류:', error);
    alert('제품 삭제 중 오류가 발생했습니다.');
  }
}

// 로그아웃
function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}
