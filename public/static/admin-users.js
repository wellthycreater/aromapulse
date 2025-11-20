// Admin Users Management JavaScript
// 관리자 회원 관리 시스템

let currentUsers = [];
let filteredUsers = [];
let currentTab = 'all';
let currentUser = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadUsers();
});

// 인증 확인
function checkAuth() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
  if (!token) {
    window.location.href = '/static/admin-login';
    return;
  }
}

// 로그아웃
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('auth_token');
  window.location.href = '/static/admin-login';
}

// 탭 전환
function switchTab(tab) {
  currentTab = tab;
  
  // 탭 버튼 스타일 업데이트
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('bg-purple-600', 'text-white');
    btn.classList.add('text-gray-700', 'hover:bg-gray-100');
  });
  
  const activeTab = document.getElementById(`tab-${tab}`);
  activeTab.classList.add('bg-purple-600', 'text-white');
  activeTab.classList.remove('text-gray-700', 'hover:bg-gray-100');
  
  applyFilter();
}

// 회원 목록 로드
async function loadUsers() {
  try {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('users-table').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch('/api/users?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('회원 목록 조회 실패');
    }
    
    currentUsers = await response.json();
    
    // 통계 업데이트
    updateStats();
    
    // 필터 적용
    applyFilter();
    
    document.getElementById('loading').style.display = 'none';
    
  } catch (error) {
    console.error('회원 로드 오류:', error);
    document.getElementById('loading').style.display = 'none';
    alert('회원 목록을 불러오는데 실패했습니다.');
  }
}

// 통계 업데이트
function updateStats() {
  const total = currentUsers.length;
  const b2c = currentUsers.filter(u => u.user_type === 'B2C').length;
  const company = currentUsers.filter(u => u.user_type === 'B2B' && u.b2b_category === 'company').length;
  const shop = currentUsers.filter(u => u.user_type === 'B2B' && u.b2b_category === 'shop').length;
  const admin = currentUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-b2c').textContent = b2c;
  document.getElementById('stat-company').textContent = company;
  document.getElementById('stat-shop').textContent = shop;
  document.getElementById('stat-admin').textContent = admin;
}

// 필터 적용
function applyFilter() {
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  const sortBy = document.getElementById('sort-filter').value;
  
  // 탭별 필터
  let users = currentUsers;
  if (currentTab === 'b2c') {
    users = users.filter(u => u.user_type === 'B2C');
  } else if (currentTab === 'b2b-company') {
    users = users.filter(u => u.user_type === 'B2B' && u.b2b_category === 'company');
  } else if (currentTab === 'b2b-shop') {
    users = users.filter(u => u.user_type === 'B2B' && u.b2b_category === 'shop');
  } else if (currentTab === 'admin') {
    users = users.filter(u => u.role === 'admin' || u.role === 'super_admin');
  }
  
  // 검색 필터
  if (searchText) {
    users = users.filter(u => 
      u.name.toLowerCase().includes(searchText) || 
      u.email.toLowerCase().includes(searchText)
    );
  }
  
  // 상태 필터
  if (statusFilter) {
    users = users.filter(u => u.is_active === parseInt(statusFilter));
  }
  
  // 정렬
  users.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  
  filteredUsers = users;
  renderUsers();
}

// 회원 목록 렌더링
function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';
  
  document.getElementById('filter-result-count').textContent = filteredUsers.length;
  
  if (filteredUsers.length === 0) {
    document.getElementById('users-table').style.display = 'none';
    document.getElementById('empty-state').style.display = 'block';
    return;
  }
  
  document.getElementById('users-table').style.display = 'block';
  document.getElementById('empty-state').style.display = 'none';
  
  filteredUsers.forEach(user => {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gray-50';
    
    // 회원 유형 배지
    let typeBadge = '';
    if (user.user_type === 'B2C') {
      typeBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">개인</span>';
    } else if (user.b2b_category === 'company') {
      typeBadge = '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">기업</span>';
    } else if (user.b2b_category === 'shop') {
      typeBadge = '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">공방</span>';
    } else if (user.b2b_category === 'perfumer') {
      typeBadge = '<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">조향사</span>';
    } else if (user.b2b_category === 'independent') {
      typeBadge = '<span class="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">프리랜서</span>';
    } else {
      typeBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">일반</span>';
    }
    
    // 상태 배지
    const statusBadge = user.is_active 
      ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">활성</span>'
      : '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">비활성</span>';
    
    // 역할 배지
    let roleBadge = '';
    if (user.role === 'super_admin') {
      roleBadge = '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">최고 관리자</span>';
    } else if (user.role === 'admin') {
      roleBadge = '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">관리자</span>';
    } else {
      roleBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">일반</span>';
    }
    
    // 가입일 포맷
    const createdAt = new Date(user.created_at).toLocaleDateString('ko-KR');
    
    // 소셜 로그인 아이콘
    let oauthBadge = '';
    if (user.oauth_provider === 'naver') {
      oauthBadge = '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"><i class="fas fa-n mr-1"></i>네이버</span>';
    } else if (user.oauth_provider === 'kakao') {
      oauthBadge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"><i class="fas fa-comment mr-1"></i>카카오</span>';
    } else if (user.oauth_provider === 'google') {
      oauthBadge = '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"><i class="fab fa-google mr-1"></i>구글</span>';
    } else {
      oauthBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"><i class="fas fa-envelope mr-1"></i>이메일</span>';
    }
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm">${user.id}</td>
      <td class="px-4 py-3 text-sm font-semibold">${user.name}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${user.email}</td>
      <td class="px-4 py-3 text-sm">${typeBadge}</td>
      <td class="px-4 py-3 text-sm">${oauthBadge}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${createdAt}</td>
      <td class="px-4 py-3 text-sm">${statusBadge}</td>
      <td class="px-4 py-3 text-sm">${roleBadge}</td>
      <td class="px-4 py-3 text-sm text-center">
        <button onclick="viewUser(${user.id})" 
          class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs">
          <i class="fas fa-eye mr-1"></i>상세
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// 회원 상세 보기
async function viewUser(userId) {
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('회원 조회 실패');
    }
    
    currentUser = await response.json();
    renderUserDetails();
    document.getElementById('user-modal').style.display = 'flex';
    
  } catch (error) {
    console.error('회원 조회 오류:', error);
    alert('회원 정보를 불러오는데 실패했습니다.');
  }
}

// 회원 상세 정보 렌더링
function renderUserDetails() {
  const user = currentUser;
  
  let userTypeInfo = '';
  if (user.user_type === 'B2C') {
    userTypeInfo = `
      <div class="border-t pt-4">
        <h4 class="font-semibold text-gray-800 mb-3">개인 회원 정보</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          ${user.age_group ? `<div><span class="text-gray-600">연령대:</span> <span class="font-semibold">${formatAgeGroup(user.age_group)}</span></div>` : ''}
          ${user.gender ? `<div><span class="text-gray-600">성별:</span> <span class="font-semibold">${formatGender(user.gender)}</span></div>` : ''}
          ${user.b2c_stress_type ? `<div><span class="text-gray-600">스트레스 유형:</span> <span class="font-semibold">${formatStressType(user.b2c_stress_type)}</span></div>` : ''}
          ${user.daily_stress_category ? `<div><span class="text-gray-600">일상 스트레스:</span> <span class="font-semibold">${formatDailyStress(user.daily_stress_category)}</span></div>` : ''}
          ${user.work_industry ? `<div><span class="text-gray-600">직업 분야:</span> <span class="font-semibold">${formatWorkIndustry(user.work_industry)}</span></div>` : ''}
          ${user.work_position ? `<div><span class="text-gray-600">직급:</span> <span class="font-semibold">${user.work_position}</span></div>` : ''}
        </div>
      </div>
    `;
  } else if (user.user_type === 'B2B') {
    if (user.b2b_category === 'company') {
      userTypeInfo = `
        <div class="border-t pt-4">
          <h4 class="font-semibold text-gray-800 mb-3">기업 회원 정보</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            ${user.b2b_company_name ? `<div><span class="text-gray-600">회사명:</span> <span class="font-semibold">${user.b2b_company_name}</span></div>` : ''}
            ${user.company_size ? `<div><span class="text-gray-600">회사 규모:</span> <span class="font-semibold">${formatCompanySize(user.company_size)}</span></div>` : ''}
            ${user.company_role ? `<div><span class="text-gray-600">역할:</span> <span class="font-semibold">${formatCompanyRole(user.company_role)}</span></div>` : ''}
            ${user.department ? `<div><span class="text-gray-600">부서:</span> <span class="font-semibold">${user.department}</span></div>` : ''}
            ${user.b2b_position ? `<div><span class="text-gray-600">직급:</span> <span class="font-semibold">${user.b2b_position}</span></div>` : ''}
            ${user.b2b_business_number ? `<div><span class="text-gray-600">사업자번호:</span> <span class="font-semibold">${user.b2b_business_number}</span></div>` : ''}
            ${user.b2b_address ? `<div class="col-span-2"><span class="text-gray-600">주소:</span> <span class="font-semibold">${user.b2b_address}</span></div>` : ''}
          </div>
        </div>
      `;
    } else if (user.b2b_category === 'shop') {
      userTypeInfo = `
        <div class="border-t pt-4">
          <h4 class="font-semibold text-gray-800 mb-3">공방 파트너 정보</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            ${user.b2b_shop_name ? `<div><span class="text-gray-600">공방명:</span> <span class="font-semibold">${user.b2b_shop_name}</span></div>` : ''}
            ${user.b2b_shop_type ? `<div><span class="text-gray-600">공방 유형:</span> <span class="font-semibold">${user.b2b_shop_type}</span></div>` : ''}
            ${user.b2b_business_number ? `<div><span class="text-gray-600">사업자번호:</span> <span class="font-semibold">${user.b2b_business_number}</span></div>` : ''}
            ${user.b2b_address ? `<div class="col-span-2"><span class="text-gray-600">주소:</span> <span class="font-semibold">${user.b2b_address}</span></div>` : ''}
          </div>
        </div>
      `;
    } else if (user.b2b_category === 'perfumer') {
      userTypeInfo = `
        <div class="border-t pt-4">
          <h4 class="font-semibold text-gray-800 mb-3">조향사 정보</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            ${user.b2b_business_name ? `<div><span class="text-gray-600">브랜드명:</span> <span class="font-semibold">${user.b2b_business_name}</span></div>` : ''}
            ${user.b2b_business_number ? `<div><span class="text-gray-600">사업자번호:</span> <span class="font-semibold">${user.b2b_business_number}</span></div>` : ''}
          </div>
        </div>
      `;
    } else if (user.b2b_category === 'independent') {
      userTypeInfo = `
        <div class="border-t pt-4">
          <h4 class="font-semibold text-gray-800 mb-3">프리랜서/1인 사업자 정보</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            ${user.b2b_independent_type ? `<div><span class="text-gray-600">유형:</span> <span class="font-semibold">${formatIndependentType(user.b2b_independent_type)}</span></div>` : ''}
            ${user.b2b_business_name ? `<div><span class="text-gray-600">상호명:</span> <span class="font-semibold">${user.b2b_business_name}</span></div>` : ''}
            ${user.b2b_business_number ? `<div><span class="text-gray-600">사업자번호:</span> <span class="font-semibold">${user.b2b_business_number}</span></div>` : ''}
          </div>
        </div>
      `;
    }
  }
  
  const html = `
    <div class="space-y-4">
      <!-- 기본 정보 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold text-gray-800 mb-3">기본 정보</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-600">ID:</span> <span class="font-semibold">${user.id}</span></div>
          <div><span class="text-gray-600">이름:</span> <span class="font-semibold">${user.name}</span></div>
          <div><span class="text-gray-600">이메일:</span> <span class="font-semibold">${user.email}</span></div>
          <div><span class="text-gray-600">전화번호:</span> <span class="font-semibold">${user.phone || '-'}</span></div>
          <div><span class="text-gray-600">회원 유형:</span> <span class="font-semibold">${user.user_type === 'B2C' ? '개인' : '기업'}</span></div>
          <div><span class="text-gray-600">역할:</span> <span class="font-semibold">${formatRole(user.role)}</span></div>
          <div><span class="text-gray-600">상태:</span> ${user.is_active ? '<span class="text-green-600 font-semibold">활성</span>' : '<span class="text-gray-600">비활성</span>'}</div>
          <div><span class="text-gray-600">가입 방식:</span> <span class="font-semibold">${formatOAuthProvider(user.oauth_provider)}</span></div>
          ${user.region ? `<div><span class="text-gray-600">지역:</span> <span class="font-semibold">${user.region}</span></div>` : ''}
        </div>
      </div>
      
      ${userTypeInfo}
      
      <!-- 활동 정보 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold text-gray-800 mb-3">활동 정보</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-600">가입일:</span> <span class="font-semibold">${new Date(user.created_at).toLocaleString('ko-KR')}</span></div>
          <div><span class="text-gray-600">최종 로그인:</span> <span class="font-semibold">${user.last_login_at ? new Date(user.last_login_at).toLocaleString('ko-KR') : '-'}</span></div>
          <div><span class="text-gray-600">정보 수정일:</span> <span class="font-semibold">${new Date(user.updated_at).toLocaleString('ko-KR')}</span></div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('user-details').innerHTML = html;
  
  // 상태 토글 버튼
  const toggleBtn = document.getElementById('toggle-status-btn');
  if (user.is_active) {
    toggleBtn.textContent = '비활성화';
    toggleBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600';
  } else {
    toggleBtn.textContent = '활성화';
    toggleBtn.className = 'flex-1 py-3 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600';
  }
}

// 회원 상태 토글
async function toggleUserStatus() {
  if (!currentUser) return;
  
  const newStatus = currentUser.is_active ? 0 : 1;
  const action = newStatus ? '활성화' : '비활성화';
  
  if (!confirm(`${currentUser.name} 회원을 ${action}하시겠습니까?`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    
    const response = await fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: newStatus })
    });
    
    if (!response.ok) {
      throw new Error('회원 상태 변경 실패');
    }
    
    alert(`회원이 ${action}되었습니다.`);
    closeModal();
    loadUsers();
    
  } catch (error) {
    console.error('회원 상태 변경 오류:', error);
    alert(`회원 상태 변경에 실패했습니다: ${error.message}`);
  }
}

// 모달 닫기
function closeModal() {
  document.getElementById('user-modal').style.display = 'none';
  currentUser = null;
}

// 필터 초기화
function resetFilter() {
  document.getElementById('search-input').value = '';
  document.getElementById('status-filter').value = '';
  document.getElementById('sort-filter').value = 'newest';
  applyFilter();
}

// 포맷 함수들
function formatRole(role) {
  const roles = {
    'super_admin': '최고 관리자',
    'admin': '관리자',
    'user': '일반 회원'
  };
  return roles[role] || role;
}

function formatOAuthProvider(provider) {
  const providers = {
    'naver': '네이버',
    'kakao': '카카오',
    'google': '구글',
    'email': '이메일'
  };
  return providers[provider] || '-';
}

function formatAgeGroup(age) {
  const ages = {
    '10s': '10대',
    '20s': '20대',
    '30s': '30대',
    '40s': '40대',
    '50s': '50대',
    '60s_plus': '60대 이상'
  };
  return ages[age] || age;
}

function formatGender(gender) {
  const genders = {
    'male': '남성',
    'female': '여성',
    'other': '기타'
  };
  return genders[gender] || gender;
}

function formatStressType(type) {
  const types = {
    'daily': '일상 스트레스',
    'work': '업무 스트레스'
  };
  return types[type] || type;
}

function formatDailyStress(category) {
  const categories = {
    'student_high': '고등학생',
    'student_college': '대학생',
    'student_graduate': '대학원생',
    'job_seeker_exam': '공시생',
    'job_seeker_new': '신입 구직자',
    'job_seeker_career': '경력 구직자',
    'caregiver_working_mom': '워킹맘',
    'caregiver_working_dad': '워킹대디',
    'caregiver_fulltime': '전업 육아',
    'caregiver_single': '싱글 부모'
  };
  return categories[category] || category;
}

function formatWorkIndustry(industry) {
  const industries = {
    'it_developer': 'IT/개발',
    'design_planning': '디자인/기획',
    'education_teacher': '교육',
    'medical_welfare': '의료/복지',
    'service_customer': '서비스',
    'manufacturing_production': '제조/생산',
    'public_admin': '공공/행정',
    'sales_marketing': '영업/마케팅',
    'research_tech': '연구/기술'
  };
  return industries[industry] || industry;
}

function formatCompanySize(size) {
  const sizes = {
    'under_20': '20명 미만',
    '20_50': '20-50명',
    '50_100': '50-100명',
    '100_300': '100-300명',
    '300_plus': '300명 이상',
    'small': '소기업',
    'medium': '중기업',
    'large': '대기업',
    'startup': '스타트업'
  };
  return sizes[size] || size;
}

function formatCompanyRole(role) {
  const roles = {
    'hr_manager': '인사 담당자',
    'culture_team': '조직문화 담당자',
    'welfare_manager': '복지 담당자',
    'general_employee': '일반 직원'
  };
  return roles[role] || role;
}

function formatIndependentType(type) {
  const types = {
    'self_employed': '자영업자',
    'startup_founder': '스타트업 창업자',
    'freelancer': '프리랜서',
    'creator_influencer': '크리에이터/인플루언서'
  };
  return types[type] || type;
}
