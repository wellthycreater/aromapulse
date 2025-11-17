// 전역 변수
let currentUser = null;
let isEditMode = false;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
});

// 프로필 로드
async function loadProfile() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            displayProfile(currentUser);
            
            // 로딩 숨기고 컨텐츠 표시
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('profile-content').classList.remove('hidden');
        } else {
            throw new Error('프로필 로드 실패');
        }
    } catch (error) {
        console.error('Profile load error:', error);
        alert('프로필을 불러올 수 없습니다. 다시 로그인해주세요.');
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    }
}

// 프로필 표시
function displayProfile(user) {
    // 헤더 정보
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'A';
    document.getElementById('user-initial').textContent = initial;
    document.getElementById('user-name').textContent = user.name || '사용자';
    document.getElementById('user-email').textContent = user.email || '-';
    
    // 사용자 유형 뱃지
    const typeBadge = document.getElementById('user-type-badge');
    if (user.user_type === 'B2C') {
        typeBadge.textContent = '개인 고객';
        typeBadge.className = 'px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold';
    } else if (user.user_type === 'B2B') {
        typeBadge.textContent = '비즈니스 고객';
        typeBadge.className = 'px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold';
    }
    
    // 가입일
    if (user.created_at) {
        const date = new Date(user.created_at);
        document.getElementById('user-created').textContent = `가입일: ${date.toLocaleDateString('ko-KR')}`;
    }
    
    // 기본 정보
    document.getElementById('display-name').textContent = user.name || '-';
    document.getElementById('edit-name').value = user.name || '';
    
    document.getElementById('display-phone').textContent = user.phone || '-';
    document.getElementById('edit-phone').value = user.phone || '';
    
    document.getElementById('display-region').textContent = user.region || '-';
    document.getElementById('edit-region').value = user.region || '';
    
    const ageGroupMap = {
        '10s': '10대',
        '20s': '20대',
        '30s': '30대',
        '40s': '40대',
        '50s': '50대',
        '60s_plus': '60대 이상'
    };
    document.getElementById('display-age').textContent = ageGroupMap[user.age_group] || '-';
    document.getElementById('edit-age').value = user.age_group || '';
    
    const genderMap = {
        'male': '남성',
        'female': '여성',
        'other': '기타'
    };
    document.getElementById('display-gender').textContent = genderMap[user.gender] || '-';
    document.getElementById('edit-gender').value = user.gender || '';
    
    // 관심 증상
    if (user.symptoms) {
        let symptoms = [];
        try {
            symptoms = typeof user.symptoms === 'string' ? JSON.parse(user.symptoms) : user.symptoms;
        } catch (e) {
            symptoms = [];
        }
        
        const symptomMap = {
            'insomnia': '😴 불면증',
            'depression': '😔 우울감',
            'anxiety': '😰 불안감',
            'stress': '😤 스트레스',
            'focus': '🎯 집중력 저하',
            'refresh': '✨ 리프레시'
        };
        
        const symptomText = symptoms.length > 0 
            ? symptoms.map(s => symptomMap[s] || s).join(', ')
            : '-';
        document.getElementById('display-symptoms').textContent = symptomText;
    }
    
    // 상세 정보
    displayDetailedInfo(user);
}

// 상세 정보 표시
function displayDetailedInfo(user) {
    const container = document.getElementById('details-container');
    let html = '';
    
    if (user.user_type === 'B2C') {
        // B2C 상세 정보
        html = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-user-tag text-purple-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">스트레스 유형</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.b2c_subcategory || '-'}</p>
                </div>
                
                ${user.work_industry ? `
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-building text-purple-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">업종</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.work_industry}</p>
                </div>` : ''}
                
                ${user.work_role ? `
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-briefcase text-purple-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">직종</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.work_role}</p>
                </div>` : ''}
                
                ${user.company_size ? `
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-users text-purple-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">회사 규모</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.company_size}</p>
                </div>` : ''}
            </div>
        `;
    } else if (user.user_type === 'B2B') {
        // B2B 상세 정보
        html = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-store text-blue-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">비즈니스 유형</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.b2b_category || '-'}</p>
                </div>
                
                ${user.b2b_business_name ? `
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-building text-blue-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">사업자명</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.b2b_business_name}</p>
                </div>` : ''}
                
                ${user.b2b_business_number ? `
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-id-card text-blue-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">사업자등록번호</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.b2b_business_number}</p>
                </div>` : ''}
                
                ${user.b2b_address ? `
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-map-marker-alt text-blue-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">주소</h3>
                    </div>
                    <p class="text-gray-700 text-lg">${user.b2b_address}</p>
                </div>` : ''}
                
                ${user.website ? `
                <div class="info-card border-2 border-gray-200 rounded-xl p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-globe text-blue-600 text-2xl mr-3"></i>
                        <h3 class="text-lg font-bold text-gray-800">웹사이트</h3>
                    </div>
                    <a href="${user.website}" target="_blank" class="text-blue-600 hover:underline">${user.website}</a>
                </div>` : ''}
            </div>
        `;
    }
    
    if (!html) {
        html = `
            <div class="text-center py-12">
                <i class="fas fa-info-circle text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 text-lg">추가 정보가 없습니다</p>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// 탭 전환
function switchTab(tab) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 현재 탭 활성화
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // 모든 탭 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // 현재 탭 컨텐츠 표시
    document.getElementById(`content-${tab}`).classList.remove('hidden');
}

// 수정 모드 전환
function toggleEditMode() {
    isEditMode = !isEditMode;
    
    if (isEditMode) {
        // 표시용 숨기고 입력 필드 표시
        document.querySelectorAll('[id^="display-"]').forEach(el => {
            el.classList.add('hidden');
        });
        document.querySelectorAll('[id^="edit-"]').forEach(el => {
            el.classList.remove('hidden');
        });
        document.getElementById('edit-buttons').classList.remove('hidden');
    } else {
        // 입력 필드 숨기고 표시용 표시
        document.querySelectorAll('[id^="edit-"]').forEach(el => {
            el.classList.add('hidden');
        });
        document.querySelectorAll('[id^="display-"]').forEach(el => {
            el.classList.remove('hidden');
        });
        document.getElementById('edit-buttons').classList.add('hidden');
    }
}

// 수정 취소
function cancelEdit() {
    toggleEditMode();
    // 원래 값으로 복원
    displayProfile(currentUser);
}

// 프로필 저장
async function saveProfile() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
    }
    
    // 업데이트할 데이터 수집
    const updateData = {
        name: document.getElementById('edit-name').value,
        phone: document.getElementById('edit-phone').value,
        region: document.getElementById('edit-region').value,
        age_group: document.getElementById('edit-age').value,
        gender: document.getElementById('edit-gender').value
    };
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            displayProfile(currentUser);
            toggleEditMode();
            showNotification('프로필이 업데이트되었습니다! ✨', 'success');
        } else {
            throw new Error('프로필 업데이트 실패');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('프로필 업데이트에 실패했습니다.', 'error');
    }
}

// 로그아웃
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white font-semibold`;
    notification.style.transform = 'translateY(-100px)';
    notification.style.opacity = '0';
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle'
            } text-2xl"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(-100px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
