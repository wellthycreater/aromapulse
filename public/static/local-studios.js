// Local Studios Search JavaScript

let currentStudios = [];

// 페이지 로드 시 빈 상태 표시
document.addEventListener('DOMContentLoaded', () => {
  showEmptyState();
});

// 빈 상태 표시
function showEmptyState() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('no-results').classList.add('hidden');
  document.getElementById('results-header').classList.add('hidden');
  document.getElementById('studios-grid').classList.add('hidden');
}

// 로딩 표시
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('no-results').classList.add('hidden');
  document.getElementById('results-header').classList.add('hidden');
  document.getElementById('studios-grid').classList.add('hidden');
}

// 결과 없음 표시
function showNoResults() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('no-results').classList.remove('hidden');
  document.getElementById('results-header').classList.add('hidden');
  document.getElementById('studios-grid').classList.add('hidden');
}

// 결과 표시
function showResults(studios) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('no-results').classList.add('hidden');
  document.getElementById('results-header').classList.remove('hidden');
  document.getElementById('studios-grid').classList.remove('hidden');

  document.getElementById('result-count').textContent = `(${studios.length}개 공방)`;
  
  currentStudios = studios;
  renderStudios();
}

// 지역으로 검색
async function searchByRegion() {
  const region = document.getElementById('region-select').value;
  const radius = document.getElementById('radius-select').value;

  if (!region) {
    alert('지역을 선택해주세요');
    return;
  }

  showLoading();

  try {
    const response = await fetch(
      `/api/workshop-bookings/search-by-region?region=${encodeURIComponent(region)}&radius=${radius}&type=local_studio`
    );

    if (!response.ok) {
      throw new Error('검색 실패');
    }

    const data = await response.json();

    if (data.workshops && data.workshops.length > 0) {
      showResults(data.workshops);
    } else {
      showNoResults();
    }
  } catch (error) {
    console.error('Search error:', error);
    alert('공방 검색 중 오류가 발생했습니다.');
    showEmptyState();
  }
}

// 내 위치로 검색
async function searchByLocation() {
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const radius = document.getElementById('radius-select').value;

      try {
        const response = await fetch(
          `/api/workshop-bookings/search-nearby?lat=${lat}&lng=${lng}&radius=${radius}&type=local_studio`
        );

        if (!response.ok) {
          throw new Error('검색 실패');
        }

        const data = await response.json();

        if (data.workshops && data.workshops.length > 0) {
          showResults(data.workshops);
        } else {
          showNoResults();
        }
      } catch (error) {
        console.error('Search error:', error);
        alert('공방 검색 중 오류가 발생했습니다.');
        showEmptyState();
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      alert('위치 정보를 가져올 수 없습니다. 지역 검색을 이용해주세요.');
      showEmptyState();
    }
  );
}

// 공방 카드 렌더링
function renderStudios() {
  const grid = document.getElementById('studios-grid');
  grid.innerHTML = '';

  currentStudios.forEach((studio) => {
    const card = createStudioCard(studio);
    grid.appendChild(card);
  });
}

// 공방 카드 생성
function createStudioCard(studio) {
  const card = document.createElement('div');
  card.className = 'studio-card bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-purple-300';
  card.onclick = () => viewStudio(studio.id);

  const distance = studio.distance || studio.distance_km;
  const distanceText = studio.distance_formatted || `${distance}km`;
  const categoryIcon = getCategoryIcon(studio.category);
  
  // 50km 이내만 표시하고 모두 당일 배송권으로 통일
  const canSameDayDelivery = distance <= 50;
  
  let deliveryBadge = '';
  if (canSameDayDelivery) {
    deliveryBadge = `
      <div class="absolute bottom-4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-xl font-bold flex items-center">
        <i class="fas fa-shipping-fast mr-2"></i>
        당일 배송권
      </div>`;
  }

  card.innerHTML = `
    <div class="relative group">
      ${studio.image_url 
        ? `<img src="${studio.image_url}" alt="${studio.title}" class="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500">`
        : `<div class="w-full h-56 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
             <div class="absolute inset-0 opacity-20">
               <div class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
               <div class="absolute bottom-10 right-10 w-40 h-40 bg-pink-300 rounded-full blur-2xl"></div>
             </div>
             <i class="fas fa-spa text-white text-7xl relative z-10 group-hover:scale-110 transition-transform duration-500"></i>
           </div>`
      }
      <div class="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-xl font-bold">
        <i class="fas fa-map-marker-alt mr-2"></i>
        ${distanceText}
      </div>
      <div class="absolute top-4 left-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-xl font-bold animate-pulse">
        <i class="fas fa-gift mr-2"></i>무료 상담
      </div>
      ${deliveryBadge}
    </div>

    <div class="p-6">
      <div class="flex items-center justify-between mb-3">
        <span class="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm rounded-full font-bold">
          ${categoryIcon} ${studio.category}
        </span>
      </div>

      <h3 class="text-2xl font-bold text-gray-800 mb-3 leading-tight group-hover:text-purple-600 transition">${studio.title}</h3>
      <p class="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">${studio.description}</p>

      <div class="space-y-3 text-sm text-gray-700 mb-6">
        <div class="flex items-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
          <i class="fas fa-map-marker-alt w-5 text-purple-600"></i>
          <span class="ml-3 font-medium">${studio.address}</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
            <i class="fas fa-clock w-5 text-blue-600"></i>
            <span class="ml-2 font-medium">${studio.duration}분</span>
          </div>
          <div class="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
            <i class="fas fa-phone w-5 text-green-600"></i>
            <span class="ml-2 font-medium text-xs">${studio.contact_phone}</span>
          </div>
        </div>
      </div>

      <button onclick="event.stopPropagation(); viewStudio(${studio.id})" 
        class="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold text-lg">
        <i class="fas fa-calendar-check mr-2"></i>무료 상담 예약하기
      </button>
    </div>
  `;

  return card;
}

// 카테고리 아이콘
function getCategoryIcon(category) {
  const icons = {
    '아로마 테라피': '<i class="fas fa-spa"></i>',
    '향수 만들기': '<i class="fas fa-flask"></i>',
    '힐링 테라피': '<i class="fas fa-heart"></i>',
    '블렌딩': '<i class="fas fa-vial"></i>',
  };
  return icons[category] || '<i class="fas fa-store"></i>';
}

// 공방 상세 페이지로 이동
function viewStudio(studioId) {
  window.location.href = `/studio-detail?id=${studioId}`;
}
