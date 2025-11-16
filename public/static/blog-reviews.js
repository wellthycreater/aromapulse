// 블로그 리뷰 분석 시스템 JavaScript

let currentTab = 'high-leads';
let selectedComment = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadStats();
  loadHighConversionLeads();
});

// 인증 확인
async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    alert('로그인이 필요합니다.');
    window.location.href = '/login';
    return;
  }
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('인증 실패');
    }
    
    const data = await response.json();
    document.getElementById('user-name').textContent = data.user.name;
  } catch (error) {
    console.error('인증 오류:', error);
    alert('인증에 실패했습니다.');
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}

// 통계 로드
async function loadStats() {
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch('/api/blog-analysis/stats/user-types', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('통계 조회 실패');
    
    const data = await response.json();
    const stats = data.stats || [];
    
    let totalComments = 0;
    let b2cCount = 0;
    let b2bCount = 0;
    let totalConversion = 0;
    
    stats.forEach(stat => {
      totalComments += stat.count;
      if (stat.user_type_prediction === 'B2C') b2cCount = stat.count;
      if (stat.user_type_prediction === 'B2B') b2bCount = stat.count;
      totalConversion += stat.avg_conversion_rate * stat.count;
    });
    
    const avgConversion = totalComments > 0 ? (totalConversion / totalComments * 100).toFixed(1) : 0;
    
    document.getElementById('total-comments').textContent = totalComments;
    document.getElementById('b2c-users').textContent = b2cCount;
    document.getElementById('b2b-users').textContent = b2bCount;
    document.getElementById('avg-conversion').textContent = avgConversion + '%';
  } catch (error) {
    console.error('통계 로드 오류:', error);
  }
}

// 탭 전환
function showTab(tabName) {
  currentTab = tabName;
  
  // 모든 탭 버튼 스타일 초기화
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('border-purple-600', 'text-purple-600');
    btn.classList.add('border-transparent', 'text-gray-500');
  });
  
  // 모든 탭 컨텐츠 숨기기
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // 선택된 탭 활성화
  const selectedBtn = event.target.closest('button');
  selectedBtn.classList.remove('border-transparent', 'text-gray-500');
  selectedBtn.classList.add('border-purple-600', 'text-purple-600');
  
  // 선택된 탭 컨텐츠 표시
  document.getElementById(`${tabName}-tab`).classList.remove('hidden');
  
  // 데이터 로드
  if (tabName === 'high-leads') {
    loadHighConversionLeads();
  } else if (tabName === 'all-comments') {
    loadAllComments();
  } else if (tabName === 'posts') {
    loadBlogPosts();
  }
}

// 고전환율 리드 로드
async function loadHighConversionLeads() {
  const token = localStorage.getItem('auth_token');
  const minConversion = document.getElementById('min-conversion-filter').value;
  const container = document.getElementById('high-leads-list');
  
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
  
  try {
    const response = await fetch(`/api/blog-analysis/high-conversion-leads?min_probability=${minConversion}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('리드 조회 실패');
    
    const data = await response.json();
    const leads = data.leads || [];
    
    if (leads.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-6xl mb-4"></i>
          <p class="text-lg">전환율 ${(minConversion * 100).toFixed(0)}% 이상의 리드가 없습니다.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = leads.map(lead => createLeadCard(lead)).join('');
  } catch (error) {
    console.error('리드 로드 오류:', error);
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-circle text-6xl mb-4"></i>
        <p>리드를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    `;
  }
}

// 리드 카드 생성
function createLeadCard(lead) {
  const conversionPercent = (lead.conversion_probability * 100).toFixed(0);
  const confidencePercent = (lead.user_type_confidence * 100).toFixed(0);
  
  // 사용자 타입 뱃지
  let userTypeBadge = '';
  if (lead.user_type_prediction === 'B2C') {
    userTypeBadge = '<span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"><i class="fas fa-user mr-1"></i>B2C</span>';
  } else if (lead.user_type_prediction === 'B2B') {
    userTypeBadge = '<span class="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"><i class="fas fa-briefcase mr-1"></i>B2B</span>';
  }
  
  // 감성 아이콘
  let sentimentIcon = '';
  if (lead.sentiment === 'positive') {
    sentimentIcon = '<i class="fas fa-smile text-green-500"></i>';
  } else if (lead.sentiment === 'negative') {
    sentimentIcon = '<i class="fas fa-frown text-red-500"></i>';
  } else {
    sentimentIcon = '<i class="fas fa-meh text-gray-500"></i>';
  }
  
  // 컨텍스트 태그
  const contextTags = lead.context_tags ? JSON.parse(lead.context_tags) : [];
  const tagsHtml = contextTags.slice(0, 3).map(tag => 
    `<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">${tag}</span>`
  ).join('');
  
  return `
    <div class="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center space-x-3">
          ${userTypeBadge}
          <span class="text-sm text-gray-600">
            <i class="fas fa-user-circle mr-1"></i>${lead.author_name || '익명'}
          </span>
          ${sentimentIcon}
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-orange-600">${conversionPercent}%</div>
          <div class="text-xs text-gray-500">전환 가능성</div>
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <p class="text-gray-800 leading-relaxed">${lead.content}</p>
      </div>
      
      <div class="flex items-center justify-between mb-4">
        <div class="flex flex-wrap gap-2">
          ${tagsHtml}
        </div>
        <a href="${lead.post_url}" target="_blank" class="text-sm text-purple-600 hover:text-purple-700">
          <i class="fas fa-external-link-alt mr-1"></i>원문 보기
        </a>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span class="text-gray-600">의도:</span>
          <span class="font-medium text-gray-800 ml-2">${getIntentLabel(lead.intent)}</span>
        </div>
        <div>
          <span class="text-gray-600">다음 행동:</span>
          <span class="font-medium text-gray-800 ml-2">${getNextActionLabel(lead.next_action_prediction)}</span>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="viewLeadDetail(${lead.id})" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          <i class="fas fa-eye mr-2"></i>상세보기
        </button>
        <button onclick="openSignupModal(${lead.id})" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <i class="fas fa-user-plus mr-2"></i>가입 유도
        </button>
      </div>
    </div>
  `;
}

// 의도 라벨
function getIntentLabel(intent) {
  const labels = {
    'purchase_intent': '구매 의도',
    'inquiry': '문의',
    'experience_sharing': '경험 공유',
    'complaint': '불만'
  };
  return labels[intent] || intent;
}

// 다음 행동 라벨
function getNextActionLabel(action) {
  const labels = {
    'likely_purchase': '구매 가능성 높음',
    'needs_more_info': '추가 정보 필요',
    'price_sensitive': '가격 민감',
    'needs_consultation': '상담 필요'
  };
  return labels[action] || action;
}

// 리드 상세보기
function viewLeadDetail(commentId) {
  alert(`댓글 ID ${commentId}의 상세 분석 기능은 추후 구현 예정입니다.`);
}

// 회원가입 모달 열기
async function openSignupModal(commentId) {
  selectedComment = commentId;
  const modal = document.getElementById('signup-modal');
  const content = document.getElementById('signup-modal-content');
  
  // 댓글 정보 가져오기
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`/api/blog-analysis/high-conversion-leads`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    const lead = data.leads.find(l => l.id === commentId);
    
    if (!lead) {
      alert('댓글 정보를 찾을 수 없습니다.');
      return;
    }
    
    const userType = lead.user_type_prediction === 'B2C' ? 'B2C' : 'B2B';
    const contextTags = lead.context_tags ? JSON.parse(lead.context_tags) : [];
    
    content.innerHTML = `
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <div class="flex items-center">
          <i class="fas fa-info-circle text-blue-500 text-xl mr-3"></i>
          <div>
            <p class="font-semibold text-blue-800">예측된 사용자 타입: ${userType}</p>
            <p class="text-sm text-blue-700">전환 가능성: ${(lead.conversion_probability * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">댓글 내용</label>
          <div class="bg-gray-50 rounded-lg p-4 text-gray-800">
            ${lead.content}
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">관심사</label>
          <div class="flex flex-wrap gap-2">
            ${contextTags.map(tag => 
              `<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">${tag}</span>`
            ).join('')}
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">추천 메시지</label>
          <textarea id="invitation-message" class="w-full border border-gray-300 rounded-lg p-3" rows="4">${generateInvitationMessage(lead)}</textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">제공 혜택</label>
          <select id="incentive-select" class="w-full border border-gray-300 rounded-lg p-3">
            <option value="welcome_10">신규 회원 10% 할인</option>
            <option value="free_shipping">무료 배송</option>
            <option value="sample_kit">샘플 키트 증정</option>
            <option value="consultation">무료 상담 서비스</option>
          </select>
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('모달 열기 오류:', error);
    alert('댓글 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// 초대 메시지 생성
function generateInvitationMessage(lead) {
  const userType = lead.user_type_prediction === 'B2C' ? 'B2C' : 'B2B';
  const contextTags = lead.context_tags ? JSON.parse(lead.context_tags) : [];
  
  let message = `안녕하세요! 아로마펄스입니다.\n\n`;
  
  if (userType === 'B2C') {
    if (contextTags.includes('insomnia')) {
      message += `불면증으로 고민이시군요. 저희 아로마펄스는 천연 아로마테라피로 편안한 숙면을 도와드립니다.\n\n`;
    } else if (contextTags.includes('stress')) {
      message += `스트레스 관리가 필요하시군요. 향기로운 케어로 일상의 평온을 찾아보세요.\n\n`;
    }
    message += `지금 회원가입하시면 신규 회원 특별 혜택을 드립니다!\n`;
  } else {
    message += `B2B 파트너십에 관심을 가져주셔서 감사합니다.\n\n`;
    message += `기업 맞춤형 아로마테라피 솔루션을 제공하고 있습니다.\n`;
    message += `회원가입 후 전문 상담을 받아보세요.\n`;
  }
  
  message += `\n아로마펄스와 함께 향기로운 변화를 시작하세요!`;
  
  return message;
}

// 회원가입 모달 닫기
function closeSignupModal() {
  document.getElementById('signup-modal').classList.add('hidden');
  selectedComment = null;
}

// 회원가입 초대 발송
async function sendSignupInvitation() {
  if (!selectedComment) return;
  
  const token = localStorage.getItem('auth_token');
  const message = document.getElementById('invitation-message').value;
  const incentive = document.getElementById('incentive-select').value;
  
  try {
    const response = await fetch(`/api/blog-analysis/invite-signup/${selectedComment}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        incentive
      })
    });
    
    if (!response.ok) throw new Error('초대 발송 실패');
    
    alert('회원가입 초대를 발송했습니다!');
    closeSignupModal();
    loadHighConversionLeads(); // 목록 새로고침
  } catch (error) {
    console.error('초대 발송 오류:', error);
    alert('초대 발송 중 오류가 발생했습니다.');
  }
}

// 전체 댓글 로드
async function loadAllComments() {
  const container = document.getElementById('all-comments-list');
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
  
  // TODO: 전체 댓글 로드 구현
  container.innerHTML = '<p class="text-center text-gray-500">전체 댓글 기능은 추후 구현 예정입니다.</p>';
}

// 블로그 포스트 로드
async function loadBlogPosts() {
  const container = document.getElementById('posts-list');
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i></div>';
  
  try {
    const response = await fetch('/api/blog/posts');
    
    if (!response.ok) throw new Error('블로그 포스트 조회 실패');
    
    const data = await response.json();
    const posts = data.posts || [];
    
    if (posts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-6xl mb-4"></i>
          <p class="text-lg">블로그 포스트가 없습니다.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = posts.map(post => `
      <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-800 mb-2">${post.title}</h3>
            <div class="flex items-center space-x-4 text-sm text-gray-500">
              <span><i class="fas fa-calendar mr-1"></i>${new Date(post.published_at).toLocaleDateString('ko-KR')}</span>
              <span><i class="fas fa-eye mr-1"></i>${post.view_count || 0} 조회</span>
              <span><i class="fas fa-comment mr-1"></i>${post.comment_count || 0} 댓글</span>
              <span><i class="fas fa-heart mr-1"></i>${post.like_count || 0} 좋아요</span>
            </div>
          </div>
          <a href="${post.url}" target="_blank" class="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center">
            <i class="fas fa-external-link-alt mr-2"></i>
            보기
          </a>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('블로그 포스트 로드 오류:', error);
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-circle text-6xl mb-4"></i>
        <p class="text-lg">블로그 포스트를 불러오는데 실패했습니다.</p>
      </div>
    `;
  }
}

// 로그아웃
function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}
