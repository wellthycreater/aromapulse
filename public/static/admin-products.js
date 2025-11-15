// Admin Product Management JavaScript
// 관리자 제품 관리 시스템

let currentProducts = [];
let filteredProducts = [];
let currentTab = 'all';
let isEditing = false;
let editingProductId = null;
let blogPosts = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProducts();
  loadBlogPosts();
  
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

// 탭 전환
function switchTab(tab) {
  currentTab = tab;
  
  // 탭 버튼 스타일 업데이트
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active', 'border-purple-600', 'text-purple-600');
    btn.classList.add('border-transparent', 'text-gray-500');
  });
  
  const activeTab = document.getElementById(`tab-${tab}`);
  activeTab.classList.add('active', 'border-purple-600', 'text-purple-600');
  activeTab.classList.remove('border-transparent', 'text-gray-500');
  
  // 블로그 관리 탭인 경우
  if (tab === 'blog') {
    document.getElementById('products-grid').style.display = 'none';
    document.getElementById('blog-management-section').classList.remove('hidden');
    document.getElementById('loading').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
  } else {
    document.getElementById('products-grid').style.display = 'grid';
    document.getElementById('blog-management-section').classList.add('hidden');
    // 제품 필터링 및 렌더링
    filterAndRenderProducts();
  }
}

// 제품 필터링 및 렌더링
function filterAndRenderProducts() {
  const gridEl = document.getElementById('products-grid');
  gridEl.innerHTML = '';
  
  // 탭에 따라 제품 필터링
  if (currentTab === 'all') {
    filteredProducts = currentProducts;
  } else if (currentTab === 'symptom_care') {
    filteredProducts = currentProducts.filter(p => p.concept === 'symptom_care');
  } else if (currentTab === 'refresh') {
    filteredProducts = currentProducts.filter(p => p.concept === 'refresh');
  }
  
  // 빈 상태 확인
  if (filteredProducts.length === 0) {
    gridEl.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-500">
        <i class="fas fa-box-open text-6xl mb-4"></i>
        <p class="text-lg">이 카테고리에 등록된 제품이 없습니다.</p>
        <p class="text-sm mt-2">상단의 "제품 등록" 버튼을 클릭하여 제품을 등록해보세요.</p>
      </div>
    `;
    return;
  }
  
  // 제품 카드 렌더링
  filteredProducts.forEach(product => {
    const card = createProductCard(product);
    gridEl.appendChild(card);
  });
}

// 제품 개수 업데이트
function updateProductCounts() {
  const allCount = currentProducts.length;
  const symptomCareCount = currentProducts.filter(p => p.concept === 'symptom_care').length;
  const refreshCount = currentProducts.filter(p => p.concept === 'refresh').length;
  const blogCount = blogPosts.length;
  
  document.getElementById('count-all').textContent = allCount;
  document.getElementById('count-symptom-care').textContent = symptomCareCount;
  document.getElementById('count-refresh').textContent = refreshCount;
  document.getElementById('count-blog').textContent = blogCount;
}

// 제품 컨셉 변경 시 필드 토글
function toggleProductFields() {
  const concept = document.getElementById('product-concept').value;
  const symptomField = document.getElementById('symptom-category-field');
  const refreshField = document.getElementById('refresh-type-field');
  const volumeField = document.getElementById('volume-field');
  const workshopSection = document.getElementById('workshop-info-section');
  const categorySelect = document.getElementById('product-category');
  const refreshSelect = document.getElementById('refresh-type');
  const volumeSelect = document.getElementById('product-volume');
  
  if (concept === 'symptom_care') {
    // 증상케어 제품
    symptomField.style.display = 'block';
    refreshField.style.display = 'none';
    volumeField.style.display = 'none';
    workshopSection.style.display = 'block';
    categorySelect.required = true;
    refreshSelect.required = false;
    volumeSelect.required = false;
    refreshSelect.value = '';
    volumeSelect.value = '';
  } else if (concept === 'refresh') {
    // 리프레시 제품
    symptomField.style.display = 'none';
    refreshField.style.display = 'block';
    volumeField.style.display = 'block';
    workshopSection.style.display = 'none';
    categorySelect.required = false;
    refreshSelect.required = true;
    volumeSelect.required = true;
    categorySelect.value = '';
    // 공방 정보 초기화
    document.getElementById('workshop-name').value = '';
    document.getElementById('workshop-location').value = '';
    document.getElementById('workshop-address').value = '';
    document.getElementById('workshop-contact').value = '';
  } else {
    // 선택 안 함
    symptomField.style.display = 'none';
    refreshField.style.display = 'none';
    volumeField.style.display = 'none';
    workshopSection.style.display = 'none';
    categorySelect.required = false;
    refreshSelect.required = false;
    volumeSelect.required = false;
  }
}

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
    
    // 제품 개수 업데이트
    updateProductCounts();
    
    // 제품 필터링 및 렌더링
    filterAndRenderProducts();
    
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
  
  // 제품 컨셉 뱃지
  const conceptBadge = product.concept === 'refresh'
    ? '<span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">리프레시</span>'
    : '<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">증상케어</span>';
  
  // 리프레시 제품 유형 표시
  const refreshTypeLabels = {
    fabric_perfume: '섬유 향수',
    room_spray: '룸 스프레이',
    fabric_deodorizer: '섬유 탈취제',
    diffuser: '디퓨저',
    candle: '캔들',
    perfume: '향수'
  };
  
  const refreshTypeInfo = product.concept === 'refresh' && product.refresh_type
    ? `<div class="text-xs text-purple-600 mb-2 font-semibold">
         <i class="fas fa-spray-can mr-1"></i>${refreshTypeLabels[product.refresh_type] || product.refresh_type}
         ${product.volume ? ` · ${product.volume}` : ''}
       </div>`
    : '';
  
  // 공방 정보 (증상케어 제품일 때만)
  const workshopInfo = product.concept === 'symptom_care' && product.workshop_name 
    ? `<div class="text-xs text-gray-500 mb-2">
         <i class="fas fa-store mr-1"></i>${product.workshop_name}
         ${product.workshop_location ? ` · ${product.workshop_location}` : ''}
       </div>`
    : '';
  
  card.innerHTML = `
    <div class="relative">
      <img src="${thumbnailUrl}" alt="${product.name}" class="w-full h-48 object-cover">
      <div class="absolute top-2 right-2 flex gap-2">
        ${conceptBadge}
        ${statusBadge}
      </div>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2 text-gray-800">${product.name}</h3>
      ${refreshTypeInfo}
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
  
  // 제품 컨셉 초기화 (필드 숨기기)
  document.getElementById('product-concept').value = '';
  document.getElementById('symptom-category-field').style.display = 'none';
  document.getElementById('refresh-type-field').style.display = 'none';
  document.getElementById('workshop-info-section').style.display = 'none';
  
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
  
  // 제품 컨셉 설정
  const concept = product.concept || 'symptom_care';
  document.getElementById('product-concept').value = concept;
  toggleProductFields();
  
  // 폼 필드 채우기
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-description').value = product.description || '';
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-active').checked = product.is_active === 1;
  
  // 증상케어 제품인 경우
  if (concept === 'symptom_care') {
    document.getElementById('product-category').value = product.category;
    
    // 로컬 공방 정보
    document.getElementById('workshop-name').value = product.workshop_name || '';
    document.getElementById('workshop-location').value = product.workshop_location || '';
    document.getElementById('workshop-address').value = product.workshop_address || '';
    document.getElementById('workshop-contact').value = product.workshop_contact || '';
  }
  // 리프레시 제품인 경우
  else if (concept === 'refresh') {
    document.getElementById('refresh-type').value = product.refresh_type || '';
    document.getElementById('product-volume').value = product.volume || '';
  }
  
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
  
  // 제품 컨셉 확인
  const concept = document.getElementById('product-concept').value;
  if (!concept) {
    alert('제품 컨셉을 선택해주세요.');
    return;
  }
  
  // 폼 데이터 수집
  const productData = {
    name: document.getElementById('product-name').value.trim(),
    description: document.getElementById('product-description').value.trim(),
    concept: concept,
    price: parseInt(document.getElementById('product-price').value),
    stock: parseInt(document.getElementById('product-stock').value),
    thumbnail_image: document.getElementById('thumbnail-image-url').value,
    detail_image: document.getElementById('detail-image-url').value,
    is_active: document.getElementById('product-active').checked ? 1 : 0
  };
  
  // 증상케어 제품인 경우
  if (concept === 'symptom_care') {
    const category = document.getElementById('product-category').value;
    if (!category) {
      alert('증상 카테고리를 선택해주세요.');
      return;
    }
    productData.category = category;
    productData.refresh_type = null;
    
    // 로컬 공방 정보 (선택사항)
    productData.workshop_name = document.getElementById('workshop-name').value.trim() || null;
    productData.workshop_location = document.getElementById('workshop-location').value || null;
    productData.workshop_address = document.getElementById('workshop-address').value.trim() || null;
    productData.workshop_contact = document.getElementById('workshop-contact').value.trim() || null;
  }
  // 리프레시 제품인 경우
  else if (concept === 'refresh') {
    const refreshType = document.getElementById('refresh-type').value;
    if (!refreshType) {
      alert('리프레시 제품 유형을 선택해주세요.');
      return;
    }
    
    const volume = document.getElementById('product-volume').value;
    if (!volume) {
      alert('용량을 선택해주세요.');
      return;
    }
    
    productData.category = 'refresh'; // 리프레시 제품은 category를 'refresh'로 설정
    productData.refresh_type = refreshType;
    productData.volume = volume;
    
    // 리프레시 제품은 공방 정보 없음
    productData.workshop_name = null;
    productData.workshop_location = null;
    productData.workshop_address = null;
    productData.workshop_contact = null;
  }
  
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

// ============================================
// 블로그 관리 기능
// ============================================

// 블로그 게시물 목록 로드
async function loadBlogPosts() {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch('/api/blog-reviews/posts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('블로그 게시물 목록 로드 실패');
    }
    
    const data = await response.json();
    blogPosts = data.posts || [];
    
    // 블로그 개수 업데이트
    document.getElementById('count-blog').textContent = blogPosts.length;
    
    // 블로그 게시물 목록 렌더링
    renderBlogPosts();
    
    // 수동 댓글 추가 드롭다운 업데이트
    updateManualCommentPostSelect();
    
  } catch (error) {
    console.error('블로그 게시물 로드 오류:', error);
  }
}

// 블로그 게시물 목록 렌더링
function renderBlogPosts() {
  const listEl = document.getElementById('blog-posts-list');
  
  if (blogPosts.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-blog text-6xl mb-4"></i>
        <p class="text-lg">등록된 블로그 게시물이 없습니다.</p>
        <p class="text-sm mt-2">상단의 URL 입력란에 블로그 게시물 URL을 입력해주세요.</p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = '';
  
  blogPosts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'border-b border-gray-200 py-4 last:border-b-0';
    
    const commentCount = post.comment_count || 0;
    const purchaseIntentCount = post.purchase_intent_count || 0;
    
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h4 class="font-bold text-gray-800 mb-2">${post.title || '제목 없음'}</h4>
          <div class="flex gap-4 text-sm text-gray-600 mb-2">
            <span><i class="fas fa-link mr-1"></i>게시물 ID: ${post.post_id}</span>
            <span><i class="fas fa-comments mr-1"></i>댓글: ${commentCount}개</span>
            <span><i class="fas fa-shopping-cart mr-1 text-purple-600"></i>구매 의도: ${purchaseIntentCount}개</span>
          </div>
          <div class="flex gap-2 text-xs">
            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">B2C: ${post.b2c_count || 0}</span>
            <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded">B2B: ${post.b2b_count || 0}</span>
            <span class="px-2 py-1 bg-green-100 text-green-800 rounded">챗봇 세션: ${post.chatbot_session_count || 0}</span>
          </div>
        </div>
        <div class="flex gap-2 ml-4">
          <a href="${post.url}" target="_blank" 
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm whitespace-nowrap">
            <i class="fas fa-external-link-alt mr-1"></i>게시물 보기
          </a>
          <button onclick="viewBlogComments('${post.post_id}')" 
            class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 text-sm whitespace-nowrap">
            <i class="fas fa-list mr-1"></i>댓글 보기
          </button>
          <button onclick="openAddCommentModal(${post.id}, '${post.post_id}', '${post.title?.replace(/'/g, "\\'")}', '${post.url}')" 
            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm whitespace-nowrap">
            <i class="fas fa-plus mr-1"></i>댓글 추가
          </button>
        </div>
      </div>
    `;
    
    listEl.appendChild(card);
  });
}

// 블로그 댓글 수집 및 분석
async function crawlBlogComments() {
  const urlInput = document.getElementById('blog-url-input');
  const url = urlInput.value.trim();
  
  if (!url) {
    alert('블로그 게시물 URL을 입력해주세요.');
    return;
  }
  
  // URL 검증 (네이버 블로그)
  if (!url.includes('blog.naver.com')) {
    alert('네이버 블로그 URL만 지원됩니다.\n예: https://blog.naver.com/aromapulse/223921529276');
    return;
  }
  
  const token = localStorage.getItem('auth_token');
  const button = event.target;
  const originalText = button.innerHTML;
  
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>수집 중...';
  
  try {
    const response = await fetch('/api/blog-reviews/crawl-from-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '댓글 수집 실패');
    }
    
    const data = await response.json();
    
    alert(
      `댓글 수집 완료!\n\n` +
      `- 총 댓글: ${data.total_comments}개\n` +
      `- 구매 의도: ${data.purchase_intent_count}개\n` +
      `- B2C: ${data.b2c_count}개\n` +
      `- B2B: ${data.b2b_count}개\n` +
      `- 생성된 챗봇 세션: ${data.chatbot_sessions_created}개`
    );
    
    // URL 입력란 초기화
    urlInput.value = '';
    
    // 블로그 게시물 목록 다시 로드
    loadBlogPosts();
    
    // B2B 리드가 있으면 방금 수집한 포스트의 리드만 표시
    if (data.b2b_count > 0) {
      await loadAndDisplayB2BLeads(data.post_internal_id, data.post_url);
    }
    
  } catch (error) {
    console.error('댓글 수집 오류:', error);
    alert(`댓글 수집 중 오류가 발생했습니다:\n${error.message}`);
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

// 블로그 댓글 보기 (모달 또는 새 창)
async function viewBlogComments(postId) {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`/api/blog-reviews/posts/${postId}/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('댓글 로드 실패');
    }
    
    const data = await response.json();
    const comments = data.comments || [];
    
    // 간단한 alert로 표시 (추후 모달로 개선 가능)
    if (comments.length === 0) {
      alert('댓글이 없습니다.');
      return;
    }
    
    let message = `총 ${comments.length}개의 댓글\n\n`;
    comments.slice(0, 5).forEach((comment, index) => {
      message += `${index + 1}. ${comment.author_name}\n`;
      message += `   ${comment.content.substring(0, 50)}...\n`;
      message += `   의도: ${comment.intent} | 감정: ${comment.sentiment}\n\n`;
    });
    
    if (comments.length > 5) {
      message += `... 외 ${comments.length - 5}개의 댓글`;
    }
    
    alert(message);
    
  } catch (error) {
    console.error('댓글 로드 오류:', error);
    alert('댓글을 불러오는 중 오류가 발생했습니다.');
  }
}

// 수동 댓글 추가
async function addManualComment() {
  const postSelect = document.getElementById('manual-comment-post-select');
  const authorInput = document.getElementById('manual-comment-author');
  const contentInput = document.getElementById('manual-comment-content');
  const dateInput = document.getElementById('manual-comment-date');
  
  const postId = postSelect.value;
  const author = authorInput.value.trim();
  const content = contentInput.value.trim();
  const date = dateInput.value;
  
  // 유효성 검사
  if (!postId) {
    alert('블로그 게시물을 선택해주세요.');
    return;
  }
  
  if (!author) {
    alert('작성자명을 입력해주세요.');
    return;
  }
  
  if (!content) {
    alert('댓글 내용을 입력해주세요.');
    return;
  }
  
  const token = localStorage.getItem('auth_token');
  const button = event.target;
  const originalText = button.innerHTML;
  
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>분석 중...';
  
  try {
    // 날짜 처리 (선택되지 않으면 현재 시간)
    const createdAt = date ? new Date(date).toISOString() : new Date().toISOString();
    
    // 댓글 ID 생성
    const commentId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const response = await fetch('/api/blog-reviews/comments/manual', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_internal_id: parseInt(postId),
        comment_id: commentId,
        author_name: author,
        content: content,
        created_at: createdAt
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '댓글 추가 실패');
    }
    
    const data = await response.json();
    
    alert(
      `댓글 추가 및 분석 완료!\n\n` +
      `작성자: ${author}\n` +
      `감정: ${data.sentiment}\n` +
      `사용자 타입: ${data.user_type || '미분류'}\n` +
      `의도: ${data.intent}\n` +
      `키워드: ${data.keywords.join(', ')}\n\n` +
      (data.chatbot_created ? '✅ 챗봇 세션이 자동 생성되었습니다!' : '')
    );
    
    // 폼 초기화
    clearManualCommentForm();
    
    // 블로그 게시물 목록 다시 로드
    loadBlogPosts();
    
    // B2B 리드가 생성되었으면 표시
    if (data.user_type === 'B2B' && (data.intent === 'B2B문의' || data.intent === '구매의도')) {
      await loadAndDisplayB2BLeads(parseInt(postId), null);
    }
    
  } catch (error) {
    console.error('수동 댓글 추가 오류:', error);
    alert(`댓글 추가 중 오류가 발생했습니다:\n${error.message}`);
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

// 수동 댓글 폼 초기화
function clearManualCommentForm() {
  document.getElementById('manual-comment-post-select').value = '';
  document.getElementById('manual-comment-author').value = '';
  document.getElementById('manual-comment-content').value = '';
  document.getElementById('manual-comment-date').value = '';
}

// 블로그 포스트 선택 드롭다운 업데이트
function updateManualCommentPostSelect() {
  const select = document.getElementById('manual-comment-post-select');
  
  // 기존 옵션 제거 (첫 번째 옵션 제외)
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // 블로그 포스트 목록 추가
  blogPosts.forEach(post => {
    const option = document.createElement('option');
    option.value = post.id; // 내부 ID 사용
    option.textContent = `${post.title} (ID: ${post.post_id})`;
    select.appendChild(option);
  });
}

// B2B 리드 로드 및 표시
async function loadAndDisplayB2BLeads(postId = null, postUrl = null) {
  try {
    // postId가 제공되면 해당 포스트의 리드만 가져오기
    let apiUrl = '/api/blog-reviews/leads?user_type=B2B&dedup=true';
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('B2B 리드 로드 실패');
    }
    
    const data = await response.json();
    let leads = data.leads || [];
    
    // postId가 제공되면 해당 포스트의 리드만 필터링
    if (postId) {
      leads = leads.filter(lead => lead.post_id === parseInt(postId));
    }
    
    if (leads.length === 0) {
      return;
    }
    
    // B2B 리드 표시 영역이 없으면 생성
    let leadsSection = document.getElementById('b2b-leads-section');
    if (!leadsSection) {
      leadsSection = document.createElement('div');
      leadsSection.id = 'b2b-leads-section';
      leadsSection.className = 'bg-white rounded-xl shadow-md p-6 mt-6';
      
      // 블로그 게시물 목록 섹션 다음에 추가
      const blogSection = document.getElementById('blog-management-section');
      if (blogSection) {
        blogSection.appendChild(leadsSection);
      }
    }
    
    // B2B 리드 HTML 생성
    let html = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-800">
          <i class="fas fa-briefcase text-purple-600 mr-2"></i>
          수집된 B2B 리드 (${leads.length}개)
        </h3>
        <a href="/admin/b2b-leads" class="text-purple-600 hover:text-purple-700 font-semibold">
          전체 보기 <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    `;
    
    // 포스트 URL 정보 표시 (제공된 경우)
    if (postUrl && leads.length > 0) {
      html += `
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-gray-700">
            <i class="fas fa-link text-blue-600 mr-2"></i>
            <span class="font-semibold">방금 수집한 포스트:</span>
            <a href="${postUrl}" target="_blank" class="text-blue-600 hover:underline ml-2">
              ${postUrl}
            </a>
          </p>
        </div>
      `;
    }
    
    html += '<div class="space-y-3">';
    
    // 최대 3개만 표시
    leads.slice(0, 3).forEach(lead => {
      const keywords = JSON.parse(lead.keywords || '[]');
      const keywordTags = keywords.slice(0, 3).map(k => 
        `<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">${k}</span>`
      ).join(' ');
      
      html += `
        <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition">
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="font-semibold text-gray-800">${lead.author_name}</span>
              <span class="text-xs text-gray-500 ml-2">${new Date(lead.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              ${lead.intent}
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-2">${lead.content.substring(0, 100)}${lead.content.length > 100 ? '...' : ''}</p>
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              ${keywordTags}
            </div>
            <button onclick="window.location.href='/admin/chatbot'" 
              class="text-purple-600 hover:text-purple-700 text-sm font-semibold">
              챗봇 보기 <i class="fas fa-robot ml-1"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    if (leads.length > 3) {
      html += `
        <div class="text-center pt-3">
          <a href="/admin/b2b-leads" class="text-gray-500 hover:text-purple-600 text-sm">
            + ${leads.length - 3}개 더 보기
          </a>
        </div>
      `;
    }
    
    html += '</div>';
    leadsSection.innerHTML = html;
    
    // 스크롤해서 리드 섹션 보이기
    setTimeout(() => {
      leadsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
    
  } catch (error) {
    console.error('B2B 리드 로드 오류:', error);
  }
}

// 댓글 추가 모달 관련 변수
let selectedPostForComment = null;

// 댓글 추가 모달 열기
function openAddCommentModal(postInternalId, postId, postTitle, postUrl) {
  selectedPostForComment = {
    internalId: postInternalId,
    postId: postId,
    title: postTitle,
    url: postUrl
  };
  
  // 포스트 정보 표시
  document.getElementById('add-comment-post-info').innerHTML = `
    <div>
      <p class="text-sm font-semibold text-gray-700 mb-1">선택한 게시물:</p>
      <p class="text-gray-800 font-medium">${postTitle}</p>
      <a href="${postUrl}" target="_blank" class="text-blue-600 hover:underline text-sm">
        <i class="fas fa-external-link-alt mr-1"></i>${postUrl}
      </a>
    </div>
  `;
  
  // 폼 초기화
  document.getElementById('comment-author').value = '';
  document.getElementById('comment-content').value = '';
  document.getElementById('comment-date').value = '';
  
  // 모달 표시
  document.getElementById('add-comment-modal').classList.remove('hidden');
}

// 댓글 추가 모달 닫기
function closeAddCommentModal() {
  document.getElementById('add-comment-modal').classList.add('hidden');
  selectedPostForComment = null;
}

// 댓글 추가 폼 제출
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('add-comment-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await submitManualComment();
    });
  }
});

// 수동 댓글 추가 제출
async function submitManualComment() {
  if (!selectedPostForComment) {
    alert('포스트가 선택되지 않았습니다.');
    return;
  }
  
  const author = document.getElementById('comment-author').value.trim();
  const content = document.getElementById('comment-content').value.trim();
  const dateInput = document.getElementById('comment-date').value;
  
  if (!author || !content) {
    alert('작성자명과 댓글 내용을 모두 입력해주세요.');
    return;
  }
  
  const token = localStorage.getItem('auth_token');
  const submitButton = document.querySelector('#add-comment-form button[type="submit"]');
  const originalText = submitButton.innerHTML;
  
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>추가 중...';
  
  try {
    // 날짜 처리
    let createdAt = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();
    
    const response = await fetch('/api/blog-reviews/comments/manual', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_internal_id: selectedPostForComment.internalId,
        author_name: author,
        content: content,
        created_at: createdAt
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '댓글 추가 실패');
    }
    
    const data = await response.json();
    
    alert(
      `댓글 추가 완료!\n\n` +
      `- 작성자: ${author}\n` +
      `- 감정: ${data.sentiment}\n` +
      `- 사용자 타입: ${data.user_type || '미분류'}\n` +
      `- 의도: ${data.intent}\n` +
      (data.chatbot_created ? `- 챗봇 세션 자동 생성됨` : '')
    );
    
    // 모달 닫기
    closeAddCommentModal();
    
    // 블로그 포스트 목록 새로고침
    loadBlogPosts();
    
    // B2B 댓글이면 리드 표시
    if (data.user_type === 'B2B' && (data.intent === 'B2B문의' || data.intent === '구매의도')) {
      await loadAndDisplayB2BLeads(selectedPostForComment.internalId, selectedPostForComment.url);
    }
    
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    alert(`댓글 추가 중 오류가 발생했습니다:\n${error.message}`);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
}
