// Admin Product Management JavaScript
// 관리자 제품 관리 시스템

let currentProducts = [];
let filteredProducts = [];
let currentTab = 'all';
let isEditing = false;
let editingProductId = null;
let blogPosts = [];
let currentPeriod = 'all'; // 대시보드 기간 필터 (today, week, month, all)

// 클래스 관리 관련 변수
let currentClasses = [];
let filteredClasses = [];
let isEditingClass = false;
let editingClassId = null;
let currentMainTab = 'products'; // 'products' 또는 'classes'

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProducts();
  loadBlogPosts();
  loadDashboardStats(); // 대시보드 통계 로드
  
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
  
  // 클래스 폼 제출 이벤트
  document.getElementById('class-form').addEventListener('submit', handleClassFormSubmit);
  
  // 클래스 모달 외부 클릭시 닫기
  document.getElementById('class-modal').addEventListener('click', (e) => {
    if (e.target.id === 'class-modal') {
      closeClassModal();
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
  
  // 섹션 표시/숨김
  document.getElementById('dashboard-section').classList.add('hidden');
  document.getElementById('products-grid').style.display = 'none';
  document.getElementById('blog-management-section').classList.add('hidden');
  document.getElementById('loading').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('product-search-filter').style.display = 'none';
  
  // 대시보드 탭
  if (tab === 'dashboard') {
    document.getElementById('dashboard-section').classList.remove('hidden');
    loadDashboardStats(); // 통계 새로고침
  } 
  // 블로그 관리 탭인 경우
  else if (tab === 'blog') {
    document.getElementById('blog-management-section').classList.remove('hidden');
  } 
  // 제품 목록 탭
  else {
    document.getElementById('products-grid').style.display = 'grid';
    document.getElementById('product-search-filter').style.display = 'block';
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
  
  // 검색/필터 적용
  applySearchAndFilter();
}

// 검색 및 필터 적용
function applySearchAndFilter() {
  const searchInput = document.getElementById('search-input');
  const priceFilter = document.getElementById('price-filter');
  const sortFilter = document.getElementById('sort-filter');
  
  if (!searchInput || !priceFilter || !sortFilter) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const priceRange = priceFilter.value;
  const sortOption = sortFilter.value;
  
  // 검색어 필터링
  let results = filteredProducts.filter(product => {
    return product.name.toLowerCase().includes(searchTerm) ||
           (product.description && product.description.toLowerCase().includes(searchTerm));
  });
  
  // 가격 범위 필터링
  if (priceRange) {
    const [minPrice, maxPrice] = priceRange.split('-').map(Number);
    results = results.filter(product => {
      return product.price >= minPrice && product.price <= maxPrice;
    });
  }
  
  // 정렬
  results.sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name, 'ko');
      default:
        return 0;
    }
  });
  
  // 결과 렌더링
  const gridEl = document.getElementById('products-grid');
  gridEl.innerHTML = '';
  
  // 검색 결과 카운트 업데이트
  const countEl = document.getElementById('filter-result-count');
  if (countEl) {
    countEl.textContent = results.length;
  }
  
  // 빈 상태 확인
  if (results.length === 0) {
    gridEl.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-500">
        <i class="fas fa-search text-6xl mb-4"></i>
        <p class="text-lg">검색 결과가 없습니다.</p>
        <p class="text-sm mt-2">다른 검색어나 필터를 시도해보세요.</p>
      </div>
    `;
    return;
  }
  
  // 제품 카드 렌더링
  results.forEach(product => {
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
  const itemsPerBoxField = document.getElementById('items-per-box-field');
  const workshopSection = document.getElementById('workshop-info-section');
  const categorySelect = document.getElementById('product-category');
  const refreshSelect = document.getElementById('refresh-type');
  const volumeSelect = document.getElementById('product-volume');
  const itemsPerBoxInput = document.getElementById('items-per-box');
  const stockLabel = document.getElementById('stock-label');
  const stockHelper = document.getElementById('stock-helper');
  const stockHelperText = document.getElementById('stock-helper-text');
  
  if (concept === 'symptom_care') {
    // 증상케어 제품
    symptomField.style.display = 'block';
    refreshField.style.display = 'none';
    volumeField.style.display = 'none';
    itemsPerBoxField.style.display = 'none';
    workshopSection.style.display = 'block';
    categorySelect.required = true;
    refreshSelect.required = false;
    volumeSelect.required = false;
    itemsPerBoxInput.required = false;
    refreshSelect.value = '';
    volumeSelect.value = '';
    
    // 재고 라벨 변경 (개별 개수)
    stockLabel.textContent = '재고 수량';
    stockHelper.style.display = 'none';
  } else if (concept === 'refresh') {
    // 리프레시 제품
    symptomField.style.display = 'none';
    refreshField.style.display = 'block';
    volumeField.style.display = 'block';
    itemsPerBoxField.style.display = 'block';
    workshopSection.style.display = 'none';
    categorySelect.required = false;
    refreshSelect.required = true;
    volumeSelect.required = true;
    itemsPerBoxInput.required = true;
    categorySelect.value = '';
    // 공방 정보 초기화
    document.getElementById('workshop-name').value = '';
    document.getElementById('workshop-location').value = '';
    document.getElementById('workshop-address').value = '';
    document.getElementById('workshop-contact').value = '';
    
    // 재고 라벨 변경 (박스 수)
    stockLabel.textContent = '재고 수량 (박스)';
    stockHelper.style.display = 'block';
    stockHelperText.textContent = '1박스 = 2개입 기준';
  } else {
    // 선택 안 함
    symptomField.style.display = 'none';
    refreshField.style.display = 'none';
    volumeField.style.display = 'none';
    itemsPerBoxField.style.display = 'none';
    workshopSection.style.display = 'none';
    categorySelect.required = false;
    refreshSelect.required = false;
    volumeSelect.required = false;
    itemsPerBoxInput.required = false;
  }
}

// 인증 확인
async function checkAuth() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.href = '/static/admin-login.html';
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
      localStorage.removeItem('adminToken'); localStorage.removeItem('auth_token');
      window.location.href = '/static/admin-login.html';
      return false;
    }
    
    // 사용자 정보 표시 (회사명으로 고정)
    document.getElementById('user-name').textContent = '웰씨코리아';
    
    return true;
  } catch (error) {
    console.error('인증 오류:', error);
    alert('인증에 실패했습니다. 다시 로그인해주세요.');
    localStorage.removeItem('adminToken'); localStorage.removeItem('auth_token');
    window.location.href = '/static/admin-login.html';
    return false;
  }
}

// 제품 목록 로드
async function loadProducts() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
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
  card.setAttribute('data-product-id', product.id); // 대시보드에서 스크롤 이동용
  
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
         ${product.items_per_box ? ` · <span class="text-purple-800">${product.items_per_box}개입</span>` : ''}
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
        <span class="text-sm text-gray-500">재고: ${product.stock}${product.concept === 'refresh' ? '박스' : '개'}</span>
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
    // items_per_box는 항상 2로 고정
    document.getElementById('items-per-box').value = 2;
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
// 이미지 자동 압축 함수
async function compressImage(file, maxSizeKB = 500, maxWidth = 1200, maxHeight = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 이미지 비율 유지하면서 크기 조정
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // 압축 품질 조정하면서 목표 크기 달성
        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('이미지 압축 실패'));
              return;
            }
            
            const sizeKB = blob.size / 1024;
            
            // 목표 크기 이하면 완료
            if (sizeKB <= maxSizeKB || quality <= 0.1) {
              // Blob을 File로 변환
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              console.log(`이미지 압축 완료: ${Math.round(file.size / 1024)}KB → ${Math.round(compressedFile.size / 1024)}KB (품질: ${Math.round(quality * 100)}%)`);
              resolve(compressedFile);
            } else {
              // 품질 낮춰서 재시도
              quality -= 0.1;
              tryCompress();
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.onerror = () => {
        reject(new Error('이미지 로드 실패'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };
    
    reader.readAsDataURL(file);
  });
}

async function uploadImage(type) {
  const inputId = type === 'thumbnail' ? 'thumbnail-upload' : 'detail-upload';
  const input = document.getElementById(inputId);
  const file = input.files[0];
  
  if (!file) {
    alert('이미지 파일을 선택해주세요.');
    return;
  }
  
  // 파일 형식 확인
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.');
    return;
  }
  
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  const uploadBtn = event.target;
  const originalText = uploadBtn.textContent;
  
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 압축 중...';
  
  try {
    let processedFile = file;
    
    // 파일 크기가 500KB보다 크면 자동 압축
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      console.log(`이미지 크기가 큽니다 (${Math.round(file.size / 1024)}KB). 자동 압축을 시작합니다...`);
      uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 자동 압축 중...';
      
      // 대표 이미지는 1200x1200, 상세 이미지는 750px 너비로 제한
      const maxWidth = type === 'thumbnail' ? 1200 : 750;
      const maxHeight = type === 'thumbnail' ? 1200 : 10000; // 상세 이미지는 세로로 길 수 있음
      
      processedFile = await compressImage(file, 500, maxWidth, maxHeight);
      
      alert(`✅ 이미지 자동 압축 완료!\n원본: ${Math.round(file.size / 1024)}KB → 압축 후: ${Math.round(processedFile.size / 1024)}KB`);
    }
    
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 업로드 중...';
    
    const formData = new FormData();
    formData.append('image', processedFile);
    
    const response = await fetch('/api/admin-products/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '이미지 업로드 실패');
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
  
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
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
    
    const itemsPerBox = parseInt(document.getElementById('items-per-box').value);
    if (!itemsPerBox || itemsPerBox < 1) {
      alert('박스 구성을 선택해주세요.');
      return;
    }
    
    productData.category = 'refresh'; // 리프레시 제품은 category를 'refresh'로 설정
    productData.refresh_type = refreshType;
    productData.volume = volume;
    productData.items_per_box = itemsPerBox;
    
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
  
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  
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
  localStorage.removeItem('adminToken');
  localStorage.removeItem('auth_token');
  window.location.href = '/static/admin-login.html';
}

// ============================================
// 블로그 관리 기능
// ============================================

// 블로그 게시물 목록 로드
async function loadBlogPosts() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  
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
  
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
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
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  
  console.log('=== 댓글 보기 클릭 ===');
  console.log('요청한 게시물 ID:', postId);
  
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
    
    console.log('API 응답 데이터:', data);
    console.log('받은 댓글 수:', comments.length);
    console.log('댓글 목록:', comments);
    
    if (comments.length === 0) {
      alert('댓글이 없습니다.');
      return;
    }
    
    // 모달 표시
    displayCommentsModal(comments, postId);
    
  } catch (error) {
    console.error('댓글 로드 오류:', error);
    alert('댓글을 불러오는 중 오류가 발생했습니다.');
  }
}

// 댓글 모달 표시
function displayCommentsModal(comments, postId) {
  const modal = document.getElementById('view-comments-modal');
  const container = document.getElementById('comments-container');
  const postInfo = document.getElementById('comment-modal-post-info');
  
  console.log('=== 모달 표시 시작 ===');
  console.log('표시할 게시물 ID:', postId);
  console.log('표시할 댓글 수:', comments.length);
  
  // 포스트 정보 표시 (게시물 ID 포함)
  postInfo.textContent = `게시물 ${postId} - 총 ${comments.length}개의 댓글`;
  
  // 컨테이너 초기화 (중요!)
  container.innerHTML = '';
  console.log('컨테이너 초기화 완료');
  
  // 댓글이 없는 경우
  if (comments.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-comments text-6xl mb-4 text-gray-300"></i>
        <p class="text-lg">등록된 댓글이 없습니다.</p>
      </div>
    `;
  } else {
    // 댓글 카드 생성
    comments.forEach((comment, index) => {
      console.log(`댓글 ${index + 1} 추가 중:`, comment.id, comment.author_name);
      const card = createCommentCard(comment, index + 1);
      container.appendChild(card);
    });
  }
  
  console.log('모달 표시 완료 - 최종 댓글 수:', container.children.length);
  
  // 모달 표시
  modal.classList.remove('hidden');
}

// 댓글 카드 생성
function createCommentCard(comment, index) {
  const card = document.createElement('div');
  card.className = 'bg-white border border-gray-200 rounded-xl p-5 mb-4 hover:shadow-lg transition duration-200';
  
  // 감정 이모지
  const sentimentEmoji = comment.sentiment === 'positive' ? '😊' : 
                        comment.sentiment === 'negative' ? '😔' : '😐';
  
  // 의도 색상
  const intentColor = comment.intent === 'B2B문의' ? 'bg-purple-100 text-purple-800' :
                     comment.intent === '구매의도' ? 'bg-green-100 text-green-800' :
                     comment.intent === '가격문의' ? 'bg-blue-100 text-blue-800' :
                     comment.intent === '긍정리뷰' ? 'bg-pink-100 text-pink-800' :
                     'bg-gray-100 text-gray-800';
  
  // 사용자 타입 배지
  const userTypeBadge = comment.user_type_prediction === 'B2B' ? 
    '<span class="px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">B2B</span>' :
    comment.user_type_prediction === 'B2C' ?
    '<span class="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">B2C</span>' :
    '<span class="px-2 py-1 bg-gray-400 text-white text-xs font-semibold rounded-full">일반</span>';
  
  // 날짜 포맷팅
  const date = new Date(comment.created_at);
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  
  // 키워드 파싱
  let keywords = [];
  try {
    keywords = comment.keywords ? JSON.parse(comment.keywords) : [];
  } catch (e) {
    keywords = [];
  }
  
  card.innerHTML = `
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
          ${comment.author_name.charAt(0)}
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h4 class="font-bold text-gray-800">${comment.author_name}</h4>
            ${userTypeBadge}
          </div>
          <p class="text-xs text-gray-500">
            <i class="far fa-clock mr-1"></i>${formattedDate}
          </p>
        </div>
      </div>
      <span class="text-2xl">${sentimentEmoji}</span>
    </div>
    
    <div class="mb-3">
      <p class="text-gray-700 leading-relaxed">${comment.content}</p>
    </div>
    
    <div class="flex flex-wrap gap-2 mb-3">
      <span class="px-3 py-1 ${intentColor} text-xs font-semibold rounded-full">
        <i class="fas fa-tag mr-1"></i>${comment.intent}
      </span>
      ${keywords.map(kw => 
        `<span class="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
          <i class="fas fa-key mr-1"></i>${kw}
        </span>`
      ).join('')}
    </div>
    
    <div class="flex items-center justify-between pt-3 border-t border-gray-100">
      <div class="flex items-center space-x-4 text-xs text-gray-500">
        <span><i class="fas fa-heart mr-1 text-red-400"></i>감정: ${comment.sentiment}</span>
        <span><i class="fas fa-bullseye mr-1 text-blue-400"></i>의도: ${comment.intent}</span>
      </div>
      <span class="text-xs font-semibold text-gray-400">#${index}</span>
    </div>
  `;
  
  return card;
}

// 댓글 모달 닫기
function closeViewCommentsModal() {
  document.getElementById('view-comments-modal').classList.add('hidden');
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
  
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  const button = event.target;
  const originalText = button.innerHTML;
  
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>분석 중...';
  
  try {
    // 날짜 처리 - 사용자가 입력한 텍스트를 파싱
    let createdAt;
    if (date && date.trim()) {
      const trimmedInput = date.trim();
      
      try {
        // "2025-11-15 10:30" 또는 "2025-11-15" 형식 파싱
        if (trimmedInput.includes(' ') && trimmedInput.includes(':')) {
          // "2025-11-15 10:30" 형식 - 그대로 사용
          createdAt = new Date(trimmedInput + ':00+09:00').toISOString();
        } else if (trimmedInput.includes(':')) {
          // "10:30" 형식 - 오늘 날짜와 결합
          const today = new Date().toISOString().split('T')[0];
          createdAt = new Date(`${today} ${trimmedInput}:00+09:00`).toISOString();
        } else {
          // "2025-11-15" 형식 - 현재 시간 추가
          const now = new Date();
          const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
          createdAt = new Date(`${trimmedInput} ${timeString}+09:00`).toISOString();
        }
      } catch (error) {
        console.error('날짜 파싱 오류:', error);
        createdAt = new Date().toISOString();
      }
    } else {
      // 입력 없으면 현재 시간
      createdAt = new Date().toISOString();
    }
    
    const response = await fetch('/api/blog-reviews/comments/manual', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_internal_id: parseInt(postId),
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
    
    // AI 분석 결과 표시
    const analysis = data.analysis;
    let alertMessage = `✅ 댓글 추가 완료!\n\n`;
    alertMessage += `📝 작성자: ${author}\n`;
    alertMessage += `📊 AI 분석 결과:\n`;
    alertMessage += `  - 감정: ${analysis.sentiment === 'positive' ? '긍정😊' : analysis.sentiment === 'negative' ? '부정😔' : '중립😐'}\n`;
    alertMessage += `  - 사용자 타입: ${analysis.user_type || '일반 고객'}\n`;
    alertMessage += `  - 의도: ${analysis.intent}\n`;
    if (analysis.keywords && analysis.keywords.length > 0) {
      alertMessage += `  - 키워드: ${analysis.keywords.join(', ')}\n`;
    }
    if (data.chatbot_session_created) {
      alertMessage += `\n🤖 챗봇 세션이 자동으로 생성되었습니다!`;
    }
    
    alert(alertMessage);
    
    // 폼 초기화
    clearManualCommentForm();
    
    // 블로그 게시물 목록 다시 로드
    loadBlogPosts();
    
    // B2B 리드가 생성되었으면 표시
    if (analysis.user_type === 'B2B' && (analysis.intent === 'B2B문의' || analysis.intent === '구매의도')) {
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
  // 폼 리셋
  document.getElementById('add-comment-form').reset();
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
  
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  const submitButton = document.querySelector('#add-comment-form button[type="submit"]');
  const originalText = submitButton.innerHTML;
  
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>추가 중...';
  
  try {
    // 날짜 처리 - 사용자가 입력한 텍스트를 파싱
    let createdAt;
    if (dateInput && dateInput.trim()) {
      const trimmedInput = dateInput.trim();
      
      try {
        // "2025-11-15 10:30" 또는 "2025-11-15" 형식 파싱
        if (trimmedInput.includes(' ') && trimmedInput.includes(':')) {
          // "2025-11-15 10:30" 형식 - 그대로 사용
          createdAt = new Date(trimmedInput + ':00+09:00').toISOString();
        } else if (trimmedInput.includes(':')) {
          // "10:30" 형식 - 오늘 날짜와 결합
          const today = new Date().toISOString().split('T')[0];
          createdAt = new Date(`${today} ${trimmedInput}:00+09:00`).toISOString();
        } else {
          // "2025-11-15" 형식 - 현재 시간 추가
          const now = new Date();
          const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
          createdAt = new Date(`${trimmedInput} ${timeString}+09:00`).toISOString();
        }
      } catch (error) {
        console.error('날짜 파싱 오류:', error);
        createdAt = new Date().toISOString();
      }
    } else {
      // 입력 없으면 현재 시간
      createdAt = new Date().toISOString();
    }
    
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
    
    // AI 분석 결과 표시
    const analysis = data.analysis;
    let alertMessage = `✅ 댓글 추가 완료!\n\n`;
    alertMessage += `📝 작성자: ${author}\n`;
    alertMessage += `📊 AI 분석 결과:\n`;
    alertMessage += `  - 감정: ${analysis.sentiment === 'positive' ? '긍정😊' : analysis.sentiment === 'negative' ? '부정😔' : '중립😐'}\n`;
    alertMessage += `  - 사용자 타입: ${analysis.user_type || '일반 고객'}\n`;
    alertMessage += `  - 의도: ${analysis.intent}\n`;
    if (analysis.keywords && analysis.keywords.length > 0) {
      alertMessage += `  - 키워드: ${analysis.keywords.join(', ')}\n`;
    }
    if (data.chatbot_session_created) {
      alertMessage += `\n🤖 챗봇 세션이 자동으로 생성되었습니다!`;
    }
    
    alert(alertMessage);
    
    // 모달 닫기 (폼 리셋 포함)
    closeAddCommentModal();
    
    // 블로그 포스트 목록 새로고침
    loadBlogPosts();
    
    // B2B 댓글이면 리드 표시
    if (analysis.user_type === 'B2B' && (analysis.intent === 'B2B문의' || analysis.intent === '구매의도')) {
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

// ============================================
// 대시보드 기능
// ============================================

// 기간 변경
function changePeriod(period) {
  currentPeriod = period;
  
  // 버튼 스타일 업데이트
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.remove('bg-purple-600', 'text-white');
    btn.classList.add('border-gray-300', 'text-gray-700');
  });
  
  const activeBtn = document.getElementById(`period-${period}`);
  activeBtn.classList.add('bg-purple-600', 'text-white');
  activeBtn.classList.remove('border-gray-300', 'text-gray-700');
  
  // 통계 새로고침
  loadDashboardStats();
}

// 날짜 범위 계산
function getDateRange(period) {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      // 이번 주 월요일
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all':
    default:
      return null; // 전체 기간
  }
  
  return startDate.toISOString();
}

// 대시보드 통계 로드
async function loadDashboardStats() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  
  try {
    const dateFilter = getDateRange(currentPeriod);
    let url = '/api/admin-products/dashboard/stats';
    if (dateFilter) {
      url += `?start_date=${encodeURIComponent(dateFilter)}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('통계 조회 실패');
    }
    
    const data = await response.json();
    
    // 제품 통계
    document.getElementById('stat-total-products').textContent = data.products.total_products || 0;
    document.getElementById('stat-active-products').textContent = data.products.active_products || 0;
    document.getElementById('stat-inactive-products').textContent = data.products.inactive_products || 0;
    document.getElementById('stat-symptom-care').textContent = data.products.symptom_care_count || 0;
    document.getElementById('stat-refresh').textContent = data.products.refresh_count || 0;
    
    // 블로그 통계
    document.getElementById('stat-total-posts').textContent = data.blog.total_posts || 0;
    document.getElementById('stat-total-comments').textContent = data.blog.total_comments || 0;
    
    // 댓글 통계
    document.getElementById('stat-b2b-comments').textContent = data.comments.b2b_comments || 0;
    document.getElementById('stat-b2c-comments').textContent = data.comments.b2c_comments || 0;
    document.getElementById('stat-purchase-intent').textContent = data.comments.purchase_intent_comments || 0;
    document.getElementById('stat-positive-comments').textContent = data.comments.positive_comments || 0;
    document.getElementById('stat-neutral-comments').textContent = data.comments.neutral_comments || 0;
    document.getElementById('stat-negative-comments').textContent = data.comments.negative_comments || 0;
    
    // 챗봇 통계
    document.getElementById('stat-total-sessions').textContent = data.chatbot.total_sessions || 0;
    document.getElementById('stat-active-sessions').textContent = data.chatbot.active_sessions || 0;
    document.getElementById('stat-completed-sessions').textContent = data.chatbot.completed_sessions || 0;
    
    // 최근 제품 렌더링
    renderRecentProducts(data.recent.products || []);
    
    // 최근 포스트 렌더링
    renderRecentPosts(data.recent.posts || []);
    
    // 최근 댓글 렌더링
    renderRecentComments(data.recent.comments || []);
    
  } catch (error) {
    console.error('대시보드 통계 로드 오류:', error);
  }
}

// 최근 제품 렌더링
function renderRecentProducts(products) {
  const container = document.getElementById('recent-products-list');
  
  if (products.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-500">최근 등록된 제품이 없습니다.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  products.forEach(product => {
    const item = document.createElement('div');
    item.className = 'border-l-4 border-purple-500 pl-3 py-2 hover:bg-gray-50 cursor-pointer transition';
    item.onclick = () => {
      switchTab('all');
      setTimeout(() => {
        const productCard = document.querySelector(`[data-product-id="${product.id}"]`);
        if (productCard) {
          productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          productCard.classList.add('ring-2', 'ring-purple-500');
          setTimeout(() => productCard.classList.remove('ring-2', 'ring-purple-500'), 2000);
        }
      }, 100);
    };
    
    const conceptBadge = product.concept === 'refresh' ? '🌿' : '💊';
    const date = new Date(product.created_at).toLocaleDateString('ko-KR');
    
    item.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-semibold text-gray-800">${conceptBadge} ${product.name}</span>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>${product.price.toLocaleString()}원</span>
        <span>${date}</span>
      </div>
    `;
    
    container.appendChild(item);
  });
}

// 최근 포스트 렌더링
function renderRecentPosts(posts) {
  const container = document.getElementById('recent-posts-list');
  
  if (posts.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-500">최근 등록된 포스트가 없습니다.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  posts.forEach(post => {
    const item = document.createElement('div');
    item.className = 'border-l-4 border-blue-500 pl-3 py-2 hover:bg-gray-50 cursor-pointer transition';
    item.onclick = () => {
      switchTab('blog');
    };
    
    const date = new Date(post.published_at).toLocaleDateString('ko-KR');
    
    item.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-semibold text-gray-800 line-clamp-1">${post.title}</span>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>💬 ${post.comment_count}개</span>
        <span>${date}</span>
      </div>
    `;
    
    container.appendChild(item);
  });
}

// 최근 댓글 렌더링
function renderRecentComments(comments) {
  const container = document.getElementById('recent-comments-list');
  
  if (comments.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-500">최근 댓글이 없습니다.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  comments.forEach(comment => {
    const item = document.createElement('div');
    item.className = 'border-l-4 border-green-500 pl-3 py-2 hover:bg-gray-50 transition';
    
    const userTypeBadge = comment.user_type_prediction === 'B2B' ? '🏢' : 
                          comment.user_type_prediction === 'B2C' ? '🛍️' : '👤';
    const intentIcon = comment.intent === '구매의도' ? '💰' : 
                      comment.intent === 'B2B문의' ? '📧' : '💬';
    
    const date = new Date(comment.created_at).toLocaleDateString('ko-KR');
    
    item.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-semibold text-gray-800">${userTypeBadge} ${comment.author_name}</span>
        <span class="text-xs">${intentIcon}</span>
      </div>
      <p class="text-xs text-gray-600 line-clamp-2 mb-1">${comment.content}</p>
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span class="line-clamp-1">${comment.post_title || '게시물 없음'}</span>
        <span>${date}</span>
      </div>
    `;
    
    container.appendChild(item);
  });
}

// 새 블로그 게시물 추가
async function addNewBlogPost() {
  const urlInput = document.getElementById('new-post-url-input');
  const dateInput = document.getElementById('new-post-date-input');
  const url = urlInput.value.trim();
  const dateInput_value = dateInput.value;
  
  if (!url) {
    alert('블로그 게시물 URL을 입력해주세요.');
    return;
  }
  
  // 네이버 블로그 URL 형식 검증
  const naverBlogPattern = /^https?:\/\/blog\.naver\.com\/[^\/]+\/\d+$/;
  if (!naverBlogPattern.test(url)) {
    alert('올바른 네이버 블로그 URL 형식이 아닙니다.\n\n예시: https://blog.naver.com/aromapulse/223871244762');
    return;
  }
  
  // post_id 추출 (URL의 마지막 숫자 부분)
  const postIdMatch = url.match(/\/(\d+)$/);
  if (!postIdMatch) {
    alert('게시물 ID를 추출할 수 없습니다.');
    return;
  }
  
  const postId = postIdMatch[1];
  
  // 제목 입력 받기
  const title = prompt('게시물 제목을 입력하세요:\n\n(비워두면 "블로그 게시물"로 저장됩니다)', '');
  if (title === null) {
    return; // 취소
  }
  
  const finalTitle = title.trim() || `블로그 게시물 ${postId}`;
  
  // 날짜 처리 - 댓글과 동일한 로직
  let publishedAtFormatted;
  if (dateInput_value && dateInput_value.trim()) {
    const trimmedInput = dateInput_value.trim();
    
    try {
      // "2025-04-29 09:00" 또는 "2025-04-29" 형식 파싱
      if (trimmedInput.includes(' ') && trimmedInput.includes(':')) {
        // "2025-04-29 09:00" 형식 - 초 추가하여 사용
        publishedAtFormatted = trimmedInput.includes(':') && trimmedInput.split(':').length === 2
          ? trimmedInput + ':00'
          : trimmedInput;
      } else if (trimmedInput.includes(':')) {
        // "09:00" 형식 - 오늘 날짜와 결합
        const today = new Date().toISOString().split('T')[0];
        publishedAtFormatted = `${today} ${trimmedInput}:00`;
      } else {
        // "2025-04-29" 형식 - 현재 시간 추가
        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        publishedAtFormatted = `${trimmedInput} ${timeString}`;
      }
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      // 현재 시간으로 대체
      const now = new Date();
      publishedAtFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    }
  } else {
    // 입력 없으면 현재 시간
    const now = new Date();
    publishedAtFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  }
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch('/api/blog-reviews/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        post_id: postId,
        url: url,
        title: finalTitle,
        published_at: publishedAtFormatted
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '게시물 추가 실패');
    }
    
    const result = await response.json();
    
    alert(`✅ 게시물이 추가되었습니다!\n\n제목: ${finalTitle}\n\n이제 아래 "수동 댓글 추가"에서 댓글을 입력하실 수 있습니다.`);
    
    // 입력란 초기화
    urlInput.value = '';
    dateInput.value = '';
    
    // 블로그 포스트 목록 새로고침
    await loadBlogPosts();
    
  } catch (error) {
    console.error('게시물 추가 오류:', error);
    alert(`게시물 추가 중 오류가 발생했습니다:\n${error.message}`);
  }
}

// ============================================
// 클래스 관리 함수들
// ============================================

// 메인 탭 전환 (제품 관리 / 클래스 관리)
function switchTab(tab) {
  if (tab === 'products') {
    currentMainTab = 'products';
    document.getElementById('tab-products').classList.add('bg-purple-600', 'text-white');
    document.getElementById('tab-products').classList.remove('text-gray-700', 'hover:bg-gray-100');
    document.getElementById('tab-classes').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('tab-classes').classList.add('text-gray-700', 'hover:bg-gray-100');
    document.getElementById('tab-oneday-classes').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('tab-oneday-classes').classList.add('text-gray-700', 'hover:bg-gray-100');
    
    document.getElementById('content-products').style.display = 'block';
    document.getElementById('content-classes').style.display = 'none';
    document.getElementById('content-oneday-classes').style.display = 'none';
  } else if (tab === 'classes') {
    currentMainTab = 'classes';
    document.getElementById('tab-classes').classList.add('bg-purple-600', 'text-white');
    document.getElementById('tab-classes').classList.remove('text-gray-700', 'hover:bg-gray-100');
    document.getElementById('tab-products').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('tab-products').classList.add('text-gray-700', 'hover:bg-gray-100');
    document.getElementById('tab-oneday-classes').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('tab-oneday-classes').classList.add('text-gray-700', 'hover:bg-gray-100');
    
    document.getElementById('content-products').style.display = 'none';
    document.getElementById('content-classes').style.display = 'block';
    document.getElementById('content-oneday-classes').style.display = 'none';
    
    // 워크샵 로드
    loadClasses();
  } else if (tab === 'oneday-classes') {
    currentMainTab = 'oneday-classes';
    document.getElementById('tab-oneday-classes').classList.add('bg-purple-600', 'text-white');
    document.getElementById('tab-oneday-classes').classList.remove('text-gray-700', 'hover:bg-gray-100');
    document.getElementById('tab-products').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('tab-products').classList.add('text-gray-700', 'hover:bg-gray-100');
    document.getElementById('tab-classes').classList.remove('bg-purple-600', 'text-white');
    document.getElementById('tab-classes').classList.add('text-gray-700', 'hover:bg-gray-100');
    
    document.getElementById('content-products').style.display = 'none';
    document.getElementById('content-classes').style.display = 'none';
    document.getElementById('content-oneday-classes').style.display = 'block';
    
    // 원데이 클래스 로드
    loadOnedayClasses();
  }
}

// 클래스 목록 로드
async function loadClasses() {
  try {
    document.getElementById('class-loading').style.display = 'block';
    document.getElementById('classes-grid').innerHTML = '';
    document.getElementById('class-empty-state').style.display = 'none';
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/workshops?type=workshop&limit=100', {
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('클래스 목록 조회 실패');
    }
    
    currentClasses = await response.json();
    filteredClasses = currentClasses;
    
    document.getElementById('class-loading').style.display = 'none';
    
    if (currentClasses.length === 0) {
      document.getElementById('class-empty-state').style.display = 'block';
    } else {
      renderClasses();
    }
    
  } catch (error) {
    console.error('클래스 로드 오류:', error);
    document.getElementById('class-loading').style.display = 'none';
    alert('클래스 목록을 불러오는데 실패했습니다.');
  }
}

// 클래스 렌더링
function renderClasses() {
  const grid = document.getElementById('classes-grid');
  grid.innerHTML = '';
  
  document.getElementById('class-filter-result-count').textContent = filteredClasses.length;
  
  filteredClasses.forEach(classItem => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-md hover:shadow-lg transition p-6';
    
    const statusBadge = classItem.is_active 
      ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">활성</span>'
      : '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">비활성</span>';
    
    const imageUrl = classItem.image_url || '/static/placeholder-class.jpg';
    const price = classItem.price ? `${classItem.price.toLocaleString()}원` : '가격 미정';
    const duration = classItem.duration ? `${classItem.duration}분` : '시간 미정';
    const maxParticipants = classItem.max_participants ? `최대 ${classItem.max_participants}명` : '인원 제한 없음';
    
    card.innerHTML = `
      <div class="mb-4">
        <img src="${imageUrl}" alt="${classItem.title}" 
          class="w-full h-48 object-cover rounded-lg" 
          onerror="this.src='/static/placeholder-class.jpg'">
      </div>
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-bold text-gray-800">${classItem.title}</h3>
        ${statusBadge}
      </div>
      ${classItem.category ? `<p class="text-sm text-purple-600 mb-2"><i class="fas fa-tag mr-1"></i>${classItem.category}</p>` : ''}
      <p class="text-sm text-gray-600 mb-3 line-clamp-2">${classItem.description || '설명 없음'}</p>
      <div class="space-y-1 mb-4 text-sm text-gray-600">
        <div><i class="fas fa-map-marker-alt text-purple-600 mr-2 w-4"></i>${classItem.location}</div>
        ${classItem.address ? `<div><i class="fas fa-building text-purple-600 mr-2 w-4"></i>${classItem.address}</div>` : ''}
        <div><i class="fas fa-clock text-purple-600 mr-2 w-4"></i>${duration}</div>
        <div><i class="fas fa-users text-purple-600 mr-2 w-4"></i>${maxParticipants}</div>
      </div>
      <div class="flex items-center justify-between mb-4 pt-3 border-t">
        <span class="text-xl font-bold text-purple-600">${price}</span>
      </div>
      <div class="flex space-x-2">
        <button onclick="editClass(${classItem.id})" 
          class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-sm">
          <i class="fas fa-edit mr-1"></i>수정
        </button>
        <button onclick="deleteClass(${classItem.id}, '${classItem.title}')" 
          class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 text-sm">
          <i class="fas fa-trash mr-1"></i>삭제
        </button>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// 클래스 필터 적용
function applyClassFilter() {
  const searchInput = document.getElementById('class-search-input');
  const priceFilter = document.getElementById('class-price-filter');
  const sortFilter = document.getElementById('class-sort-filter');
  
  if (!searchInput || !priceFilter || !sortFilter) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const priceRange = priceFilter.value;
  const sortBy = sortFilter.value;
  
  // 검색어 필터
  filteredClasses = currentClasses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm) || 
                         (c.description && c.description.toLowerCase().includes(searchTerm));
    return matchesSearch;
  });
  
  // 가격 범위 필터
  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    filteredClasses = filteredClasses.filter(c => {
      if (!c.price) return false;
      return c.price >= min && c.price <= max;
    });
  }
  
  // 정렬
  filteredClasses.sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  renderClasses();
}

// 새 클래스 모달 열기
function openNewClassModal() {
  isEditingClass = false;
  editingClassId = null;
  document.getElementById('class-modal-title').textContent = '클래스 등록';
  document.getElementById('class-form').reset();
  document.getElementById('class-active').checked = true;
  document.getElementById('class-image-preview').style.display = 'none';
  document.getElementById('class-image-url-hidden').value = '';
  document.getElementById('class-modal').classList.remove('hidden');
}

// 클래스 수정
async function editClass(id) {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/workshops/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('클래스 정보 조회 실패');
    }
    
    const classData = await response.json();
    
    isEditingClass = true;
    editingClassId = id;
    
    document.getElementById('class-modal-title').textContent = '클래스 수정';
    document.getElementById('class-title').value = classData.title || '';
    document.getElementById('class-description').value = classData.description || '';
    document.getElementById('class-category').value = classData.category || '';
    document.getElementById('class-location').value = classData.location || '';
    document.getElementById('class-address').value = classData.address || '';
    document.getElementById('class-price').value = classData.price || '';
    document.getElementById('class-duration').value = classData.duration || '';
    document.getElementById('class-max-participants').value = classData.max_participants || '';
    document.getElementById('class-active').checked = classData.is_active === 1;
    
    if (classData.image_url) {
      document.getElementById('class-image-preview').style.display = 'block';
      document.getElementById('class-image-preview-img').src = classData.image_url;
      document.getElementById('class-image-url').textContent = classData.image_url;
      document.getElementById('class-image-url-hidden').value = classData.image_url;
    }
    
    document.getElementById('class-modal').classList.remove('hidden');
    
  } catch (error) {
    console.error('클래스 수정 오류:', error);
    alert('클래스 정보를 불러오는데 실패했습니다.');
  }
}

// 클래스 삭제
async function deleteClass(id, title) {
  if (!confirm(`"${title}" 클래스를 삭제하시겠습니까?\n\n삭제된 클래스는 비활성화되며 복구할 수 있습니다.`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/workshops/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('클래스 삭제 실패');
    }
    
    alert('클래스가 삭제되었습니다.');
    loadClasses();
    
  } catch (error) {
    console.error('클래스 삭제 오류:', error);
    alert('클래스 삭제에 실패했습니다.');
  }
}

// 클래스 폼 제출
async function handleClassFormSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('class-title').value.trim();
  const description = document.getElementById('class-description').value.trim();
  const category = document.getElementById('class-category').value;
  const location = document.getElementById('class-location').value;
  const address = document.getElementById('class-address').value.trim();
  const price = parseInt(document.getElementById('class-price').value);
  const duration = document.getElementById('class-duration').value ? parseInt(document.getElementById('class-duration').value) : null;
  const maxParticipants = document.getElementById('class-max-participants').value ? parseInt(document.getElementById('class-max-participants').value) : null;
  const isActive = document.getElementById('class-active').checked ? 1 : 0;
  const imageUrl = document.getElementById('class-image-url-hidden').value;
  
  if (!title || !location || !price) {
    alert('필수 항목을 모두 입력해주세요.');
    return;
  }
  
  const classData = {
    title,
    description: description || null,
    category: category || null,
    location,
    address: address || null,
    price,
    duration,
    max_participants: maxParticipants,
    is_active: isActive,
    image_url: imageUrl || null,
    type: 'workshop'
  };
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const url = isEditingClass ? `/api/workshops/${editingClassId}` : '/api/workshops';
    const method = isEditingClass ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(classData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '클래스 저장 실패');
    }
    
    alert(isEditingClass ? '클래스가 수정되었습니다.' : '클래스가 등록되었습니다.');
    closeClassModal();
    loadClasses();
    
  } catch (error) {
    console.error('클래스 저장 오류:', error);
    alert(`클래스 저장에 실패했습니다:\n${error.message}`);
  }
}

// 클래스 이미지 업로드
async function uploadClassImage() {
  const fileInput = document.getElementById('class-image-upload');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('이미지 파일을 선택해주세요.');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.');
    return;
  }
  
  // 파일 크기 체크 (500KB)
  const maxSize = 500 * 1024; // 500KB
  if (file.size > maxSize) {
    alert(`이미지 파일 크기는 500KB 이하여야 합니다.\n현재 크기: ${Math.round(file.size / 1024)}KB`);
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    // FormData로 전송
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
      const error = await response.json();
      throw new Error(error.error || '이미지 업로드 실패');
    }
    
    const result = await response.json();
    
    document.getElementById('class-image-preview').style.display = 'block';
    document.getElementById('class-image-preview-img').src = result.url;
    document.getElementById('class-image-url').textContent = result.url;
    document.getElementById('class-image-url-hidden').value = result.url;
    
    alert('이미지가 업로드되었습니다.');
    
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    alert(`이미지 업로드에 실패했습니다:\n${error.message}`);
  }
}

// 클래스 모달 닫기
function closeClassModal() {
  document.getElementById('class-modal').classList.add('hidden');
  document.getElementById('class-form').reset();
  isEditingClass = false;
  editingClassId = null;
}

// ==================== 원데이 클래스 관리 ====================

let currentOnedayClasses = [];
let filteredOnedayClasses = [];
let isEditingOnedayClass = false;
let editingOnedayClassId = null;

// 원데이 클래스 목록 로드
async function loadOnedayClasses() {
  try {
    document.getElementById('oneday-class-loading').style.display = 'block';
    document.getElementById('oneday-classes-grid').innerHTML = '';
    document.getElementById('oneday-class-empty-state').style.display = 'none';
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/workshops?type=class&limit=100', {
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('원데이 클래스 목록 조회 실패');
    }
    
    currentOnedayClasses = await response.json();
    filteredOnedayClasses = currentOnedayClasses;
    
    document.getElementById('oneday-class-loading').style.display = 'none';
    
    if (currentOnedayClasses.length === 0) {
      document.getElementById('oneday-class-empty-state').style.display = 'block';
    } else {
      renderOnedayClasses();
    }
    
  } catch (error) {
    console.error('원데이 클래스 로드 오류:', error);
    console.error('Error details:', error.message);
    document.getElementById('oneday-class-loading').style.display = 'none';
    alert('원데이 클래스 목록을 불러오는데 실패했습니다.\n오류: ' + error.message + '\n브라우저 콘솔(F12)을 확인해주세요.');
  }
}

// 원데이 클래스 렌더링
function renderOnedayClasses() {
  const grid = document.getElementById('oneday-classes-grid');
  grid.innerHTML = '';
  
  document.getElementById('oneday-class-filter-result-count').textContent = filteredOnedayClasses.length;
  
  filteredOnedayClasses.forEach(classItem => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition';
    
    card.innerHTML = `
      <div class="relative h-48">
        <img src="${classItem.image_url || '/static/placeholder.jpg'}" 
             alt="${classItem.title}" 
             class="w-full h-full object-cover">
        <div class="absolute top-2 right-2">
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${classItem.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}">
            ${classItem.is_active ? '활성' : '비활성'}
          </span>
        </div>
      </div>
      <div class="p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-2">${classItem.title}</h3>
        <div class="space-y-1 text-sm text-gray-600 mb-4">
          ${classItem.studio_name ? `<p><i class="fas fa-store mr-2"></i>${classItem.studio_name}</p>` : ''}
          ${classItem.instructor_name ? `<p><i class="fas fa-user-tie mr-2"></i>${classItem.instructor_name}</p>` : ''}
          <p><i class="fas fa-map-marker-alt mr-2"></i>${classItem.location}</p>
          <p><i class="fas fa-won-sign mr-2"></i>${(classItem.price || 0).toLocaleString()}원</p>
        </div>
        <div class="flex gap-2">
          <button onclick="editOnedayClass(${classItem.id})" 
            class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            <i class="fas fa-edit mr-1"></i>수정
          </button>
          <button onclick="deleteOnedayClass(${classItem.id})" 
            class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            <i class="fas fa-trash mr-1"></i>삭제
          </button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// 원데이 클래스 필터 적용
function applyOnedayClassFilter() {
  const searchText = document.getElementById('oneday-class-search-input').value.toLowerCase();
  const priceRange = document.getElementById('oneday-class-price-filter').value;
  const sortBy = document.getElementById('oneday-class-sort-filter').value;
  
  filteredOnedayClasses = currentOnedayClasses.filter(classItem => {
    const matchesSearch = !searchText || classItem.title.toLowerCase().includes(searchText);
    
    let matchesPrice = true;
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      matchesPrice = classItem.price >= min && classItem.price <= max;
    }
    
    return matchesSearch && matchesPrice;
  });
  
  // 정렬
  filteredOnedayClasses.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  renderOnedayClasses();
}

// 새 원데이 클래스 모달 열기
function openNewOnedayClassModal() {
  isEditingOnedayClass = false;
  editingOnedayClassId = null;
  document.getElementById('oneday-class-modal-title').textContent = '원데이 클래스 등록';
  document.getElementById('oneday-class-form').reset();
  document.getElementById('oneday-class-active').checked = true;
  document.getElementById('oneday-class-image-preview').style.display = 'none';
  document.getElementById('oneday-class-modal').classList.remove('hidden');
}

// 원데이 클래스 수정
async function editOnedayClass(id) {
  try {
    const classItem = currentOnedayClasses.find(c => c.id === id);
    if (!classItem) {
      alert('원데이 클래스를 찾을 수 없습니다.');
      return;
    }
    
    isEditingOnedayClass = true;
    editingOnedayClassId = id;
    
    document.getElementById('oneday-class-modal-title').textContent = '원데이 클래스 수정';
    document.getElementById('oneday-class-title').value = classItem.title || '';
    document.getElementById('oneday-class-description').value = classItem.description || '';
    document.getElementById('oneday-class-category').value = classItem.category || '';
    document.getElementById('oneday-class-studio-name').value = classItem.studio_name || '';
    document.getElementById('oneday-class-instructor-name').value = classItem.instructor_name || '';
    document.getElementById('oneday-class-location').value = classItem.location || '';
    document.getElementById('oneday-class-address').value = classItem.address || '';
    document.getElementById('oneday-class-price').value = classItem.price || '';
    document.getElementById('oneday-class-duration').value = classItem.duration || '';
    document.getElementById('oneday-class-max-participants').value = classItem.max_participants || '';
    document.getElementById('oneday-class-active').checked = classItem.is_active === 1;
    
    if (classItem.image_url) {
      document.getElementById('oneday-class-image-preview').style.display = 'block';
      document.getElementById('oneday-class-image-preview-img').src = classItem.image_url;
      document.getElementById('oneday-class-image-url').textContent = classItem.image_url;
    }
    
    document.getElementById('oneday-class-modal').classList.remove('hidden');
    
  } catch (error) {
    console.error('원데이 클래스 수정 오류:', error);
    alert('원데이 클래스 정보를 불러오는데 실패했습니다.');
  }
}

// 원데이 클래스 삭제
async function deleteOnedayClass(id) {
  if (!confirm('정말로 이 원데이 클래스를 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/oneday-classes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('원데이 클래스 삭제 실패');
    }
    
    alert('원데이 클래스가 삭제되었습니다.');
    loadOnedayClasses();
    
  } catch (error) {
    console.error('원데이 클래스 삭제 오류:', error);
    alert('원데이 클래스 삭제에 실패했습니다.');
  }
}

// 원데이 클래스 폼 제출
document.getElementById('oneday-class-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const imageUrlElement = document.getElementById('oneday-class-image-url');
    const imageUrl = imageUrlElement ? imageUrlElement.textContent : '';
    
    const data = {
      title: document.getElementById('oneday-class-title').value,
      description: document.getElementById('oneday-class-description').value || null,
      category: document.getElementById('oneday-class-category').value || null,
      studio_name: document.getElementById('oneday-class-studio-name').value || null,
      instructor_name: document.getElementById('oneday-class-instructor-name').value || null,
      location: document.getElementById('oneday-class-location').value,
      address: document.getElementById('oneday-class-address').value || null,
      price: parseInt(document.getElementById('oneday-class-price').value) || null,
      duration: parseInt(document.getElementById('oneday-class-duration').value) || null,
      max_participants: parseInt(document.getElementById('oneday-class-max-participants').value) || null,
      image_url: imageUrl || null,
      is_active: document.getElementById('oneday-class-active').checked ? 1 : 0,
      type: 'class'
    };
    
    const url = isEditingOnedayClass 
      ? `/api/workshops/${editingOnedayClassId}`
      : '/api/workshops';
    
    const method = isEditingOnedayClass ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '원데이 클래스 저장 실패');
    }
    
    const result = await response.json();
    alert(result.message || '원데이 클래스가 저장되었습니다.');
    
    closeOnedayClassModal();
    loadOnedayClasses();
    
  } catch (error) {
    console.error('원데이 클래스 저장 오류:', error);
    alert(`원데이 클래스 저장에 실패했습니다:\n${error.message}`);
  }
});

// 원데이 클래스 이미지 업로드
async function uploadOnedayClassImage() {
  const fileInput = document.getElementById('oneday-class-image-upload');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('파일을 선택해주세요.');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.');
    return;
  }
  
  const maxSize = 500 * 1024; // 500KB
  if (file.size > maxSize) {
    alert(`파일 크기는 500KB 이하여야 합니다.\n현재 크기: ${(file.size / 1024).toFixed(2)}KB`);
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
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
      const error = await response.json();
      throw new Error(error.error || '이미지 업로드 실패');
    }
    
    const result = await response.json();
    
    document.getElementById('oneday-class-image-preview').style.display = 'block';
    document.getElementById('oneday-class-image-preview-img').src = result.url;
    document.getElementById('oneday-class-image-url').textContent = result.url;
    
    alert('이미지가 업로드되었습니다.');
    
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    alert(`이미지 업로드에 실패했습니다:\n${error.message}`);
  }
}

// 원데이 클래스 모달 닫기
function closeOnedayClassModal() {
  document.getElementById('oneday-class-modal').classList.add('hidden');
  document.getElementById('oneday-class-form').reset();
  isEditingOnedayClass = false;
  editingOnedayClassId = null;
}
